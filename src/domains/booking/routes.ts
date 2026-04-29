import { Router } from 'express';

import { BookingControllerImpl } from './controller';
import { BookingRepositoryImpl, SeatRepositoryImpl } from './repository';
import { BookingServiceImpl } from './service';
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
