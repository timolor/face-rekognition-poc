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

      const resp = await this.attendanceService.matchMembers(serviceAttendanceReq);
      res.status(200).json(resp);
    } catch (error) {
      next(error);
    }
  }

  public getServiceAttendance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;

    try {
      const { serviceAttendances } = await this.attendanceService.fetchPaginatedAttendanceServices(page, limit, search);

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
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const serviceId = req.query.serviceId as string;
    const campusId = req.query.campusId as string;

    try {

      if (!campusId || !serviceId) {
        throw new HttpException(400, "One or more required fields are missing");
      }

      const users = await this.userService.fetchServiceAttendees(page, limit, search, serviceId, campusId);

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