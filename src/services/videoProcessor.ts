import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs/promises';

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
			.output(path.join(outputDir, 'frame-%d.jpg'))
			.outputOptions([`-vf fps=${frameRate}`]) // Extract 1 frame per second
			.on('end', async () => {
				console.log('Frames extracted successfully.');
				const files = await fs.readdir(outputDir);
				files.forEach((file) => framePaths.push(path.join(outputDir, file)));

				resolve(framePaths);
			})
			.on('error', (err) => reject(err))
			.run();
	});
};
