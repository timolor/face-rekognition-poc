import { Request, Response, NextFunction } from 'express';
import { UserService } from "../services/user.service";
import { AttendanceService } from '../services/attendance.service';
import { HttpException } from '../errors/HttpException';

export interface ServiceAttendanceRequest {
  serviceId: string;
  campusId: string;
  serviceName: string;
  serviceStartTime: Date;
  campusName: string;
  bucket: string;
  folderPath: string;
}


export class AttendanceController {

  private attendanceService: AttendanceService;
  private userService: UserService;

  constructor() {
    this.attendanceService = new AttendanceService();
    this.userService = new UserService();
  }

  public matchMembers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { bucket, folderPath, campusName, serviceName, serviceStartTime, serviceId, campusId } = req.body;
      if (!bucket || !folderPath || !campusName || !serviceName || !serviceStartTime || !serviceId || !campusId) {
        throw new HttpException(400, "One or more required fields are missing");
      }

      const serviceAttendanceReq: ServiceAttendanceRequest = req.body;

      await this.attendanceService.matchMembers(serviceAttendanceReq);
      res.status(200).json({ message: "Service attendance process initiated successfully" });
    } catch (error) {
      next(error);
    }
  }

  public updateMemberMatches = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { bucket, folderPath, campusName, serviceName, serviceStartTime, serviceId, campusId } = req.body;
      if (!bucket || !folderPath || !serviceId || !campusId) {
        throw new HttpException(400, "One or more required fields are missing");
      }

      const serviceAttendanceReq: ServiceAttendanceRequest = req.body;

      const result = await this.attendanceService.updateMemberMatches(serviceAttendanceReq);
      res.status(200).json({
        message: "Service attendance updated successfully",
        unmatchedFaces: result?.unmatchedFaces || 0
      });
    } catch (error) {
      next(error);
    }
  }

  public getServiceAttendance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const campusId = req.query.campusId as string;
    const campusName = req.query.campusName as string;
    const serviceName = req.query.serviceName as string;
    const serviceId = req.query.serviceId as string;

    const filters = {
      search,
      campusId,
      campusName,
      serviceName,
      serviceId
    };

    try {
      const { serviceAttendances } = await this.attendanceService.fetchPaginatedAttendanceServices(page, limit, filters);

      const data = {
        serviceAttendances,
        page,
        limit,
      }
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  }


  public getAttendees = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 100000;
    const search = req.query.search as string;
    const serviceId = req.query.serviceId as string;
    const campusId = req.query.campusId as string;
    const serviceAttendanceId = req.query.serviceAttendanceId as string;

    try {

      if (!campusId || !serviceId) {
        throw new HttpException(400, "One or more required fields are missing");
      }

      const users = await this.userService.fetchServiceAttendees(page, limit, search, serviceId, campusId, serviceAttendanceId);

      const data = {
        users,
        page,
        limit,
      }
      res.status(200).json(data);
    } catch (error) {
      next(error)
    }
  }

}