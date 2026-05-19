import { Router } from 'express';

import { authRoutes } from '../domains/auth';
import { bookingRoutes } from '../domains/booking';
import { paymentRoutes } from '../domains/payment';
import { scheduleRoutes } from '../domains/schedule';
import { seatRoutes } from '../domains/seat';
import { stationRoutes } from '../domains/station';
import { ticketRoutes } from '../domains/ticket';
import { trainRoutes } from '../domains/train';
import { userRoutes, savedPassengerRoutes } from '../domains/user';
import { managerRoutes } from '../domains/manager';
import { adminRoutes } from '../domains/admin';

const router = Router();

router.use('/auth', authRoutes);
router.use('/stations', stationRoutes);
router.use('/schedules', scheduleRoutes);
router.use('/bookings', bookingRoutes);
router.use('/payments', paymentRoutes);
router.use('/trains', trainRoutes);
router.use('/seats', seatRoutes);
router.use('/tickets', ticketRoutes);
router.use('/users', userRoutes);
router.use('/saved-passengers', savedPassengerRoutes);
router.use('/manager', managerRoutes);
router.use('/admin', adminRoutes);

export default router;
