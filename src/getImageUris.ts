import fs from 'fs';
import path from 'path';

const getImageUris = (directory: string): string[] => {
	const supportedExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];

	try {
		// Read the directory content
		const files = fs.readdirSync(directory);

		// Filter out image files and return their relative URIs
		const imageUris = files
			.filter((file) => supportedExtensions.includes(path.extname(file).toLowerCase()))
			.map((file) => path.join(directory, file)); // Include relative path if needed

		return imageUris;
	} catch (error) {
		console.error(`Error reading directory ${directory}:`, error);
		return [];
	}
};

export default getImageUris;
