import { Router } from 'express';

import { PaymentControllerImpl } from './paymentController';
import { PaymentRepositoryImpl } from './paymentRepository';
import { PaymentServiceImpl } from './paymentService';
import { authMiddleware } from '../middleware/auth';

/**
 * Payment setup
 */
const paymentRepository = new PaymentRepositoryImpl();
const paymentService = new PaymentServiceImpl(paymentRepository);
const paymentController = new PaymentControllerImpl(paymentService);

/**
 * Payment routes
 */
export const paymentRoutes = Router();

paymentRoutes.post('/booking/:bookingId', authMiddleware, paymentController.create);
paymentRoutes.get('/:paymentId', authMiddleware, paymentController.getStatus);
paymentRoutes.put('/:paymentId/status', authMiddleware, paymentController.updateStatus);
