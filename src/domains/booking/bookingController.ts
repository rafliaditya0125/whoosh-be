import { Request, Response, NextFunction } from 'express';

import { BookingService } from './bookingService';
import { CreateBookingRequest } from './bookingTypes';
import { AppError, ErrorCode } from '../../shared/error';

/**
 * Booking controller interface
 */
export interface BookingController {
  createBooking(request: Request, response: Response, next: NextFunction): Promise<void>;
  getMyBookings(request: Request, response: Response, next: NextFunction): Promise<void>;
  getBookingDetail(request: Request, response: Response, next: NextFunction): Promise<void>;
  cancelBooking(request: Request, response: Response, next: NextFunction): Promise<void>;
  rescheduleBooking(request: Request, response: Response, next: NextFunction): Promise<void>;
  requestRefund(request: Request, response: Response, next: NextFunction): Promise<void>;
  getRefundStatus(request: Request, response: Response, next: NextFunction): Promise<void>;
}

/**
 * Booking controller implementation
 */
export class BookingControllerImpl implements BookingController {
  constructor(private bookingService: BookingService) {
    this.createBooking = this.createBooking.bind(this);
    this.getMyBookings = this.getMyBookings.bind(this);
    this.getBookingDetail = this.getBookingDetail.bind(this);
    this.cancelBooking = this.cancelBooking.bind(this);
    this.rescheduleBooking = this.rescheduleBooking.bind(this);
    this.requestRefund = this.requestRefund.bind(this);
    this.getRefundStatus = this.getRefundStatus.bind(this);
  }

  async createBooking(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const userId = request.user?.user_id;
      if (!userId) {
        throw new AppError('User not authenticated', 401, ErrorCode.UNAUTHORIZED);
      }

      const createBookingRequest: CreateBookingRequest = {
        schedule_id: request.body.schedule_id,
        passengers: request.body.passengers,
        lock_id: request.body.lock_id,
      };

      const result = await this.bookingService.createBooking(createBookingRequest, userId);
      response.status(201).json(result);
    } catch (error) {
      next(error); // Let error handler middleware handle all errors
    }
  }

  async getMyBookings(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const userId = request.user?.user_id;
      if (!userId) {
        throw new AppError('User not authenticated', 401, ErrorCode.UNAUTHORIZED);
      }

      const page = request.query.page ? Number(request.query.page) : 1;
      const limit = request.query.limit ? Number(request.query.limit) : 10;

      const result = await this.bookingService.findByUserId(userId, { page, limit });

      // Filter by type if provided (Note: Pagination happens before filtering in this simple implementation)
      // Ideally, filtering should happen in the repository for correct pagination
      const { type } = request.query;
      if (type) {
        let filteredItems = result.items;
        if (type === 'unpaid') {
          filteredItems = result.items.filter((b: any) => b.status === 'pending');
        } else if (type === 'paid') {
          filteredItems = result.items.filter((b: any) => b.status === 'paid');
        } else if (type === 'history') {
          filteredItems = result.items.filter((b: any) => b.status === 'completed' || b.status === 'cancelled');
        }
        result.items = filteredItems;
      }

      response.json(result);
    } catch (error) {
      next(error); // Let error handler middleware handle all errors
    }
  }

  async getBookingDetail(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      // Service will throw 404 if not found
      const booking = await this.bookingService.findById(request.params.id as string);
      response.json(booking);
    } catch (error) {
      next(error); // Let error handler middleware handle all errors
    }
  }

  async cancelBooking(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const userId = request.user?.user_id;
      if (!userId) {
        throw new AppError('User not authenticated', 401, ErrorCode.UNAUTHORIZED);
      }

      await this.bookingService.cancelBooking(request.params.id as string, userId);
      response.json({ message: 'Booking cancelled' });
    } catch (error) {
      next(error); // Let error handler middleware handle all errors
    }
  }

  async rescheduleBooking(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const userId = request.user?.user_id;
      if (!userId) {
        throw new AppError('User not authenticated', 401, ErrorCode.UNAUTHORIZED);
      }

      const result = await this.bookingService.rescheduleBooking(
        request.params.id as string,
        userId,
        request.body.new_schedule_id,
        request.body.reason
      );
      response.json(result);
    } catch (error) {
      next(error); // Let error handler middleware handle all errors
    }
  }

  async requestRefund(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const userId = request.user?.user_id;
      if (!userId) {
        throw new AppError('User not authenticated', 401, ErrorCode.UNAUTHORIZED);
      }

      const result = await this.bookingService.requestRefund(
        request.params.id as string,
        userId,
        request.body.reason,
        request.body.bank_account
      );
      response.json(result);
    } catch (error) {
      next(error); // Let error handler middleware handle all errors
    }
  }

  async getRefundStatus(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.bookingService.getRefundStatus(request.params.id as string);
      response.json(result);
    } catch (error) {
      next(error); // Let error handler middleware handle all errors
    }
  }
}
