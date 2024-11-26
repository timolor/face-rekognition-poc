import AWS from "aws-sdk";

AWS.config.update({ region: process.env.AWS_REGION! });
const rekognition = new AWS.Rekognition();

export const createFaceCollection = async (collectionId: string) => {
  try {
    const result = await rekognition
      .createCollection({ CollectionId: collectionId })
      .promise();
    console.log(`Collection created: ${result.CollectionArn}`);
  } catch (error) {
    console.error("Error creating collection:", error);
  }
};
