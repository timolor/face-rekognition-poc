import { Rekognition } from 'aws-sdk';
import { rekognition } from '../config/aws';
import { getImageBlob, getLocalImageBlob } from '../getImageBlob';

export interface IIndexFace extends IProcessFace {
	externalId: string;
}

export interface Face {
    FaceId: string;
    ExternalImageId?: string;
    Confidence: number;
    Timestamp: number;
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

export async function listFaces(collectionId: string): Promise<Face[]> {
	const params: AWS.Rekognition.ListFacesRequest = {
	  CollectionId: collectionId,
	  MaxResults: 1000, // Optional: Adjust max results if needed
	};
  
	try {
	  let faces: Face[] = [];
	  let nextToken: string | undefined = undefined;
  
	  // Paginate through the results if necessary
	  do {
		if (nextToken) {
		  params.NextToken = nextToken;
		}
  
		const response: any = await rekognition.listFaces(params).promise();
		faces = faces.concat(response.Faces || []);
  
		// If there is a next token, get the next page of results
		nextToken = response.NextToken;
	  } while (nextToken);
  
	  // Log the list of faces
	  console.log(faces);
	  return faces;
	} catch (error) {
	  console.error('Error listing faces:', error);
	}
	return [];
  }
  