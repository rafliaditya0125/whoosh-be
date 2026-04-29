import { Router } from 'express';

import { AuthControllerImpl } from './controller';
import { AuthRepositoryImpl } from './repository';
import { AuthServiceImpl } from './service';
import { authMiddleware } from '../middleware/auth';

/**
 * Auth setup
 */
const authRepository = new AuthRepositoryImpl();
const authService = new AuthServiceImpl(authRepository);
const authController = new AuthControllerImpl(authService);

/**
 * Auth routes
 */
export const authRoutes = Router();

authRoutes.post('/register', authController.register);
authRoutes.post('/login', authController.login);
authRoutes.get('/me', authMiddleware, authController.me);
