import { Response, NextFunction } from 'express';

import { UserRequest } from '../../shared/types';

/**
 * Manager-only middleware interface
 */
export interface ManagerOnlyMiddleware {
  (request: UserRequest, response: Response, next: NextFunction): Promise<void>;
}

/**
 * Manager-only middleware implementation
 * Verifies user role is 'manager' or 'admin' before allowing request to proceed
 * This middleware allows both managers and admins to access manager endpoints
 */
export const managerOnlyMiddleware: ManagerOnlyMiddleware = async (
  request: UserRequest,
  response: Response,
  next: NextFunction
): Promise<void> => {
  const userRole = request.user?.role;
  
  if (userRole !== 'manager' && userRole !== 'admin') {
    response.status(403).json({
      error: 'Akses ditolak. Endpoint ini hanya untuk Manager atau Admin',
      code: 'FORBIDDEN',
      statusCode: 403,
    });
    return;
  }
  
  next();
};
