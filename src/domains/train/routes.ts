import { Router } from 'express';

import { TrainControllerImpl, SeatControllerImpl } from './controller';
import { TrainRepositoryImpl, SeatRepositoryImpl } from './repository';
import { TrainServiceImpl, SeatServiceImpl } from './service';
import { adminOnlyMiddleware } from '../middleware/adminOnly';
import { authMiddleware } from '../middleware/auth';

/**
 * Train && Seat setup
 */
const trainRepository = new TrainRepositoryImpl();
const seatRepository = new SeatRepositoryImpl();
const trainService = new TrainServiceImpl(trainRepository);
const seatService = new SeatServiceImpl(seatRepository);
const trainController = new TrainControllerImpl(trainService);
const seatController = new SeatControllerImpl(seatService);

/**
 * Train routes
 */
export const trainRoutes = Router();

trainRoutes.get('/', trainController.getAll);
trainRoutes.get('/:id', trainController.getById);
trainRoutes.post('/', authMiddleware, adminOnlyMiddleware, trainController.create);
trainRoutes.put('/:id', authMiddleware, adminOnlyMiddleware, trainController.update);
trainRoutes.delete('/:id', authMiddleware, adminOnlyMiddleware, trainController.delete);

/**
 * Seat routes
 */
export const seatRoutes = Router();

seatRoutes.get('/train/:trainId', seatController.getByTrain);
seatRoutes.get('/train/:trainId/class/:class', seatController.getByClass);
seatRoutes.post('/train/:trainId', authMiddleware, adminOnlyMiddleware, seatController.create);
seatRoutes.delete('/:id', authMiddleware, adminOnlyMiddleware, seatController.delete);
