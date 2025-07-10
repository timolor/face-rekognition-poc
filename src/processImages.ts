import { detectFaceByImage, searchFaceByImage } from './services/rekognition';
import { PromiseResult } from 'aws-sdk/lib/request';
import { AWSError, Rekognition } from 'aws-sdk';
import { connectToDatabase, fcdbUri } from './config/db';
import { ServiceAttendanceRequest } from './controllers/attendance.controller';
import ServiceAttendanceModel from './models/service-attendance';
import { getImageBufferFromS3 } from './services/s3';
import { extractFaceImage } from './imageUtil';
import { getLocalImageBlob } from './getImageBlob';
import { UserCacheService } from './services/userCache.service';
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
	let unmatchedFaces = 0;

	try {

		const serviceAttendance = await ServiceAttendanceModel.findById(serviceAttendanceId);
		if (!serviceAttendance) {
			console.error('Service attendance not found.');
			return;
		}

		const matchedAttendeeIds = new Set(serviceAttendance.matchedAttendeeIds.map(id => id.toString()));
		const userCacheService = UserCacheService.getInstance();

		const handleMatch = async (result: PromiseResult<Rekognition.SearchFacesByImageResponse, AWSError>) => {
			if (result?.FaceMatches && result.FaceMatches.length > 0) {
				for (const faceMatch of result?.FaceMatches) {
					const matchedFaceId = faceMatch.Face?.ExternalImageId;

					if (matchedFaceId && !matchedAttendeeIds.has(matchedFaceId)) {
						faceMatched++;
						console.log({ matchedFaceId });

						// Get user's actual campus information from cache
						const userCampusInfo = userCacheService.getUserCampusInfo(matchedFaceId);
						const user = userCacheService.getUserById(matchedFaceId);

						if (user) {
							console.log(`User ${user.first_name} ${user.last_name} matched from user campus: ${userCampusInfo.campusName} (${userCampusInfo.campusId})`);
						} else {
							console.log(`User ${matchedFaceId} not found in cache`);
						}

						const fcdb = await connectToDatabase('fc', fcdbUri);
						const match = fcdb.collection('match');

						await match.insertOne({
							memberId: matchedFaceId,
							serviceId: data?.serviceId,
							campusId: data?.campusId, // Keep original request campus data
							serviceName: data?.serviceName,
							campusName: data?.campusName, // Keep original request campus data
							userCampusId: userCampusInfo.campusId, // Add user's actual campus ID
							userCampusName: userCampusInfo.campusName, // Add user's actual campus name
							timestamp: new Date(),
						});

						matchedAttendeeIds.add(matchedFaceId);
					}
				}
			} else {
				unmatchedFaces++;
			}
		};

		if (imageKeys) {
			photoUploadCount = imageKeys.length;
			for (const key of imageKeys) {
				const imageBuffer = await getImageBufferFromS3(bucket!, key);
				const facesDetected = await detectFaceByImage({ imageBuffer });

				for (const detectedFace of facesDetected) {
					try {
						const boundingBox = detectedFace.BoundingBox;
						const faceImageBytes = await extractFaceImage(imageBuffer, boundingBox!);
						const result = await searchFaceByImage({ bucket, imageBuffer: faceImageBytes });
						await handleMatch(result);
					} catch (err) {
						console.log('error in searchFaceByImage: ', err);
					}
				}
			}
		}

		if (imageUrls && imageUrls.length > 0) {
			photoUploadCount = imageUrls.length;
			for (const imageUrl of imageUrls) {
				const result = await searchFaceByImage({ imageUrl });
				await handleMatch(result);
			}
		}

		if (filePaths && filePaths.length > 0) {
			photoUploadCount = filePaths.length;
			for (const filePath of filePaths) {
				const imageBuffer = await getLocalImageBlob(filePath);
				const facesDetected = await detectFaceByImage({ imageBuffer: Buffer.from(imageBuffer) });

				for (const detectedFace of facesDetected) {
					try {
						const boundingBox = detectedFace.BoundingBox;
						const faceImageBytes = await extractFaceImage(Buffer.from(imageBuffer), boundingBox!);
						const result = await searchFaceByImage({ bucket, imageBuffer: faceImageBytes });
						await handleMatch(result);
					} catch (err) {
						console.log('error in searchFaceByImage: ', err);
					}
				}
			}
		}

		serviceAttendance.status = 'completed';
		serviceAttendance.photoUploadCount += photoUploadCount;
		serviceAttendance.matchCount += faceMatched;
		serviceAttendance.matchedAttendeeIds = Array.from(matchedAttendeeIds);
		serviceAttendance.processEndTime = new Date();
		await serviceAttendance.save();

		console.log('Image processing completed.');

		return { unmatchedFaces };
	} catch (error) {
		console.error('Error during processImages task:', error);
	}
};

