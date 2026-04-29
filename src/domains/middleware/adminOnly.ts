import { Response, NextFunction } from 'express';

import { UserRequest } from '../../shared/types';

/**
 * Admin-only middleware interface
 */
export interface AdminOnlyMiddleware {
  (request: UserRequest, response: Response, next: NextFunction): Promise<void>;
}

/**
 * Admin-only middleware implementation
 * Verifies user role is 'admin' before allowing request to proceed
 */
export const adminOnlyMiddleware: AdminOnlyMiddleware = async (
  request: UserRequest,
  response: Response,
  next: NextFunction
): Promise<void> => {
  if (request.user?.role !== 'admin') {
    response.status(403).json({ error: 'Admin only' });
    return;
  }
  next();
};
