import { HttpException } from "../errors/HttpException";
import { indexFace } from "../indexFaces";
import { IUser, UserResponse } from "../models/user";
import axios, { AxiosResponse } from 'axios';
import { deleteImagesInFolder, listImagesInBucket } from "./s3";
import { processImages } from "../processImages";
import { ServiceAttendanceRequest } from "../controllers/attendance.controller";
import ServiceAttendanceModel, { mapToServiceAttendance, ServiceAttendance } from "../models/service-attendance";
import { listFaces } from "./rekognition";
import { Face } from "aws-sdk/clients/rekognition";

const COZA_API_BASE_URL = process.env.COZA_API_BASE_URL || "http://localhost:7003/api/v1/"
const COZA_API_JWT = process.env.COZA_API_JWT!
const collectionId = process.env.REKOGNITION_COLLECTION_ID!;

export class AttendanceService {

    async matchMembers(data: ServiceAttendanceRequest) {

        const serviceAttendance = mapToServiceAttendance(data);
        const savedUser = await serviceAttendance.save();

        const imagePaths = await listImagesInBucket(data.bucket, data.folderPath);

        const resp = processImages({ bucket: data.bucket, imageKeys: imagePaths, serviceAttendanceId: savedUser._id.toString(), data });

    }

    async getMembers(): Promise<IUser[]> {
        try {
            let config = {
                method: 'get',
                url: `${COZA_API_BASE_URL}user/list`,
                headers: { 
                    'accept': '*/*',  
                    'Authorization': `Bearer ${COZA_API_JWT}`
                }
            };

            const response: AxiosResponse<UserResponse> = await axios.request(config);
            if (response.status === 200 && response.data.data.users.length > 0) {
                return response.data.data.users;
            }
            throw new HttpException(404, "User not found");
        } catch (error) {
            console.error('Error fetching user list:', error);
            throw new HttpException(500, "Error fetching user list");
        }
    }

    async updateIndexedMember(userId: string, faceId: string): Promise<IUser[]> {
        console.log("++ about to update memeber");
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

    async fetchPaginatedAttendanceServices(page: number, limit: number, search: string): Promise<{ serviceAttendances: ServiceAttendance[]; }> {
        const skip = (page - 1) * limit;

        const query: any = {};

        if (search) {
            const regex = new RegExp(search, 'i');
            query.$or = [
                { campusName: { $regex: regex } },
                { serviceName: { $regex: regex } },
                { campusId: { $regex: regex } },
                { serviceId: { $regex: regex } },
            ];
        }


        const serviceAttendances = await ServiceAttendanceModel.find(query).skip(skip).limit(limit);

        return { serviceAttendances };
    }

    async getIndexedFaces(){

        const indexedFaces: Face[] = await listFaces(collectionId);
        for(const indexFace of indexedFaces as any){
            await this.updateIndexedMember(indexFace.ExternalImageId, indexFace.FaceId);
        }

        return indexedFaces;
    }
}