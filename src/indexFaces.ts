import AWS from "aws-sdk";
import { Attendee } from "./models/attendee";

const rekognition = new AWS.Rekognition();

/**
 * Indexes faces from profile pictures into the Rekognition collection.
 * @param collectionId - The ID of the Rekognition collection to store faces.
 * @param bucket - The S3 bucket where images are stored.
 */
export const indexFace = async (collectionId: string, bucket: string, imageKey: string, attendeeId: string) => {
  const params = {
    CollectionId: collectionId,
    Image: {
      S3Object: {
        Bucket: bucket,
        Name: imageKey,
      },
    },
    ExternalImageId: attendeeId, // Store attendee ID with face for later matching
  };

  try {
    const response = await rekognition.indexFaces(params).promise();
    console.log(`Indexed face for attendee ${attendeeId}`, response);
    return response;
  } catch (error) {
    console.error("Error indexing face:", error);
    throw error;
  }
};

/**
 * Index faces for all attendees in the collection
 * @param collectionId - The ID of the Rekognition collection.
 * @param bucket - The S3 bucket where profile pictures are stored.
 */
export const indexAllAttendees = async (collectionId: string, bucket: string) => {
  await seedAttendees();
  const attendees = await Attendee.find(); // Get all attendees from DB
  // const attendees = dummyAttendees;
  for (const attendee of attendees) {
    const result = await indexFace(collectionId, bucket, attendee.profilePicture, attendee._id.toString());
    if (result.FaceRecords?.length) {
      if(result.FaceRecords[0].Face){
        console.log(`faceId: ${result.FaceRecords[0].Face.FaceId!}`)
        attendee.faceId = result.FaceRecords[0].Face.FaceId!;
        await attendee.save();
      }
    }
  }

  console.log("All faces indexed.");
};

const dummyAttendees = [
  {
    _id: '636198b2752d51bc96f1cdea',
    name: 'Mane Doe',
    email: 'mane.doe@example.com',
    // profilePicture: 'pp/teb.png', // S3 key
    profilePicture: 'pp/kk.jpeg', // S3 key
  },
  // {
  //   _id: '2',
  //   name: 'Jane Smith',
  //   email: 'jane.smith@example.com',
  //   profilePicture: 'profile-pictures/jane-smith.jpg', // S3 key
  // },
  // {
  //   _id: '3',
  //   name: 'Mike Johnson',
  //   email: 'mike.johnson@example.com',
  //   profilePicture: 'profile-pictures/mike-johnson.jpg', // S3 key
  // },
  // {
  //   _id: '4',
  //   name: 'Emily Brown',
  //   email: 'emily.brown@example.com',
  //   profilePicture: 'profile-pictures/emily-brown.jpg', // S3 key
  // },
  // {
  //   _id: '5',
  //   name: 'Chris Lee',
  //   email: 'chris.lee@example.com',
  //   profilePicture: 'profile-pictures/chris-lee.jpg', // S3 key
  // },
  // {
  //   _id: '6',
  //   name: 'Anna Davis',
  //   email: 'anna.davis@example.com',
  //   profilePicture: 'profile-pictures/anna-davis.jpg', // S3 key
  // },
  // {
  //   _id: '7',
  //   name: 'David Wilson',
  //   email: 'david.wilson@example.com',
  //   profilePicture: 'profile-pictures/david-wilson.jpg', // S3 key
  // },
  // {
  //   _id: '8',
  //   name: 'Sarah Miller',
  //   email: 'sarah.miller@example.com',
  //   profilePicture: 'profile-pictures/sarah-miller.jpg', // S3 key
  // },
];

const seedAttendees = async () => {
  try {
    await Attendee.insertMany(dummyAttendees);
    console.log('Dummy attendees added successfully!');
  } catch (error) {
    console.error('Error inserting dummy attendees:', error);
  }
}
