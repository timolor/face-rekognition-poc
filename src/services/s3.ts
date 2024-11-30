import { s3, s3Client } from "../config/aws";
import { DeleteObjectsCommand, GetObjectCommand, ListObjectsV2Command, ListObjectsV2CommandOutput } from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import * as fs from 'fs';

export const uploadToS3 = async (bucket: string, key: string, body: Buffer) => {
  const params = {
    Bucket: bucket,
    Key: key,
    Body: body,
  };
  return s3.upload(params).promise();
};

export const getImageFromS3 = async (bucketName: string, objectKey: string, downloadPath: string): Promise<void> => {
  try {

    const getObjectParams = {
      Bucket: bucketName,
      Key: objectKey,
    };

    const command = new GetObjectCommand(getObjectParams);

    const data = await s3Client.send(command);

    console.log("data: ", data);

    const stream = data.Body as Readable;

    const writeStream = fs.createWriteStream(downloadPath);
    stream.pipe(writeStream);

    writeStream.on('close', () => {
      console.log(`File downloaded successfully to ${downloadPath}`);
    });

  } catch (error) {
    console.error('Error downloading image from S3:', error);
  }
}

export const listImagesInBucket = async (bucketName: string, folderPath: string): Promise<string[]> => {
  const imageFiles: string[] = []; 
  let isTruncated = true; 
  let nextContinuationToken: string | undefined = undefined;

  try {
    // Loop to handle pagination if there are multiple pages of objects
    while (isTruncated) {
      const params = {
        Bucket: bucketName,
        Prefix: folderPath,
        ContinuationToken: nextContinuationToken,
      };

      const command = new ListObjectsV2Command(params);
      const data: ListObjectsV2CommandOutput = await s3Client.send(command);

      data.Contents?.forEach((item) => {
        const fileName = item.Key || '';

        if (isImage(fileName)) {
          imageFiles.push(fileName);
        }
      });

      isTruncated = data.IsTruncated ?? false;
      nextContinuationToken = data.NextContinuationToken;
    }

    console.log('Found images:', imageFiles);
    return imageFiles;
  } catch (error) {
    console.error('Error listing images from S3:', error);
    return [];
  }
}

export const deleteImagesInFolder = async (bucketName: string, folderPath: string): Promise<void> => {
  try {
    let isTruncated = true;
    let nextContinuationToken: string | undefined = undefined;
    const imagesToDelete: { Key: string }[] = []; 

    while (isTruncated) {
      const params = {
        Bucket: bucketName,
        Prefix: folderPath,
        ContinuationToken: nextContinuationToken,
      };

      const listCommand: any = new ListObjectsV2Command(params);
      const data: ListObjectsV2CommandOutput = await s3Client.send(listCommand);

      data.Contents?.forEach((item) => {
        const fileName = item.Key || '';
        if (isImage(fileName)) {
          imagesToDelete.push({ Key: fileName });
        }
      });

      isTruncated = data.IsTruncated ?? false;
      nextContinuationToken = data.NextContinuationToken;
    }

    if (imagesToDelete.length > 0) {
      const deleteParams = {
        Bucket: bucketName,
        Delete: {
          Objects: imagesToDelete, 
          Quiet: false, 
        },
      };

      const deleteCommand = new DeleteObjectsCommand(deleteParams);
      const deleteResponse = await s3Client.send(deleteCommand);

      console.log('Deleted objects:', deleteResponse.Deleted);
    } else {
      console.log('No images found to delete.');
    }
  } catch (error) {
    console.error('Error deleting images from S3:', error);
  }
}

export const getImageBufferFromS3 = async (bucketName: string, key: string): Promise<Buffer> => {
  const params = {
    Bucket: bucketName,
    Key: key,
  };

  try {
    const data = await s3.getObject(params).promise();
   
    return data.Body as Buffer;
  } catch (err) {
    console.error('Error fetching image from S3:', err);
    throw new Error('Could not retrieve the image from S3.');
  }
}

const isImage = (fileName: string): boolean => {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
  return imageExtensions.some((ext) => fileName.toLowerCase().endsWith(ext));
}