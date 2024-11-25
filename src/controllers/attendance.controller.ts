import { Request, Response, NextFunction } from 'express';
import { UserService } from "../services/user.service";
import { AttendanceService } from '../services/attendance.service';
import { HttpException } from '../errors/HttpException';

export interface ServiceAttendanceRequest {
  serviceId: string;
  serviceName: string;
  serviceStartTime: Date;
  campusName: string;
  bucket: string;
  folderPath: string;
}


export class AttendanceController {

  private attendanceService: AttendanceService;

  constructor() {
    this.attendanceService = new AttendanceService();
  }

  public matchMembers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { bucket, folderPath, campusName, serviceName, serviceStartTime, serviceId } = req.body;
      if (!bucket || !folderPath || !campusName || !serviceName || !serviceStartTime || !serviceId) {
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

}