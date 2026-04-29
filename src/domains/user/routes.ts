import { Router } from 'express';

import { UserControllerImpl, SavedPassengerControllerImpl } from './controller';
import { UserRepositoryImpl, SavedPassengerRepositoryImpl } from './repository';
import { UserServiceImpl, SavedPassengerServiceImpl } from './service';
import { authMiddleware } from '../middleware/auth';

/**
 * User and Saved Passenger setup
 */
const userRepository = new UserRepositoryImpl();
const savedPassengerRepository = new SavedPassengerRepositoryImpl();
const userService = new UserServiceImpl(userRepository);
const savedPassengerService = new SavedPassengerServiceImpl(savedPassengerRepository);
const userController = new UserControllerImpl(userService);
const savedPassengerController = new SavedPassengerControllerImpl(savedPassengerService);

/**
 * User routes
 */
export const userRoutes = Router();

userRoutes.get('/profile', authMiddleware, userController.getProfile);
userRoutes.put('/profile', authMiddleware, userController.updateProfile);
userRoutes.delete('/profile', authMiddleware, userController.deleteProfile);

/**
 * Saved passenger routes
 */
export const savedPassengerRoutes = Router();

savedPassengerRoutes.get('/', authMiddleware, savedPassengerController.getAll);
savedPassengerRoutes.post('/', authMiddleware, savedPassengerController.create);
savedPassengerRoutes.delete('/:id', authMiddleware, savedPassengerController.delete);
