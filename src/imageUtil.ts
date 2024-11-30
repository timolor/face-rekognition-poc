import sharp from 'sharp';


export async function extractFaceImage(imageBytes: Buffer, boundingBox: AWS.Rekognition.BoundingBox): Promise<Buffer> {
    const image = sharp(imageBytes);
  
    const metadata = await image.metadata();
    const width = metadata.width!;
    const height = metadata.height!;
  
    // Calculate the coordinates for cropping based on the bounding box
    const left = Math.round(boundingBox.Left! * width);
    const top = Math.round(boundingBox.Top! * height);
    const cropWidth = Math.round(boundingBox.Width! * width);
    const cropHeight = Math.round(boundingBox.Height! * height);
  
    // Crop the image
    const croppedImage = await image.extract({ left, top, width: cropWidth, height: cropHeight }).toBuffer();
    return croppedImage;
  }