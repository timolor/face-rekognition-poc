import mongoose, { Document, ObjectId } from 'mongoose';
import { IUser } from './user';

// Define the Attendee interface
export interface IAttendee extends Document {
	_id: ObjectId; // Explicitly type _id as ObjectId
	faceId?: string; // Optional field for Rekognition FaceId
}

// Define the schema
const attendeeSchema = new mongoose.Schema<IAttendee>({
	// first_name: { type: String, required: true },
	// last_name: { type: String, required: true },
	// email: { type: String, required: true },
	// profile_picture: { type: String, required: true },
	// phone: { type: String },
	// username: { type: String },
	// faceId: { type: String },
});

// Create the model
export const Attendee = mongoose.model<IAttendee>('Attendee', attendeeSchema);
