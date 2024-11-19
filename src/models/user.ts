import { ObjectId } from 'mongoose';
// TODO: Currently configured for COZA Workforce App for test
// Define the User interface
export interface IUser {
	_id: ObjectId;
	first_name: string;
	last_name: string;
	email: string;
	profile_picture: string;
	phone: string;
	username: string;
	// nextOfKin: string;
	// nextOfKinPhoneNo: string;
	// address: string;
	// campusId?: string;
	// departmentId?: string;
	faceId?: string; // Optional field for Rekognition FaceId
}
