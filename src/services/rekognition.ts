import { Rekognition } from 'aws-sdk';
import { rekognition } from '../config/aws';
import { getImageBlob, getLocalImageBlob } from '../getImageBlob';

export interface IIndexFace extends IProcessFace {
	externalId: string;
}

export const indexFace = async ({ bucket, key, externalId, imageUrl, filePath }: IIndexFace) => {
	const params = {
		CollectionId: process.env.REKOGNITION_COLLECTION_ID!,
		Image:
			bucket && key
				? { S3Object: { Bucket: bucket, Name: key } }
				: { Bytes: filePath ? await getLocalImageBlob(filePath) : await getImageBlob(imageUrl as string) }, // Fallback to fetch blob if not hosted on S3
		ExternalImageId: externalId,
		DetectionAttributes: ['ALL'],
	};
	return rekognition.indexFaces(params).promise();
};

export interface IProcessFace {
	bucket?: string;
	key?: string;
	filePath?: string;
	imageUrl?: string;
}

export const searchFaceByImage = async ({ bucket, key, imageUrl, filePath }: IProcessFace) => {
	const params: Rekognition.SearchFacesByImageRequest = {
		CollectionId: process.env.REKOGNITION_COLLECTION_ID!,
		Image:
			bucket && key
				? { S3Object: { Bucket: bucket, Name: key } }
				: { Bytes: filePath ? await getLocalImageBlob(filePath) : await getImageBlob(imageUrl as string) },
		MaxFaces: 20, 
		FaceMatchThreshold: 80,
	};

	return rekognition.searchFacesByImage(params).promise();
};
