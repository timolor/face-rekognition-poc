import { Request, Response, NextFunction } from 'express';
import { UserService } from "../services/user.service";



export class UserController {

    private userService: UserService;

    constructor() {
        this.userService = new UserService();
    }

    public indexFaces = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        
       try {
         const resp = await this.userService.indexFaces();
 
         res.status(200).json(resp);
       } catch (error) {
        next(error);
       }
    }

}