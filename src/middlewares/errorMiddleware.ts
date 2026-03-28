import { Request, Response, NextFunction } from 'express';
import { errorResponse } from '../utils/response';

export const notFoundHandler = (req: Request, res: Response): void => {
  errorResponse(res, 404, `Route ${req.originalUrl} not found.`);
};

export const globalErrorHandler = (
  err: Error & { status?: number; code?: string },
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void => {
  console.error('Global Error:', err);

  if (err.code === 'P2002') { errorResponse(res, 409, 'A record with this value already exists.'); return; }
  if (err.code === 'P2025') { errorResponse(res, 404, 'Record not found.'); return; }
  if (err.code === 'P2003') { errorResponse(res, 400, 'Invalid reference. Related record not found.'); return; }
  if (err.name === 'JsonWebTokenError') { errorResponse(res, 401, 'Invalid token.'); return; }
  if (err.name === 'TokenExpiredError') { errorResponse(res, 401, 'Token expired. Please login again.'); return; }

  errorResponse(res, err.status || 500, err.message || 'Internal Server Error');
};
