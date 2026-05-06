import { Router } from 'express';

import { TicketControllerImpl } from './controller';
import { TicketRepositoryImpl } from './repository';
import { TicketServiceImpl } from './service';
import { authMiddleware } from '../middleware/auth';

const ticketRepository = new TicketRepositoryImpl();
const ticketService = new TicketServiceImpl(ticketRepository);
const ticketController = new TicketControllerImpl(ticketService);

export const ticketRoutes = Router();

ticketRoutes.get('/:id/qr', authMiddleware, ticketController.getQR);
ticketRoutes.post('/validate', authMiddleware, ticketController.validate);
