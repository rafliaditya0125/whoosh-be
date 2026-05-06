import { Request, Response, NextFunction } from 'express';

import { BookingService } from './service';
import { CreateBookingRequest } from './types';
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

      const bookings = await this.bookingService.findByUserId(userId);

      // Filter by type if provided
      const { type } = request.query;
      let filteredBookings = bookings;
      
      if (type === 'unpaid') {
        filteredBookings = bookings.filter((b) => b.status === 'pending');
      } else if (type === 'paid') {
        filteredBookings = bookings.filter((b) => b.status === 'paid');
      } else if (type === 'history') {
        filteredBookings = bookings.filter((b) => b.status === 'completed' || b.status === 'cancelled');
      }

      // Return in format expected by mobile (with items array)
      response.json({ items: filteredBookings });
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
