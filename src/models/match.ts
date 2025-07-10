import mongoose, { Schema, Document } from 'mongoose';

export interface IMatch extends Document {
	attendeeId: string; // MongoDB ObjectId of the attendee
	serviceId: string;
	campusId: string;
	serviceName: string;
	campusName: string;
	userCampusId?: string; 
	userCampusName?: string; 
	timestamp: Date;
}

const MatchSchema: Schema = new Schema({
	memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'Attendee', required: true },
	serviceId: { type: String },
	campusId: { type: String },
	serviceName: { type: String },
	campusName: { type: String },
	userCampusId: { type: String }, 
	userCampusName: { type: String }, 
	timestamp: { type: Date, default: Date.now },
});

export const Match = mongoose.model<IMatch>('Match', MatchSchema);
