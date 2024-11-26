// src/middleware/errorHandler.ts

import { Request, Response, NextFunction } from 'express';
import { HttpException } from '../errors/HttpException';

export function errorMiddleware(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {

  if (err instanceof HttpException) {
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
      details: err.details || null,
    });
  }

  console.error(err); 
  return res.status(500).json({
    status: 'error',
    message: 'Something went wrong, please try again later.',
  });
}
