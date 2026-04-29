import { Router } from 'express';

import { ScheduleControllerImpl } from './controller';
import { ScheduleRepositoryImpl } from './repository';
import { ScheduleServiceImpl } from './service';
import { adminOnlyMiddleware } from '../middleware/adminOnly';
import { authMiddleware } from '../middleware/auth';

/**
 * Schedule setup
 */
const scheduleRepository = new ScheduleRepositoryImpl();
const scheduleService = new ScheduleServiceImpl(scheduleRepository);
const scheduleController = new ScheduleControllerImpl(scheduleService);

/**
 * Schedule routes
 */
export const scheduleRoutes = Router();

scheduleRoutes.get('/', scheduleController.getAll);
scheduleRoutes.get('/:id', scheduleController.getById);
scheduleRoutes.post('/', authMiddleware, adminOnlyMiddleware, scheduleController.create);
scheduleRoutes.put('/:id', authMiddleware, adminOnlyMiddleware, scheduleController.update);
scheduleRoutes.delete('/:id', authMiddleware, adminOnlyMiddleware, scheduleController.delete);
