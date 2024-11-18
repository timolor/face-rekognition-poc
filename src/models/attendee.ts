import mongoose, { Document, ObjectId } from "mongoose";

// Define the Attendee interface
export interface IAttendee extends Document {
  _id: ObjectId; // Explicitly type _id as ObjectId
  name: string;
  email: string;
  profilePicture: string;
  faceId?: string; // Optional field for Rekognition FaceId
}

// Define the schema
const attendeeSchema = new mongoose.Schema<IAttendee>({
  name: { type: String, required: true },
  email: { type: String, required: true },
  profilePicture: { type: String, required: true },
  faceId: { type: String },
});

// Create the model
export const Attendee = mongoose.model<IAttendee>("Attendee", attendeeSchema);
