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
      };

      const result = await this.bookingService.createBooking(createBookingRequest, userId);
      response.status(201).json(result);
    } catch (error) {
      if (error instanceof AppError) {
        response.status(error.statusCode).json({ error: error.message });
      } else {
        next(error);
      }
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
      if (type === 'unpaid') {
        const result = bookings.filter((b) => b.status === 'pending');
        response.json(result);
        return;
      } else if (type === 'paid') {
        const result = bookings.filter((b) => b.status === 'paid');
        response.json(result);
        return;
      } else if (type === 'history') {
        const result = bookings.filter((b) => b.status === 'completed' || b.status === 'cancelled');
        response.json(result);
        return;
      }

      response.json(bookings);
    } catch (error) {
      if (error instanceof AppError) {
        response.status(error.statusCode).json({ error: error.message });
      } else {
        next(error);
      }
    }
  }

  async getBookingDetail(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const booking = await this.bookingService.findById(request.params.id);
      if (!booking) {
        throw new AppError('Booking not found', 404, ErrorCode.NOT_FOUND);
      }

      response.json(booking);
    } catch (error) {
      if (error instanceof AppError) {
        response.status(error.statusCode).json({ error: error.message });
      } else {
        next(error);
      }
    }
  }

  async cancelBooking(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const userId = request.user?.user_id;
      if (!userId) {
        throw new AppError('User not authenticated', 401, ErrorCode.UNAUTHORIZED);
      }

      await this.bookingService.cancelBooking(request.params.id, userId);
      response.json({ message: 'Booking cancelled' });
    } catch (error) {
      if (error instanceof AppError) {
        response.status(error.statusCode).json({ error: error.message });
      } else {
        next(error);
      }
    }
  }
}
