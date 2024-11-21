//TODO
1. Add new field `isFaceIndexed` to users table
2. Expose endpoint to index undindexed faces
3. Pull images from s3 bucket
4. Delete images from s3 bucket after processing
5. Create a table of attendances with `userId, campusId, serviceId, faceId, timestamp`
6. Create endpoint to generate bulk presigned urls



FrontEnd
1. Implement UI to take pictures and service Id and campusId
2. Push images to s3 bucket on upload
3. Use concatenate campusId as name and/or pass it in meta data



Considerations
- More clear faces per picture (no blur)
- Campus login so each church uploads their own picture or super admin upload pictures on behalf of the church
- 