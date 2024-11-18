import { rekognition } from "../config/aws";

export const indexFace = async (bucket: string, key: string, externalId: string) => {
  const params = {
    CollectionId: process.env.REKOGNITION_COLLECTION_ID!,
    Image: { S3Object: { Bucket: bucket, Name: key } },
    ExternalImageId: externalId,
    DetectionAttributes: ["ALL"],
  };
  return rekognition.indexFaces(params).promise();
};

export const searchFaceByImage = async (bucket: string, key: string) => {
  const params = {
    CollectionId: process.env.REKOGNITION_COLLECTION_ID!,
    Image: { S3Object: { Bucket: bucket, Name: key } },
    MaxFaces: 1,
    FaceMatchThreshold: 80,
  };
  return rekognition.searchFacesByImage(params).promise();
};
