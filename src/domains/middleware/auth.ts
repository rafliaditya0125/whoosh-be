import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

import { UserRequest } from '../../shared/types';

/**
 * Auth middleware interface
 */
export interface AuthMiddleware {
  (request: UserRequest, response: Response, next: NextFunction): Promise<void>;
}

/**
 * Auth middleware implementation
 * Verifies JWT token and attaches user information to request
 */
export const authMiddleware: AuthMiddleware = async (
  request: UserRequest,
  response: Response,
  next: NextFunction
): Promise<void> => {
  const header = request.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    response.status(401).json({ error: 'Access denied' });
    return;
  }

  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret') as {
      user_id: string;
      role: 'user' | 'admin';
    };

    request.user = {
      user_id: decoded.user_id,
      role: decoded.role,
    };
    next();
  } catch {
    response.status(403).json({ error: 'Invalid token' });
  }
};
