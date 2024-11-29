import mongoose, { Schema, Document, Model } from 'mongoose';
import { ServiceAttendanceRequest } from '../controllers/attendance.controller';

export interface ServiceAttendance extends Document {
  _id: string;
  serviceId: string;
  serviceName: string;
  campusName: string;
  serviceStartTime: Date;
  processStartTime: Date;
  processEndTime: Date;
  photoUploadCount: number;
  matchCount: number;
  status: 'processing' | 'completed' | 'aborted' | 'failed';
  matchedAttendeeIds: string[] | string;
  unmatchedAttendeeIds: string[] | string;
}

const ServiceAttendanceSchema: Schema = new Schema(
  {
    serviceId: { type: String, required: true },
    serviceName: { type: String, required: true },
    campusName: { type: String, required: true },
    serviceStartTime: { type: Date, required: true },
    processStartTime: { type: Date, required: true },
    processEndTime: { type: Date, required: true },
    photoUploadCount: { type: Number, required: true },
    matchCount: { type: Number, required: true },
    status: {
      type: String,
      enum: ['processing', 'completed', 'aborted', 'failed'],
      required: true,
    },
    matchedAttendeeIds: { type: [String], required: true }, 
    unmatchedAttendeeIds: { type: [String], required: true }, 
  },
  { timestamps: true } 
);


const ServiceAttendanceModel: Model<ServiceAttendance> = mongoose.model<ServiceAttendance>('ServiceAttendance', ServiceAttendanceSchema);

export default ServiceAttendanceModel;

export const mapToServiceAttendance = (
    request: ServiceAttendanceRequest,
  ): ServiceAttendance => {
    const serviceAttendance = new ServiceAttendanceModel({
      campusId: request.campusId,
      serviceId: request.serviceId,
      serviceName: request.serviceName,
      campusName: request.campusName,
      serviceStartTime: request.serviceStartTime,
      processStartTime: new Date(), 
      processEndTime: new Date(), 
      photoUploadCount: 0, 
      matchCount: 0,
      status: 'processing', 
      matchedAttendeeIds: [], 
      unmatchedAttendeeIds: [],
    });
  
    return serviceAttendance; 
  };
