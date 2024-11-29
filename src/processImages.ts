import { searchFaceByImage } from './services/rekognition';
import { Match } from './models/match';
import { PromiseResult } from 'aws-sdk/lib/request';
import { AWSError, Rekognition } from 'aws-sdk';
import { connectToDatabase, fcdbUri } from './config/db';
import { ServiceAttendanceRequest } from './controllers/attendance.controller';
import ServiceAttendanceModel from './models/service-attendance';
// import { Attendee } from './models/attendee';

interface IProcessImage {
	bucket?: string;
	filePaths?: string[];
	imageKeys?: string[];
	imageUrls?: string[];
	campusName?: string;
	data?: ServiceAttendanceRequest;
	serviceAttendanceId?: string;
}

export const processImages = async ({ bucket, imageKeys, imageUrls, filePaths, data, serviceAttendanceId }: IProcessImage) => {
	let faceMatched = 0;
	let photoUploadCount = 0;
	try{
		const handleMatch = async (result: PromiseResult<Rekognition.SearchFacesByImageResponse, AWSError>) => {
			if (result?.FaceMatches && result.FaceMatches.length > 0) {
				const matchedFaceId = result.FaceMatches[0].Face?.ExternalImageId;
				faceMatched++;
				console.log({ matchedFaceId });
	
				// TODO: Possibly add more details from Attendee record
				// const attendee = await Attendee.findOne({ _id: matchedFaceId }).lean();
	
				const fcdb = await connectToDatabase('fc', fcdbUri); // Connect to the database
				const match = fcdb.collection('match');
	
				await match.insertOne({
					memberId: matchedFaceId,
					serviceId: data?.serviceId,
					campusId: data?.campusId,
					serviceName: data?.serviceName,
					campusName: data?.campusName,
					timestamp: new Date(),
				});
	
				// const match = new Match({
				// 	attendeeId: matchedFaceId,
				// 	timestamp: new Date(),
				// 	// ...attendee,
				// });
	
				// await match.save();
			}
		};
	
		//TODO: To improve performance, setup concurrency here (we can use pLimit)
		if (imageKeys) {
			photoUploadCount = imageKeys.length;
			for (const key of imageKeys) {
				const result = await searchFaceByImage({ bucket, key });
				await handleMatch(result);
			}
		}
	
		//TODO: To improve performance, setup concurrency here (we can use pLimit)
		if (imageUrls && imageUrls?.length > 0) {
			photoUploadCount = imageUrls.length;
			for (const imageUrl of imageUrls) {
				const result = await searchFaceByImage({ imageUrl });
				await handleMatch(result);
			}
		}
	
		//TODO: To improve performance, setup concurrency here (we can use pLimit)
		if (filePaths && filePaths?.length > 0) {
			photoUploadCount = filePaths.length;
			for (const filePath of filePaths) {
				const result = await searchFaceByImage({ filePath });
				console.log({ searchFaceByImage: result });
				await handleMatch(result);
			}
		}
		
		const serviceAttendance = await ServiceAttendanceModel.findById(serviceAttendanceId);
		if(!serviceAttendance) return;
		serviceAttendance.status = "completed";
		serviceAttendance.photoUploadCount = photoUploadCount;
		serviceAttendance.matchCount = faceMatched;
		serviceAttendance.processEndTime = new Date();
		serviceAttendance?.save()
	

		console.log('Image processing completed.');
	}catch(error){
		console.error('Error during processImages task:', error);
	}
	
};
