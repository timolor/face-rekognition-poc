import { searchFaceByImage } from "./services/rekognition";
import { Match } from "./models/match";

export const processImages = async (bucket: string, imageKeys: string[]) => {
  for (const key of imageKeys) {
    const result = await searchFaceByImage(bucket, key);

    if (result.FaceMatches?.length) {
      const matchedFaceId = result.FaceMatches[0].Face.ExternalImageId;

      const match = new Match({
        attendeeId: matchedFaceId,
        timestamp: new Date(),
      });
      await match.save();
    }
  }
  console.log("Image processing completed.");
};
