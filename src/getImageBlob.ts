import fs from 'fs/promises';

/**
 * Fetch an image as a blob from a given URL.
 * @param url - The URL of the image.
 * @returns A promise resolving to the Blob object.
 */

export const getImageBlob = async (url: string): Promise<ArrayBuffer> => {
	try {
		const response = await fetch(url);

		if (!response.ok) {
			throw new Error(`Failed to fetch image. Status: ${response.status}`);
		}

		const blob = (await response.blob()).arrayBuffer();
		return blob;
	} catch (error) {
		console.error(`Error fetching image blob: ${error}`);
		throw error;
	}
};

export const getLocalImageBlob = async (filePath: string): Promise<ArrayBuffer> => {
	try {
		const fileBuffer = await fs.readFile(filePath); // Reads the file into a Buffer
		console.log({
			fileBuffer,
			timestamp: new Date(),
		});
		return fileBuffer;
	} catch (error) {
		console.error(`Error reading local file ${filePath}:`, error);
		throw error;
	}
};
