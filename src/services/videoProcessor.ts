import ffmpeg from "fluent-ffmpeg";
import path from "path";
import fs from "fs/promises";

/**
 * Extracts frames from a video at regular intervals.
 * @param videoPath - Path to the video file.
 * @param outputDir - Directory to store extracted frames.
 * @param frameRate - Number of frames to extract per second.
 */
export const extractFrames = async (videoPath: string, outputDir: string, frameRate: number = 1) => {
  await fs.mkdir(outputDir, { recursive: true }); // Ensure the output directory exists

  return new Promise<string[]>((resolve, reject) => {
    const framePaths: string[] = [];

    ffmpeg(videoPath)
      .output(path.join(outputDir, "frame-%d.jpg"))
      .outputOptions([`-vf fps=${frameRate}`]) // Extract 1 frame per second
      .on("end", async () => {
        console.log("Frames extracted successfully.");
        const files = await fs.readdir(outputDir);
        files.forEach((file) => framePaths.push(path.join(outputDir, file)));
        
        resolve(framePaths);
      })
      .on("error", (err) => reject(err))
      .run();
  });
};


// import { exec } from "child_process";
// import path from "path";
// import { promisify } from "util";

// const execPromise = promisify(exec);

// /**
//  * Extracts frames from a video file.
//  * @param videoPath - Path to the input video.
//  * @param outputDir - Directory to save the extracted frames.
//  * @param frameRate - Number of frames to extract per second.
//  * @returns - Array of paths to the extracted frames.
//  */
// export const extractFrames = async (
//   videoPath: string,
//   outputDir: string,
//   frameRate: number
// ): Promise<string[]> => {
//   // Ensure output directory ends with a slash
//   const outputPattern = path.join(outputDir, "frame-%03d.jpg");

//   try {
//     // Extract frames using ffmpeg
//     const command = `ffmpeg -i "${videoPath}" -vf fps=${frameRate} "${outputPattern}" -hide_banner -loglevel error`;
//     await execPromise(command);

//     // Collect all extracted frame paths
//     const frames = [];
//     for (let i = 1; ; i++) {
//       const framePath = path.join(outputDir, `frame-${i.toString().padStart(3, "0")}.jpg`);
//       try {
//         // Check if the frame file exists
//         await fs.access(framePath);
//         frames.push(framePath);
//       } catch {
//         break; // Exit the loop if no more frames
//       }
//     }

//     return frames;
//   } catch (error) {
//     console.error("Error extracting frames:", error);
//     throw error;
//   }
// };

