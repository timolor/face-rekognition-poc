import mongoose, { Schema, Document } from 'mongoose';

export interface IMatch extends Document {
	attendeeId: string; // MongoDB ObjectId of the attendee
	timestamp: Date;
}

const MatchSchema: Schema = new Schema({
	attendeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Attendee', required: true },
	timestamp: { type: Date, default: Date.now },
});

export const Match = mongoose.model<IMatch>('Match', MatchSchema);
