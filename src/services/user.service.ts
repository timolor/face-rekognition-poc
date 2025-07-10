import { connectToDatabase, fcdbUri } from "../config/db";
import { HttpException } from "../errors/HttpException";
import { indexFace } from "../indexFaces";
import { IUser, UserResponse } from "../models/user";
import { CampusService } from './campus.service';
import axios, { AxiosResponse } from 'axios';
import ServiceAttendanceModel, {  } from "../models/service-attendance";

const COZA_API_BASE_URL = process.env.COZA_API_BASE_URL || "http://localhost:7003/api/v1/"
const COZA_API_JWT = process.env.COZA_API_JWT!;
const COZA_WORKFORCE_API_BASE_URL = process.env.COZA_WORKFORCE_API_BASE_URL || "https://cozaapp.coza.org.ng/api/";
const collectionId = process.env.REKOGNITION_COLLECTION_ID!;


export class UserService {

    async indexFaces() {


        const members: IUser[] = await this.getMembers();
        for (const member of members) {
            if (!member.profile_picture || member.profile_picture.trim() === "") continue;
            if (member.isFaceIndexed) continue;
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
        const members = this.getUsers(global.counter, 100);
        global.counter++;
        return members;
    }

    async fetchServiceAttendees(page: number, limit: number, search: string, serviceId: string, campusId: string, serviceAttendanceId: string): Promise<IUser[]> {
        console.log(`serviceId: ${serviceId}, campusId: ${campusId}, serviceAttendanceId: ${serviceAttendanceId}, limit: ${limit}`)
        //get all matched faces for campus and service
        const serviceAttendance = await ServiceAttendanceModel.findById(serviceAttendanceId);
        const fcdb = await connectToDatabase('fc', fcdbUri);
		const match = fcdb.collection('match');
        const matches = await match.find({ serviceId: serviceAttendance?.serviceId, campusId: serviceAttendance?.campusId }).toArray();
        
        const users = await this.getUsers(page, limit, serviceAttendance?.campusId);

        const matchAttendeeIds = new Set(matches.map(match => match.memberId.toString()));
        for (const user of users) {
            user.status = matchAttendeeIds.has(user._id.toString());
        }

        // Fetch users from external attendance system
        const externalAttendees = await this.fetchExternalAttendees(serviceId, campusId);
        
        // Filter out users who already exist in the current users list (by email)
        const existingEmails = new Set(users.map(user => user.email));
        const filteredExternalAttendees = externalAttendees.filter(attendee => !existingEmails.has(attendee.email));
        
        // Merge the lists
        const allUsers = [...users, ...filteredExternalAttendees];

        return allUsers
    }

    async updateIndexedMember(userId: string, faceId: string): Promise<IUser[]> {
        console.log(`about to update member: ${userId} and faceId: ${faceId}`);
        try {
            let data = JSON.stringify({
                "isFaceIndexed": true,
                "indexedFaceId": faceId
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

    public getUsers = async (page: number, pageSize: number, campusId?: string): Promise<IUser[]> => {
        const campusService = CampusService.getInstance();

        try {
            let config = {
                method: 'get',
                url: `${COZA_API_BASE_URL}user/list?page=${page}&pageSize=${pageSize}`,
                // url: `${COZA_API_BASE_URL}user/list?page=${page}&pageSize=${pageSize}&campus=${campusId}`,
                headers: {
                    'accept': '*/*',
                    'Authorization': `Bearer ${COZA_API_JWT}`
                }
            };

            const response: AxiosResponse<UserResponse> = await axios.request(config);
            if (response.status === 200 && response.data.data.users.length > 0) {
                // Enhance users with campus information from the campus field
                const users = response.data.data.users.map(user => {
                    const campus = user.campus;
                    const userCampusId = campus?._id;
                    const campusName = campus?.name;
                    
                    return {
                        ...user,
                        campusId: userCampusId || undefined,
                        campusName: campusName || undefined
                    };
                });
                return users;
            }
            throw new HttpException(404, "User not found");
        } catch (error) {
            console.error('Error fetching user list:', error);
        }
        return []
    }

    private async fetchExternalAttendees(serviceId: string, campusId: string): Promise<IUser[]> {
        try {
            // Fetch attendances from workforce app
            const attendanceConfig = {
                method: 'get',
                url: `${COZA_WORKFORCE_API_BASE_URL}attendance/getAttendanceByServiceIdAndCampusId/${serviceId}/${campusId}`,
                headers: {
                    'accept': '*/*'
                }
            };

            const attendanceResponse = await axios.request(attendanceConfig);
            
            if (attendanceResponse.status !== 200 || !attendanceResponse.data.isSuccessful) {
                console.log('No external attendances found or error occurred');
                return [];
            }

            const attendances = attendanceResponse.data.data;
            
            // Filter attendances with status PRESENT or LATE 
            const validAttendances = attendances.filter((attendance: any) => 
                attendance.status === 'PRESENT' || attendance.status === 'LATE'
            );

            if (validAttendances.length === 0) {
                return [];
            }

            const userIdList = validAttendances.map((attendance: any) => attendance.userId as string);
            const userIds: string[] = [...new Set<string>(userIdList)];

            const externalUsers: IUser[] = await this.fetchUsersBatch(userIds);
            
            return externalUsers;
            
        } catch (error) {
            console.error('Error fetching external attendees:', error);
            return [];
        }
    }

    private async fetchUsersBatch(userIds: string[]): Promise<IUser[]> {
       
        const externalUsers: IUser[] = [];
        const concurrencyLimit = 5; // Limit concurrent requests
        
        for (let i = 0; i < userIds.length; i += concurrencyLimit) {
            const batch = userIds.slice(i, i + concurrencyLimit);
            const promises = batch.map(async (userId) => {
                try {
                    const userConfig = {
                        method: 'get',
                        url: `${COZA_WORKFORCE_API_BASE_URL}account/user/${userId}`,
                        headers: {
                            'accept': '*/*'
                        }
                    };

                    const userResponse = await axios.request(userConfig);
                    
                    if (userResponse.status === 200 && userResponse.data.isSuccessful) {
                        return this.mapUserData(userResponse.data.data);
                    }
                } catch (userError) {
                    console.error(`Error fetching user ${userId}:`, userError);
                }
                return null;
            });

            const results = await Promise.all(promises);
            externalUsers.push(...results.filter(user => user !== null) as IUser[]);
        }

        return externalUsers;
    }

    private mapUserData(userData: any): IUser {
        return {
            _id: userData.userId as any,
            id: userData.userId,
            first_name: userData.firstName || '',
            last_name: userData.lastName || '',
            username: userData.email || '',
            email: userData.email || '',
            gender: userData.gender || '',
            phone: userData.phoneNumber || '',
            password: '', 
            occupation: userData.occupation || '',
            referred_by: '',
            isActive: userData.isActivated || false,
            isFaceIndexed: false,
            online: false,
            status: true, // Mark as present since they have valid attendance
            profile_picture: userData.pictureUrl || '',
            location: {
                address: userData.address || '',
                city: '',
                state: '',
                country: ''
            },
            createdAt: new Date(userData.createdAt || Date.now()),
            updatedAt: new Date()
        };
    }
}