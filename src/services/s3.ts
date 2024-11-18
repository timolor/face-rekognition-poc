import { s3 } from "../config/aws";

export const uploadToS3 = async (bucket: string, key: string, body: Buffer) => {
  const params = {
    Bucket: bucket,
    Key: key,
    Body: body,
  };
  return s3.upload(params).promise();
};
