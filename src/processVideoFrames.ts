import { extractFrames } from "./services/videoProcessor";
import { searchFaceByImage } from "./services/rekognition";
import { Match } from "./models/match";
import path from "path";
import { uploadToS3 } from "./services/s3";
import fs from "fs/promises";
import AWS from 'aws-sdk';
import { UserCacheService } from './services/userCache.service';
const s3 = new AWS.S3();

/**
 * Processes frames from a video and matches faces against attendee profiles.
 * @param videoPath - Path to the video file.
 * @param bucket - S3 bucket for frame storage.
 * @param frameRate - Number of frames to extract per second.
 */
export const processVideoFrames = async (frameBuffers: Buffer[], serviceId: string, campusId: string, serviceName: string, campusName: string) => {
    let faceMatched = 0;
    let unmatchedFaces = 0;
    const matchedAttendeeIds = new Set<string>();
    const userCacheService = UserCacheService.getInstance();

    try {
        for (const frameBuffer of frameBuffers) {
            const result = await searchFaceByImage({ imageBuffer: frameBuffer });

            if (result?.FaceMatches && result.FaceMatches.length > 0) {
                for (const faceMatch of result.FaceMatches) {
                    const matchedFaceId = faceMatch.Face?.ExternalImageId;

                    if (matchedFaceId && !matchedAttendeeIds.has(matchedFaceId)) {
                        faceMatched++;
                        console.log({ matchedFaceId });

                        // Get user's actual campus information from cache
                        const userCampusInfo = userCacheService.getUserCampusInfo(matchedFaceId);
                        const user = userCacheService.getUserById(matchedFaceId);

                        if (user) {
                            console.log(`User ${user.first_name} ${user.last_name} matched from user campus: ${userCampusInfo.campusName} (${userCampusInfo.campusId})`);
                        } else {
                            console.log(`User ${matchedFaceId} not found in cache`);
                        }

                        // Save match to MongoDB
                        const match = new Match({
                            attendeeId: matchedFaceId,
                            serviceId: serviceId,
                            campusId: campusId, // Keep original request campus data
                            serviceName: serviceName,
                            campusName: campusName, // Keep original request campus data
                            userCampusId: userCampusInfo.campusId, // Add user's actual campus ID
                            userCampusName: userCampusInfo.campusName, // Add user's actual campus name
                            timestamp: new Date()
                        });
                        await match.save();

                        matchedAttendeeIds.add(matchedFaceId);
                    }
                }
            } else {
                unmatchedFaces++;
            }
        }

        console.log(`Video processing completed: ${faceMatched} faces matched, ${unmatchedFaces} unmatched faces`);
        return { faceMatched, unmatchedFaces };
    } catch (error) {
        console.error('Error processing video frames:', error);
        throw error;
    }
};
