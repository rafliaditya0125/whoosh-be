import { Request, Response, NextFunction } from 'express';

import { SeatService } from './service';
import { Controller } from '../index';

export class SeatControllerImpl implements Controller {
  constructor(private seatService: SeatService) {}

  // This handle method is part of Controller interface but we usually use specific methods
  async handle(req: Request, res: Response, _next: NextFunction): Promise<void> {
    res.status(200).json({ message: 'Seat domain' });
  }

  lockSeats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.user_id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const result = await this.seatService.lockSeats(req.body, userId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  unlockSeats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { lock_id } = req.body;
      await this.seatService.unlockSeats(String(lock_id));
      res.status(200).json({ message: 'Seats unlocked successfully' });
    } catch (error) {
      next(error);
    }
  };

  getAvailableSeats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { schedule_id, class: className } = req.query;
      const result = await this.seatService.getAvailableSeats(schedule_id as string, className as string);
      res.status(200).json({
        schedule_id,
        available_seats: result,
      });
    } catch (error) {
      next(error);
    }
  };

  getByTrain = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { trainId } = req.params;
      const result = await this.seatService.getByTrain(String(trainId));
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  getByClass = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { trainId, class: className } = req.params;
      const classValue = Array.isArray(className) ? className[0] : className;
      const result = await this.seatService.getByClass(String(trainId), String(classValue));
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { trainId } = req.params;
      const [id] = await this.seatService.create({ ...req.body, train_id: trainId });
      res.status(201).json({ seat_id: id });
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      await this.seatService.delete(String(id));
      res.status(200).json({ message: 'Seat deleted successfully' });
    } catch (error) {
      next(error);
    }
  };
}
