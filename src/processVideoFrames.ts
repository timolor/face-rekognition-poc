import { extractFrames } from "./services/videoProcessor";
import { searchFaceByImage } from "./services/rekognition";
import { Match } from "./models/match";
import path from "path";
import { uploadToS3 } from "./services/s3";
import fs from "fs/promises";
import AWS from 'aws-sdk';
const s3 = new AWS.S3();

/**
 * Processes frames from a video and matches faces against attendee profiles.
 * @param videoPath - Path to the video file.
 * @param bucket - S3 bucket for frame storage.
 * @param frameRate - Number of frames to extract per second.
 */
export const processVideoFrames = async (videoPath: string, bucket: string, frameRate: number = 1) => {
  const outputDir = path.join(__dirname, "../temp/frames");
  const framePaths = await extractFrames(videoPath, outputDir, frameRate);
  // console.log(`number of framePaths: ${framePaths.length}`)
  for (const framePath of framePaths) {
    try {
      console.log(framePath)
      // Upload frame to S3
      const frameKey = `frames/${path.basename(framePath)}`;
      const frameBuffer = await fs.readFile(framePath);
      await uploadToS3(bucket, frameKey, frameBuffer);

      // Match face in frame
      const result = await searchFaceByImage(bucket, frameKey);

      if (result.FaceMatches?.length) {
        for (const match of result.FaceMatches) {
          if (match.Face && match.Face.ExternalImageId) {
            const attendeeId = match.Face.ExternalImageId; // Matched attendee ID
            const timestamp = new Date();

            // Save match to MongoDB
            const newMatch = new Match({ attendeeId, timestamp });
            await newMatch.save();
          }
        }
      } else {
        await fs.unlink(framePath);
        console.log(`No faces detected in frame: ${framePath}. Continuing....`);
      }

      // Optionally, delete frame after processing
      //await fs.unlink(framePath);
    } catch (error: any) {
      await fs.unlink(framePath);
      if (error.name === 'InvalidParameterException' && error.message.includes('no faces')) {
        console.log(`No faces detected in frame: ${framePath}. Continuing...`);
      } else {
        console.error(`Error processing frame ${framePath}:`, error);
      }
    } finally {
      // Extract only the relative path (e.g., "frames/frame-001.jpg")
      const s3Key = framePath.startsWith('frames/') ? framePath : `frames/${path.basename(framePath)}`;

      try {
        console.log(`Deleting frame from S3: Bucket = ${bucket}, Key = ${s3Key}`);
        await s3
          .deleteObject({
            Bucket: bucket,
            Key: s3Key,
          })
          .promise();
        console.log(`Deleted frame: ${s3Key} from S3.`);
      } catch (deleteError) {
        console.error(`Error deleting frame ${s3Key} from S3:`, deleteError);
      }
    }
  }

  console.log("Video frames processed successfully.");
};
