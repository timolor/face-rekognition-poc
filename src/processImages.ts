import { searchFaceByImage } from './services/rekognition';
import { Match } from './models/match';
import { PromiseResult } from 'aws-sdk/lib/request';
import { AWSError, Rekognition } from 'aws-sdk';
import { connectToDatabase, fcdbUri } from './config/db';
// import { Attendee } from './models/attendee';

interface IProcessImage {
	bucket?: string;
	filePaths?: string[];
	imageKeys?: string[];
	imageUrls?: string[];
}

export const processImages = async ({ bucket, imageKeys, imageUrls, filePaths }: IProcessImage) => {
	const handleMatch = async (result: PromiseResult<Rekognition.SearchFacesByImageResponse, AWSError>) => {
		if (result?.FaceMatches && result.FaceMatches.length > 0) {
			const matchedFaceId = result.FaceMatches[0].Face?.ExternalImageId;

			console.log({ matchedFaceId });

			// TODO: Possibly add more details from Attendee record
			// const attendee = await Attendee.findOne({ _id: matchedFaceId }).lean();

			const fcdb = await connectToDatabase('fc', fcdbUri); // Connect to the database
			const match = fcdb.collection('match');

			await match.insertOne({
				attendeeId: matchedFaceId,
				timestamp: new Date(),
			});

			// const match = new Match({
			// 	attendeeId: matchedFaceId,
			// 	timestamp: new Date(),
			// 	// ...attendee,
			// });

			// await match.save();
		}
	};

	//TODO: To improve performance, setup concurrency here (we can use pLimit)
	if (imageKeys) {
		for (const key of imageKeys) {
			const result = await searchFaceByImage({ bucket, key });
			await handleMatch(result);
		}
	}

	//TODO: To improve performance, setup concurrency here (we can use pLimit)
	if (imageUrls && imageUrls?.length > 0) {
		for (const imageUrl of imageUrls) {
			const result = await searchFaceByImage({ imageUrl });
			await handleMatch(result);
		}
	}

	//TODO: To improve performance, setup concurrency here (we can use pLimit)
	if (filePaths && filePaths?.length > 0) {
		for (const filePath of filePaths) {
			const result = await searchFaceByImage({ filePath });
			console.log({ searchFaceByImage: result });
			await handleMatch(result);
		}
	}
	console.log('Image processing completed.');
};
