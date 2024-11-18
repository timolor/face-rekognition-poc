import AWS from 'aws-sdk';

const rekognition = new AWS.Rekognition();

/**
 * Deletes all faces from a Rekognition collection.
 * @param collectionId - The Rekognition collection ID.
 */
export const deleteAllFaces = async (collectionId: string) => {
  try {
    console.log(`Fetching all faces from collection: ${collectionId}`);
    let facesToDelete: string[] = [];
    let paginationToken: string | undefined = undefined;

    do {
      const response = await rekognition
        .listFaces({
          CollectionId: collectionId,
          MaxResults: 1000, // Maximum results per request
          NextToken: paginationToken, // Handle pagination
        })
        .promise();

      // Collect all FaceIds
      if (response.Faces) {
        const faceIds = response.Faces.map((face) => face.FaceId).filter(Boolean) as string[];
        facesToDelete.push(...faceIds);
      }

      paginationToken = response.NextToken;
    } while (paginationToken);

    console.log(`Total faces to delete: ${facesToDelete.length}`);

    // Batch delete faces (up to 1000 per deleteFaces request)
    if (facesToDelete.length > 0) {
      const deleteResponse = await rekognition
        .deleteFaces({
          CollectionId: collectionId,
          FaceIds: facesToDelete,
        })
        .promise();

      console.log(`Deleted Faces: ${deleteResponse.DeletedFaces}`);
    } else {
      console.log('No faces found in the collection.');
    }
  } catch (error) {
    console.error('Error deleting faces:', error);
  }
};

