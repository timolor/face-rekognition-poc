import { connectToDatabase } from "./config/db";
import { createFaceCollection } from "./createFaceCollection";
import { deleteAllFaces } from "./deleteAllFaces";
import { indexAllAttendees } from "./indexFaces";
import { processVideoFrames } from "./processVideoFrames";

const startApp = async () => {
  await connectToDatabase();

  const bucket = process.env.S3_BUCKET!;
  const videoPath = "src/videos/input_video.mp4";

  const collectionId = "event-attendees";
  //await createFaceCollection(collectionId);


  await deleteAllFaces(process.env.REKOGNITION_COLLECTION_ID!);

   // Index faces for all attendees into the collection
   await indexAllAttendees(collectionId, bucket);

  await processVideoFrames(videoPath, bucket, 1); // Extract 1 frame per second

  console.log("Video processing complete.");
};

startApp().catch(console.error);
