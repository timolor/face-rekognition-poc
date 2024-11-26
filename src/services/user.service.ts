import { HttpException } from "../errors/HttpException";
import { indexFace } from "../indexFaces";
import { IUser, UserResponse } from "../models/user";
import axios, { AxiosResponse } from 'axios';

const COZA_API_BASE_URL = process.env.COZA_API_BASE_URL || "http://localhost:7003/api/v1/"
const COZA_API_JWT = process.env.COZA_API_JWT!;
const collectionId = process.env.REKOGNITION_COLLECTION_ID!;


export class UserService {

    async indexFaces() {


        const members: IUser[] = await this.getMembers();
        for (const member of members) {
            if (!member.profile_picture || member.profile_picture.trim() === "") continue;
            if(member.isFaceIndexed) continue;
            try {

                const result = await indexFace({
                    collectionId,
                    imageUrl: member.profile_picture,
                    attendeeId: member._id.toString(),
                });
                console.log("index face result: ", result);
                if (result.FaceRecords?.length) {
                    if (result.FaceRecords[0].Face) {
                        console.log(`faceId: ${result.FaceRecords[0].Face.FaceId!}`);
                        await this.updateIndexedMember(member.id, result.FaceRecords[0].Face.FaceId!);
                    }
                }
            } catch (error) {
                console.log("failed to index member: ", member)
            }
        }
        return members;
    }

    async getMembers(): Promise<IUser[]> {
        try {
            let config = {
                method: 'get',
                url: `${COZA_API_BASE_URL}user/list?page=${global.counter}&pageSize=100`,
                headers: { 'accept': '*/*', 
                    'Authorization': `Bearer ${COZA_API_JWT}` 
                }
            };

            const response: AxiosResponse<UserResponse> = await axios.request(config);
            if (response.status === 200 && response.data.data.users.length > 0) {
                global.counter++;
                return response.data.data.users;
            }
            throw new HttpException(404, "User not found");
        } catch (error) {
            console.error('Error fetching user list:', error);
            throw new HttpException(500, "Error fetching user list");
        }
    }

    async updateIndexedMember(userId: string, faceId: string): Promise<IUser[]> {
        console.log(`about to update member: ${userId} and faceId: ${faceId}`);
        try {
            let data = JSON.stringify({
                "isFaceIndexed": true,
                "faceId": faceId
            });
            let config = {
                method: 'put',
                url: `${COZA_API_BASE_URL}user/profile/update/${userId}`,
                headers: {
                    'accept': '*/*',
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${COZA_API_JWT}` 
                },
                data: data
            };

            const response: AxiosResponse<UserResponse> = await axios.request(config);
            if (response.status === 200) {
                console.log("update response: ", response);
                return response.data.data.users;
            }
            throw new HttpException(400, "Failed to update user");
        } catch (error) {
            console.error('Error fetching user list:', error);
            throw new HttpException(500, "Error updating user");
        }

    }
}