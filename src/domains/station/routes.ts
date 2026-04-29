import { Router } from 'express';

import { StationControllerImpl } from './controller';
import { StationRepositoryImpl } from './repository';
import { StationServiceImpl } from './service';
import { adminOnlyMiddleware } from '../middleware/adminOnly';
import { authMiddleware } from '../middleware/auth';

/**
 * Station setup
 */
const stationRepository = new StationRepositoryImpl();
const stationService = new StationServiceImpl(stationRepository);
const stationController = new StationControllerImpl(stationService);

/**
 * Station routes
 */
export const stationRoutes = Router();

stationRoutes.get('/', stationController.getAll);
stationRoutes.get('/:id', stationController.getById);
stationRoutes.post('/', authMiddleware, adminOnlyMiddleware, stationController.create);
stationRoutes.put('/:id', authMiddleware, adminOnlyMiddleware, stationController.update);
stationRoutes.delete('/:id', authMiddleware, adminOnlyMiddleware, stationController.delete);
