import { Router } from 'express';

import { SeatControllerImpl } from './seatController';
import { SeatRepositoryImpl } from './seatRepository';
import { SeatServiceImpl } from './seatService';
import { adminOnlyMiddleware } from '../middleware/adminOnly';
import { authMiddleware } from '../middleware/auth';

const seatRepository = new SeatRepositoryImpl();
const seatService = new SeatServiceImpl(seatRepository);
const seatController = new SeatControllerImpl(seatService);

const router = Router();

router.post('/lock', authMiddleware, seatController.lockSeats);
router.post('/unlock', authMiddleware, seatController.unlockSeats);
router.get('/available', seatController.getAvailableSeats);

// Old routes
router.get('/train/:trainId', seatController.getByTrain);
router.get('/train/:trainId/class/:class', seatController.getByClass);
router.post('/train/:trainId', authMiddleware, adminOnlyMiddleware, seatController.create);
router.delete('/:id', authMiddleware, adminOnlyMiddleware, seatController.delete);

export { router as seatRoutes, seatService };
