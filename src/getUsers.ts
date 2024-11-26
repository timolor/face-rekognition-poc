import { connectToDatabase, fcdbUri } from './config/db';
import { Attendee, IAttendee } from './models/attendee';
import { IUser } from './models/user';

const cozadbUri = process.env.COZA_MONGO_URI!;
export const getAppUsersWithPictureUrl = async (): Promise<IUser[]> => {
	try {
		const cozadb = await connectToDatabase('COZAApp', cozadbUri); // Connect to the database
		const userCollection = cozadb.collection('userprofiles');

		console.log('Collection in the database:', userCollection?.collectionName);

		if (userCollection) {
			const users = await userCollection
				.find({
					departmentId: '6414d6841cbe4cc79e1552d0', //TODO: Experimental for just Avalanche Lagos
					pictureUrl: { $exists: true, $ne: '' },
				})
				.limit(20) // TODO: Experimental limit
				.toArray();
			console.log('Users with profile picture:', users);

			return users as unknown as Array<IUser>;
		} else {
			console.log('User collection does not exist.');
			return [];
		}
	} catch (error) {
		console.error('Error fetching users with pictureUrl:', error);
		throw error; // Throw error after logging
	}
};

export const getAttendees = async (): Promise<Array<IAttendee>> => {
	try {
		// Fetch all app users
		const fcdb = await connectToDatabase('fc', fcdbUri); // Connect to the database
		const attendees = await fcdb
			.collection('attendees')
			.find({ pictureUrl: { $exists: true, $ne: '' } })
			.toArray();

		// console.log({ attendees });

		return attendees as any;
	} catch (error) {
		console.error('Error fetching attendees with picture_url:', error);
		throw error;
	}
};
