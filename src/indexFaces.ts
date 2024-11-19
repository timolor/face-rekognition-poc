import AWS from 'aws-sdk';
import { Attendee, IAttendee } from './models/attendee';
// import { getAppUsersWithPictureUrl } from './getUsers';
import { getImageBlob } from './getImageBlob';
import { connectToDatabase, fcdbUri } from './config/db';
import dummyData from '../data/coza.users.guzape.json';

const rekognition = new AWS.Rekognition();

/**
 * Indexes faces from profile pictures into the Rekognition collection.
 * @param collectionId - The ID of the Rekognition collection to store faces.
 * @param bucket - The S3 bucket where images are stored.
 */

interface IndexFaceArgs {
	collectionId: string;
	bucket?: string;
	imageKey?: string;
	imageUrl?: string;
	attendeeId: string;
}
export const indexFace = async ({ collectionId, bucket, imageKey, imageUrl, attendeeId }: IndexFaceArgs) => {
	const params = {
		CollectionId: collectionId,
		Image:
			bucket && imageKey
				? { S3Object: { Bucket: bucket, Name: imageKey } }
				: { Bytes: await getImageBlob(imageUrl as string) }, // Fallback to fetch blob if not hosted on S3
		ExternalImageId: attendeeId, // Store attendee ID with face for later matching
	};

	try {
		const response = await rekognition.indexFaces(params).promise();
		console.log(`Indexed face for attendee ${attendeeId}`, response);
		return response;
	} catch (error) {
		console.error('Error indexing face:', error);
		throw error;
	}
};

/**
 * Index faces for all attendees in the collection
 * @param collectionId - The ID of the Rekognition collection.
 * @param bucket - The S3 bucket where profile pictures are stored.
 */
export const indexAllAttendees = async (collectionId: string, bucket?: string) => {
	//TODO: After massive initial seed, we can incrementally seed only new users added to the app/database
	await seedAttendees();

	const fcdb = await connectToDatabase('fc', fcdbUri); // Connect to the database
	const attendees = await fcdb.collection('attendees').find().toArray();

	console.log({ attendees });

	//TODO: To improve performance, setup concurrency here (we can use pLimit)
	for (const attendee of attendees as any) {
		const result = await indexFace({
			collectionId,
			imageUrl: attendee.pictureUrl,
			attendeeId: attendee._id.toString(),
		});

		if (result.FaceRecords?.length) {
			if (result.FaceRecords[0].Face) {
				console.log(`faceId: ${result.FaceRecords[0].Face.FaceId!}`);
				attendee.faceId = result.FaceRecords[0].Face.FaceId!;
				// await attendee.save();
			}
		}
	}

	console.log('All faces indexed.');
};

/**
 * Index faces for all attendees in the collection
 * @param collectionId - The ID of the Rekognition collection.
 * @param bucket - The S3 bucket where profile pictures are stored.
 */
export const indexAttendees = async (collectionId: string, bucket: string) => {
	//TODO: After massive initial seeding, we can incrementally seed only new users added to the app/database
	// await seedNewAttendees();

	const attendees = await Attendee.find(); // Get new attendees from DB

	//TODO: Index only new attendees after massive initial seeding
	//TODO: To improve performance, setup concurrency here (we can use pLimit)
	for (const attendee of attendees) {
		const result = await indexFace({
			collectionId,
			imageUrl: attendee.profile_picture,
			attendeeId: attendee._id.toString(),
		});

		if (result.FaceRecords?.length) {
			if (result.FaceRecords[0].Face) {
				console.log(`faceId: ${result.FaceRecords[0].Face.FaceId!}`);
				attendee.faceId = result.FaceRecords[0].Face.FaceId!;
				// await attendee.save();
			}
		}
	}

	console.log('All faces indexed.');
};

const seedAttendees = async () => {
	try {
		const payload = dummyData;
		// await getAppUsersWithPictureUrl();

		const appUsers = payload;
		// .filter((user: any) => !!user.pictureUrl)
		// .map<Partial<IAttendee>>((user: any) => {
		// 	return {
		// 		_id: (user._id as any).toString(),
		// 		firstName: user.firstName,
		// 		lastName: user.lastName,
		// 		email: user.email,
		// 		pictureUrl: user.pictureUrl,
		// 		faceId: user.faceId,
		// 	};
		// });

		console.log('App Users -->', appUsers);

		const fcdb = await connectToDatabase('fc', fcdbUri); // Connect to the database
		const attendees = fcdb.collection('attendees');

		await attendees.insertMany(appUsers as any);
		console.log('Attendees added successfully!');
	} catch (error) {
		console.error('Error inserting attendees:', error);
	}
};
