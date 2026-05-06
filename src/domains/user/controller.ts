import { Request, Response, NextFunction } from 'express';

import { UserService, SavedPassengerService } from './service';
import { CreateUser, CreateSavedPassenger } from './types';
import { AppError, ErrorCode } from '../../shared/error';

/**
 * User controller interface
 */
export interface UserController {
  getProfile(request: Request, response: Response, next: NextFunction): Promise<void>;
  updateProfile(request: Request, response: Response, next: NextFunction): Promise<void>;
  deleteProfile(request: Request, response: Response, next: NextFunction): Promise<void>;
}

/**
 * Saved passenger controller interface
 */
export interface SavedPassengerController {
  getAll(request: Request, response: Response, next: NextFunction): Promise<void>;
  create(request: Request, response: Response, next: NextFunction): Promise<void>;
  delete(request: Request, response: Response, next: NextFunction): Promise<void>;
}

/**
 * User controller implementation
 */
export class UserControllerImpl implements UserController {
  constructor(private userService: UserService) {
    this.getProfile = this.getProfile.bind(this);
    this.updateProfile = this.updateProfile.bind(this);
    this.deleteProfile = this.deleteProfile.bind(this);
  }

  async getProfile(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const userId = request.user?.user_id;
      if (!userId) {
        throw new AppError('User not authenticated', 401, ErrorCode.UNAUTHORIZED);
      }

      const user = await this.userService.findById(userId);
      if (!user) {
        throw new AppError('User not found', 404, ErrorCode.NOT_FOUND);
      }

      response.json({
        user_id: user.user_id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      });
    } catch (error) {
      next(error); // Let error handler middleware handle all errors
    }
  }

  async updateProfile(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const userId = request.user?.user_id;
      if (!userId) {
        throw new AppError('User not authenticated', 401, ErrorCode.UNAUTHORIZED);
      }

      const updateData: Partial<CreateUser> = {
        full_name: request.body.full_name,
        email: request.body.email,
        phone: request.body.phone,
      };

      await this.userService.update(userId, updateData);
      response.json({ message: 'Profile updated' });
    } catch (error) {
      next(error); // Let error handler middleware handle all errors
    }
  }

  async deleteProfile(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const userId = request.user?.user_id;
      if (!userId) {
        throw new AppError('User not authenticated', 401, ErrorCode.UNAUTHORIZED);
      }

      await this.userService.delete(userId);
      response.json({ message: 'Profile deleted' });
    } catch (error) {
      next(error); // Let error handler middleware handle all errors
    }
  }
}

/**
 * Saved passenger controller implementation
 */
export class SavedPassengerControllerImpl implements SavedPassengerController {
  constructor(private savedPassengerService: SavedPassengerService) {
    this.getAll = this.getAll.bind(this);
    this.create = this.create.bind(this);
    this.delete = this.delete.bind(this);
  }

  async getAll(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const userId = request.user?.user_id;
      if (!userId) {
        throw new AppError('User not authenticated', 401, ErrorCode.UNAUTHORIZED);
      }

      const passengers = await this.savedPassengerService.findByUserId(userId);
      response.json(passengers);
    } catch (error) {
      next(error); // Let error handler middleware handle all errors
    }
  }

  async create(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const userId = request.user?.user_id;
      if (!userId) {
        throw new AppError('User not authenticated', 401, ErrorCode.UNAUTHORIZED);
      }

      const createData: CreateSavedPassenger = { user_id: userId,
        full_name: request.body.full_name,
        id_number: request.body.id_number,
      };

      const id = await this.savedPassengerService.create(userId, createData);
      response.status(201).json({ id });
    } catch (error) {
      next(error); // Let error handler middleware handle all errors
    }
  }

  async delete(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      await this.savedPassengerService.delete(request.params.id as string);
      response.json({ message: 'Saved passenger deleted' });
    } catch (error) {
      next(error); // Let error handler middleware handle all errors
    }
  }
}
