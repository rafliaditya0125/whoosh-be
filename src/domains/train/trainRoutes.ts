import { Router } from 'express';

import { TrainControllerImpl } from './trainController';
import { TrainRepositoryImpl } from './trainRepository';
import { TrainServiceImpl } from './trainService';
import { adminOnlyMiddleware } from '../middleware/adminOnly';
import { authMiddleware } from '../middleware/auth';

/**
 * Train setup
 */
const trainRepository = new TrainRepositoryImpl();
const trainService = new TrainServiceImpl(trainRepository);
const trainController = new TrainControllerImpl(trainService);

/**
 * Train routes
 */
export const trainRoutes = Router();

trainRoutes.get('/', trainController.getAll);
trainRoutes.get('/:id', trainController.getById);
trainRoutes.post('/', authMiddleware, adminOnlyMiddleware, trainController.create);
trainRoutes.put('/:id', authMiddleware, adminOnlyMiddleware, trainController.update);
trainRoutes.delete('/:id', authMiddleware, adminOnlyMiddleware, trainController.delete);
