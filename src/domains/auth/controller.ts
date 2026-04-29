import { Request, Response, NextFunction } from 'express';

import { AuthService } from './service';
import { LoginRequest, RegisterRequest } from './types';
import { AppError, ErrorCode } from '../../shared/error';

/**
 * Auth controller interface
 */
export interface AuthController {
  login(request: Request, response: Response, next: NextFunction): Promise<void>;
  register(request: Request, response: Response, next: NextFunction): Promise<void>;
  me(request: Request, response: Response, next: NextFunction): Promise<void>;
}

/**
 * Auth controller implementation
 */
export class AuthControllerImpl implements AuthController {
  constructor(private authService: AuthService) {
    this.login = this.login.bind(this);
    this.register = this.register.bind(this);
    this.me = this.me.bind(this);
  }

  async login(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const loginRequest: LoginRequest = {
        email: request.body.email,
        password: request.body.password,
      };

      const result = await this.authService.login(loginRequest);
      response.json(result);
    } catch (error) {
      if (error instanceof AppError) {
        response.status(error.statusCode).json({ error: error.message });
      } else {
        next(error);
      }
    }
  }

  async register(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const registerRequest: RegisterRequest = {
        full_name: request.body.full_name,
        email: request.body.email,
        phone: request.body.phone,
        password: request.body.password,
      };

      const result = await this.authService.register(registerRequest);
      response.status(201).json(result);
    } catch (error) {
      if (error instanceof AppError) {
        response.status(error.statusCode).json({ error: error.message });
      } else {
        next(error);
      }
    }
  }

  async me(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const userId = request.user?.user_id;
      if (!userId) {
        throw new AppError('User not authenticated', 401, ErrorCode.UNAUTHORIZED);
      }

      const result = await this.authService.me(userId);
      response.json(result);
    } catch (error) {
      if (error instanceof AppError) {
        response.status(error.statusCode).json({ error: error.message });
      } else {
        next(error);
      }
    }
  }
}
