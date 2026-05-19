import { Router } from 'express';

import { authMiddleware } from '../middleware/auth';
import { managerOnlyMiddleware } from '../middleware/managerOnly';
import { ManagerControllerImpl } from './managerController';
import { ManagerRepositoryImpl } from './managerRepository';
import { ManagerServiceImpl } from './managerService';

/**
 * Manager setup
 */
const managerRepository = new ManagerRepositoryImpl();
const managerService = new ManagerServiceImpl(managerRepository);
const managerController = new ManagerControllerImpl(managerService);

/**
 * Manager routes
 * All routes require authentication and manager/admin role
 */
export const managerRoutes = Router();

// Dashboard
managerRoutes.get('/dashboard', authMiddleware, managerOnlyMiddleware, managerController.getDashboard);

// Reports
managerRoutes.get('/reports/sales', authMiddleware, managerOnlyMiddleware, managerController.getSalesReport);
managerRoutes.get('/reports/export', authMiddleware, managerOnlyMiddleware, managerController.exportSalesReport);

// Transactions
managerRoutes.get('/transactions', authMiddleware, managerOnlyMiddleware, managerController.getTransactions);
