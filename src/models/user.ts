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
	referred_by: string;
	isActive: boolean;
	isFaceIndexed: boolean;
	online: boolean;
	status: boolean;
	profile_picture: string;
	campus?: {
		_id: string;
		name: string;
		location?: any;
	};
	campusId?: string; // Computed field for convenience
	campusName?: string; // Computed field for convenience
	location: {
		address: string;
		city: string;
		state: string;
		country: string;
	};
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


