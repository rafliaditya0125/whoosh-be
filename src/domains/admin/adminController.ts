import { Response } from 'express';

import { UserRequest } from '../../shared/types';
import { AdminService, AdminServiceImpl } from './adminService';
import {
  UserListQuery,
  UserUpdateRequest,
  UserStatusUpdateRequest,
  BookingListQuery,
  RefundListQuery,
  RefundUpdateRequest,
} from './adminTypes';

/**
 * Admin controller interface
 */
export interface AdminController {
  // User management
  getUsers(request: UserRequest, response: Response): Promise<void>;
  getUserById(request: UserRequest, response: Response): Promise<void>;
  updateUser(request: UserRequest, response: Response): Promise<void>;
  updateUserStatus(request: UserRequest, response: Response): Promise<void>;

  // Booking management
  getBookings(request: UserRequest, response: Response): Promise<void>;

  // Refund management
  getRefunds(request: UserRequest, response: Response): Promise<void>;
  updateRefund(request: UserRequest, response: Response): Promise<void>;
}

/**
 * Admin controller implementation
 */
export class AdminControllerImpl implements AdminController {
  constructor(private service: AdminService = new AdminServiceImpl()) {}

  /**
   * GET /api/admin/users
   * List all users with pagination and filters
   */
  getUsers = async (request: UserRequest, response: Response): Promise<void> => {
    try {
      const query: UserListQuery = {
        search: request.query.search as string | undefined,
        role: request.query.role as 'user' | 'manager' | 'admin' | undefined,
        is_active: request.query.is_active ? request.query.is_active === 'true' : undefined,
        page: request.query.page ? parseInt(request.query.page as string) : 1,
        limit: request.query.limit ? parseInt(request.query.limit as string) : 20,
      };

      const users = await this.service.getUsers(query);
      response.status(200).json(users);
    } catch {
      response.status(500).json({
        error: 'Terjadi kesalahan saat mengambil data users',
        code: 'INTERNAL_SERVER_ERROR',
        statusCode: 500,
      });
    }
  };

  /**
   * GET /api/admin/users/:id
   * Get user detail by ID
   */
  getUserById = async (request: UserRequest, response: Response): Promise<void> => {
    try {
      const userId = request.params.id as string;
      const user = await this.service.getUserById(userId);
      response.status(200).json(user);
    } catch (error: any) {
      if (error.message === 'USER_NOT_FOUND') {
        response.status(404).json({
          error: `User dengan identifier '${request.params.id}' tidak ditemukan`,
          code: 'NOT_FOUND',
          statusCode: 404,
        });
        return;
      }

      response.status(500).json({
        error: 'Terjadi kesalahan saat mengambil data user',
        code: 'INTERNAL_SERVER_ERROR',
        statusCode: 500,
      });
    }
  };

  /**
   * PUT /api/admin/users/:id
   * Update user data
   */
  updateUser = async (request: UserRequest, response: Response): Promise<void> => {
    try {
      const userId = request.params.id as string;
      const data: UserUpdateRequest = request.body;

      const updatedUser = await this.service.updateUser(userId, data);
      response.status(200).json(updatedUser);
    } catch (error: any) {
      if (error.message === 'USER_NOT_FOUND') {
        response.status(404).json({
          error: `User dengan identifier '${request.params.id}' tidak ditemukan`,
          code: 'NOT_FOUND',
          statusCode: 404,
        });
        return;
      }

      if (error.message === 'INVALID_EMAIL_FORMAT') {
        response.status(400).json({
          error: 'Format email salah. Silakan gunakan format email yang valid',
          code: 'INVALID_EMAIL_FORMAT',
          statusCode: 400,
        });
        return;
      }

      if (error.message === 'INVALID_PHONE_FORMAT') {
        response.status(400).json({
          error: 'Format nomor telepon salah. Nomor telepon wajib diawali +62',
          code: 'INVALID_PHONE_FORMAT',
          statusCode: 400,
        });
        return;
      }

      response.status(500).json({
        error: 'Terjadi kesalahan saat update user',
        code: 'INTERNAL_SERVER_ERROR',
        statusCode: 500,
      });
    }
  };

