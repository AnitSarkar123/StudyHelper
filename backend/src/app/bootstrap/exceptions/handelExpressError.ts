import type { NextFunction, Response, Request } from "express";

export function handelExpressError(err: any, req: Request, res: Response, next: NextFunction) {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: {
      message: err.message || "Internal Server Error",
      details: err.details || null,
      status: statusCode
    }
  })
}