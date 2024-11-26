import { connectToDatabase, connectToDefaultDatabase } from './config/db';
import { createFaceCollection } from './createFaceCollection';
import { deleteAllFaces } from './deleteAllFaces';
import { indexAllAttendees } from './indexFaces';
import { processImages } from './processImages';
import userRoutes from './routes/user.routes';
import path from 'path';
import getImageUris from './getImageUris';

import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import { errorMiddleware } from './middleware/error.middleware';
import attendanceRoutes from './routes/attendance.routes';

declare global {
	var counter: number;
}

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

connectToDefaultDatabase();

global.counter = 1;

app.use(express.json());

app.get('/', (req: Request, res: Response) => {
	res.send('Hello, World!');
});

app.use('/api/v1/user', userRoutes);
app.use('/api/v1/attendance', attendanceRoutes);

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
	errorMiddleware(err, req, res, next);
});

app.listen(port, () => {
	console.log(`Server is running at http://localhost:${port}`);
});

// const startApp = async () => {
// 	await connectToDatabase('fc', process.env.MONGO_URI!);

// 	const bucket = process.env.S3_BUCKET!;

// 	const collectionId = process.env.REKOGNITION_COLLECTION_ID!;
// 	// await createFaceCollection(collectionId);

// 	// await deleteAllFaces(process.env.REKOGNITION_COLLECTION_ID!);

// 	// // Index faces for all attendees into the collection
// 	// await indexAllAttendees(collectionId, bucket);

// 	const imagesDirectory = path.join(__dirname, 'images');
// 	const filePaths = getImageUris(imagesDirectory);

// 	console.log({ filePaths });

// 	await processImages({ bucket, filePaths });

// 	console.log('Image processing complete.');
// };

// startApp().catch(console.error);
