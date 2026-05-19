import { Router } from 'express';

import { authMiddleware } from '../middleware/auth';
import { adminOnlyMiddleware } from '../middleware/adminOnly';
import { AdminControllerImpl } from './adminController';
import { AdminRepositoryImpl } from './adminRepository';
import { AdminServiceImpl } from './adminService';

/**
 * Admin setup
 */
const adminRepository = new AdminRepositoryImpl();
const adminService = new AdminServiceImpl(adminRepository);
const adminController = new AdminControllerImpl(adminService);

/**
 * Admin routes
 * All routes require authentication and admin role
 */
export const adminRoutes = Router();

// User management
adminRoutes.get('/users', authMiddleware, adminOnlyMiddleware, adminController.getUsers);
adminRoutes.get('/users/:id', authMiddleware, adminOnlyMiddleware, adminController.getUserById);
adminRoutes.put('/users/:id', authMiddleware, adminOnlyMiddleware, adminController.updateUser);
adminRoutes.patch('/users/:id/status', authMiddleware, adminOnlyMiddleware, adminController.updateUserStatus);

// Booking management
adminRoutes.get('/bookings', authMiddleware, adminOnlyMiddleware, adminController.getBookings);

// Refund management
adminRoutes.get('/refunds', authMiddleware, adminOnlyMiddleware, adminController.getRefunds);
adminRoutes.put('/refunds/:id', authMiddleware, adminOnlyMiddleware, adminController.updateRefund);
