import { Router } from 'express';

import { BookingControllerImpl } from './bookingController';
import { BookingRepositoryImpl, SeatRepositoryImpl } from './bookingRepository';
import { BookingServiceImpl } from './bookingService';
import { authMiddleware } from '../middleware/auth';

/**
 * Booking setup
 */
const bookingRepository = new BookingRepositoryImpl();
const seatRepository = new SeatRepositoryImpl();
const bookingService = new BookingServiceImpl(bookingRepository, seatRepository);
const bookingController = new BookingControllerImpl(bookingService);

/**
 * Booking routes
 */
export const bookingRoutes = Router();

bookingRoutes.post('/', authMiddleware, bookingController.createBooking);
bookingRoutes.get('/my', authMiddleware, bookingController.getMyBookings);
bookingRoutes.get('/:id', authMiddleware, bookingController.getBookingDetail);
bookingRoutes.post('/:id/cancel', authMiddleware, bookingController.cancelBooking);
bookingRoutes.post('/:id/reschedule', authMiddleware, bookingController.rescheduleBooking);
bookingRoutes.post('/:id/refund', authMiddleware, bookingController.requestRefund);
bookingRoutes.get('/refunds/:id', authMiddleware, bookingController.getRefundStatus);
