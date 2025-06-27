import { Router } from 'express';
import { AttendanceController } from '../controllers/attendance.controller';
const router = Router();

const attendanceController = new AttendanceController();

router.post("/match-members", attendanceController.matchMembers);
router.post("/update-member-matches", attendanceController.updateMemberMatches);
router.get("/get-processes", attendanceController.getServiceAttendance)
router.get("/service/attendees", attendanceController.getAttendees)

export default router;
