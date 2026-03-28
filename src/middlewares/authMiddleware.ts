import { Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { errorResponse } from '../utils/response';
import prisma from '../config/db';
import { AuthRequest } from '../types';

const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      errorResponse(res, 401, 'Access denied. No token provided.');
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { role: true },
    });

    if (!user) {
      errorResponse(res, 401, 'User not found. Token invalid.');
      return;
    }

    req.user = user;
    next();
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.name === 'JsonWebTokenError') {
        errorResponse(res, 401, 'Invalid token.');
        return;
      }
      if (error.name === 'TokenExpiredError') {
        errorResponse(res, 401, 'Token expired. Please login again.');
        return;
      }
    }
    errorResponse(res, 500, 'Authentication error.');
  }
};

export default authMiddleware;