  /**
   * PATCH /api/admin/users/:id/status
   * Block or activate user account
   */
  updateUserStatus = async (request: UserRequest, response: Response): Promise<void> => {
    try {
      const userId = request.params.id as string;
      const data: UserStatusUpdateRequest = request.body;

      if (data.is_active === undefined) {
        response.status(400).json({
          error: 'Field is_active wajib diisi',
          code: 'VALIDATION_ERROR',
          statusCode: 400,
        });
        return;
      }

      await this.service.updateUserStatus(userId, data);
      
      response.status(200).json({
        message: data.is_active ? 'User berhasil diaktifkan' : 'User berhasil diblokir',
        user_id: userId,
        is_active: data.is_active,
      });
    } catch (error: any) {
      if (error.message === 'USER_NOT_FOUND') {
        response.status(404).json({
          error: `User dengan identifier '${request.params.id}' tidak ditemukan`,
          code: 'NOT_FOUND',
          statusCode: 404,
        });
        return;
      }

      response.status(500).json({
        error: 'Terjadi kesalahan saat update status user',
        code: 'INTERNAL_SERVER_ERROR',
        statusCode: 500,
      });
    }
  };

  /**
   * GET /api/admin/bookings
   * List all bookings with filters
   */
  getBookings = async (request: UserRequest, response: Response): Promise<void> => {
    try {
      const query: BookingListQuery = {
        status: request.query.status as 'pending' | 'paid' | 'completed' | 'cancelled' | undefined,
        date_from: request.query.date_from as string | undefined,
        date_to: request.query.date_to as string | undefined,
        search: request.query.search as string | undefined,
        page: request.query.page ? parseInt(request.query.page as string) : 1,
        limit: request.query.limit ? parseInt(request.query.limit as string) : 20,
      };

      const bookings = await this.service.getBookings(query);
      response.status(200).json(bookings);
    } catch {
      response.status(500).json({
        error: 'Terjadi kesalahan saat mengambil data bookings',
        code: 'INTERNAL_SERVER_ERROR',
        statusCode: 500,
      });
    }
  };

  /**
   * GET /api/admin/refunds
   * List all refund requests
   */
  getRefunds = async (request: UserRequest, response: Response): Promise<void> => {
    try {
      const query: RefundListQuery = {
        status: request.query.status as 'pending' | 'approved' | 'rejected' | 'processed' | undefined,
        page: request.query.page ? parseInt(request.query.page as string) : 1,
        limit: request.query.limit ? parseInt(request.query.limit as string) : 20,
      };

      const refunds = await this.service.getRefunds(query);
      response.status(200).json(refunds);
    } catch {
      response.status(500).json({
        error: 'Terjadi kesalahan saat mengambil data refunds',
        code: 'INTERNAL_SERVER_ERROR',
        statusCode: 500,
      });
    }
  };

  /**
   * PUT /api/admin/refunds/:id
   * Approve or reject refund request
   */
  updateRefund = async (request: UserRequest, response: Response): Promise<void> => {
    try {
      const refundId = request.params.id as string;
      const data: RefundUpdateRequest = request.body;

      if (!data.status || !['approved', 'rejected'].includes(data.status)) {
        response.status(400).json({
          error: 'Status wajib diisi dan harus approved atau rejected',
          code: 'VALIDATION_ERROR',
          statusCode: 400,
        });
        return;
      }

      const updatedRefund = await this.service.updateRefund(refundId, data);
      response.status(200).json(updatedRefund);
    } catch {
      response.status(500).json({
        error: 'Terjadi kesalahan saat update refund',
        code: 'INTERNAL_SERVER_ERROR',
        statusCode: 500,
      });
    }
  };
}
