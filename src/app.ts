import { connectToDatabase } from './config/db';
import { createFaceCollection } from './createFaceCollection';
import { deleteAllFaces } from './deleteAllFaces';
import { indexAllAttendees } from './indexFaces';
import { processImages } from './processImages';
import path from 'path';
import getImageUris from './getImageUris';

const startApp = async () => {
	await connectToDatabase('fc', process.env.MONGO_URI!);

	const bucket = process.env.S3_BUCKET!;

	const collectionId = 'coza-dev-event-attendees-1';
	await createFaceCollection(collectionId);

	await deleteAllFaces(process.env.REKOGNITION_COLLECTION_ID!);

	// Index faces for all attendees into the collection
	await indexAllAttendees(collectionId, bucket);

	const imagesDirectory = path.join(__dirname, 'images');
	const filePaths = getImageUris(imagesDirectory);

	console.log({ filePaths });

	await processImages({ bucket, filePaths });

	console.log('Image processing complete.');
};

startApp().catch(console.error);
