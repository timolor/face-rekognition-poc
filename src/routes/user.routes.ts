import { Router } from 'express';
import { UserController } from "../controllers/user.controller";
const router = Router();

const userController = new UserController();

router.get("/index-faces", userController.indexFaces);

export default router;
