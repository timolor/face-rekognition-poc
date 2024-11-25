import { ObjectId } from 'mongoose';

export interface IUser {
	_id: ObjectId;
	id: string;
	first_name: string;
	last_name: string;
	username: string;
	email: string;
	gender: string;
	phone: string;
	password: string;
	occupation: string;
	campus: string;
	marital_status: string;
	device_token: string[];
	referred_by: string;
	roles: string[];
	permissions: string[];
	activation_code: string;
	activation_expires_in: Date;
	isActive: boolean;
	isSuspended: boolean;
	isDeleted: boolean;
	isFaceIndexed: boolean;
	online: boolean;
	bornAgain: boolean;
	notification_counter: number;
	status: boolean;
	profile_picture: string;
	location: {
		address: string;
		city: string;
		state: string;
		country: string;
	};
	cell_id: string;
	firebase_uid: string;
	readonly createdAt: Date;
	updatedAt: Date;
	//faceId?: string; // Optional field for Rekognition FaceId
}

export interface Pagination {
    prevPage: number | null;
    currentPage: number;
    nextPage: number | null;
    pageTotal: number;
    pageSize: number;
    total: number;
}

export interface UserResponse {
    status: "success" | "error"; 
    message: string;
    data: {
        pagination: Pagination;
        users: IUser[]; 
    };
}


