import { Router } from 'express';

import { authRoutes } from '../domains/auth';
import { bookingRoutes } from '../domains/booking';
import { paymentRoutes } from '../domains/payment';
import { scheduleRoutes } from '../domains/schedule';
import { stationRoutes } from '../domains/station';
import { trainRoutes, seatRoutes } from '../domains/train';
import { userRoutes, savedPassengerRoutes } from '../domains/user';

const router = Router();

router.use('/auth', authRoutes);
router.use('/stations', stationRoutes);
router.use('/schedules', scheduleRoutes);
router.use('/bookings', bookingRoutes);
router.use('/payments', paymentRoutes);
router.use('/trains', trainRoutes);
router.use('/seats', seatRoutes);
router.use('/users', userRoutes);
router.use('/saved-passengers', savedPassengerRoutes);

export default router;
