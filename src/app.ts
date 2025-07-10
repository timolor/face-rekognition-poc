import { connectToDatabase, connectToDefaultDatabase } from './config/db';
import { createFaceCollection } from './createFaceCollection';
import { deleteAllFaces } from './deleteAllFaces';
import { indexAllAttendees } from './indexFaces';
import { processImages } from './processImages';
import userRoutes from './routes/user.routes';
import path from 'path';
import getImageUris from './getImageUris';
import { UserCacheService } from './services/userCache.service';
import { CampusService } from './services/campus.service';

import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import { errorMiddleware } from './middleware/error.middleware';
import attendanceRoutes from './routes/attendance.routes';
import cors from 'cors';

declare global {
	var counter: number;
}

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());

connectToDefaultDatabase();

// Initialize caches at startup
const initializeCaches = async () => {
    try {
        // Initialize campus cache first since user cache depends on it
        const campusService = CampusService.getInstance();
        await campusService.initializeCampusCache();
        console.log('Campus cache initialized successfully');
        
        // Then initialize user cache
        const userCacheService = UserCacheService.getInstance();
        await userCacheService.initializeCache();
        console.log('User cache initialized successfully');
    } catch (error) {
        console.error('Failed to initialize caches:', error);
        // Don't stop the server if cache initialization fails
    }
};

// Initialize caches after database connection
initializeCaches();

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
