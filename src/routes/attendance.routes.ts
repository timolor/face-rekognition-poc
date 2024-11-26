import { Router } from 'express';
import { AttendanceController } from '../controllers/attendance.controller';
const router = Router();

const attendanceController = new AttendanceController();

router.post("/match-members", attendanceController.matchMembers);
router.get("/get-processes", attendanceController.getServiceAttendance)

export default router;
