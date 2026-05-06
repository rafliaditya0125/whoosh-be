import { Request, Response, NextFunction } from 'express';

import { TicketServiceImpl } from './service';

export class TicketControllerImpl {
  constructor(private ticketService: TicketServiceImpl) {}

  getQR = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.ticketService.getTicketQR(String(req.params.id));
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  validate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { qr_data, station_id, validator_id } = req.body;
      const result = await this.ticketService.validateTicket(qr_data, station_id, validator_id);
      res.status(200).json({ valid: true, ticket: result });
    } catch (error) {
      next(error);
    }
  };
}
