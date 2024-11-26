export class HttpException extends Error {
  statusCode: number;
  message: string;
  details?: any;

  constructor(statusCode: number, message: string, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.message = message;
    this.details = details;

    Object.setPrototypeOf(this, new.target.prototype);
  }
}
