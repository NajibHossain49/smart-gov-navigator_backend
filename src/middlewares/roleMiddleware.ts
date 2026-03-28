import { Response, NextFunction } from 'express';
import { errorResponse } from '../utils/response';
import { AuthRequest } from '../types';

const roleMiddleware = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      errorResponse(res, 401, 'Unauthorized. Please login.');
      return;
    }

    const userRole = req.user.role?.role_name;

    if (!allowedRoles.includes(userRole)) {
      errorResponse(res, 403, `Access denied. Required role: ${allowedRoles.join(' or ')}.`);
      return;
    }

    next();
  };
};

export default roleMiddleware;
