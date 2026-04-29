import { Request, Response, NextFunction } from 'express';

import { TrainService, SeatService } from './service';
import { CreateTrain, CreateSeat } from './types';
import { AppError, ErrorCode } from '../../shared/error';

/**
 * Train controller interface
 */
export interface TrainController {
  getAll(request: Request, response: Response, next: NextFunction): Promise<void>;
  getById(request: Request, response: Response, next: NextFunction): Promise<void>;
  create(request: Request, response: Response, next: NextFunction): Promise<void>;
  update(request: Request, response: Response, next: NextFunction): Promise<void>;
  delete(request: Request, response: Response, next: NextFunction): Promise<void>;
}

/**
 * Seat controller interface
 */
export interface SeatController {
  getByTrain(request: Request, response: Response, next: NextFunction): Promise<void>;
  getByClass(request: Request, response: Response, next: NextFunction): Promise<void>;
  create(request: Request, response: Response, next: NextFunction): Promise<void>;
  delete(request: Request, response: Response, next: NextFunction): Promise<void>;
}

/**
 * Train controller implementation
 */
export class TrainControllerImpl implements TrainController {
  constructor(private trainService: TrainService) {
    this.getAll = this.getAll.bind(this);
    this.getById = this.getById.bind(this);
    this.create = this.create.bind(this);
    this.update = this.update.bind(this);
    this.delete = this.delete.bind(this);
  }

  async getAll(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const trains = await this.trainService.findAll();
      response.json(trains);
    } catch (error) {
      if (error instanceof AppError) {
        response.status(error.statusCode).json({ error: error.message });
      } else {
        next(error);
      }
    }
  }

  async getById(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const train = await this.trainService.findById(request.params.id);
      if (!train) {
        throw new AppError('Train not found', 404, ErrorCode.NOT_FOUND);
      }
      response.json(train);
    } catch (error) {
      if (error instanceof AppError) {
        response.status(error.statusCode).json({ error: error.message });
      } else {
        next(error);
      }
    }
  }

  async create(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const createData: CreateTrain = {
        train_name: request.body.train_name,
        train_code: request.body.train_code,
        total_seats: request.body.total_seats,
      };

      const train_id = await this.trainService.create(createData);
      response.status(201).json({ train_id });
    } catch (error) {
      if (error instanceof AppError) {
        response.status(error.statusCode).json({ error: error.message });
      } else {
        next(error);
      }
    }
  }

  async update(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const updateData: Partial<CreateTrain> = {
        train_name: request.body.train_name,
        train_code: request.body.train_code,
        total_seats: request.body.total_seats,
      };

      await this.trainService.update(request.params.id, updateData);
      response.json({ message: 'Train updated' });
    } catch (error) {
      if (error instanceof AppError) {
        response.status(error.statusCode).json({ error: error.message });
      } else {
        next(error);
      }
    }
  }

  async delete(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      await this.trainService.delete(request.params.id);
      response.json({ message: 'Train deleted' });
    } catch (error) {
      if (error instanceof AppError) {
        response.status(error.statusCode).json({ error: error.message });
      } else {
        next(error);
      }
    }
  }
}

/**
 * Seat controller implementation
 */
export class SeatControllerImpl implements SeatController {
  constructor(private seatService: SeatService) {
    this.getByTrain = this.getByTrain.bind(this);
    this.getByClass = this.getByClass.bind(this);
    this.create = this.create.bind(this);
    this.delete = this.delete.bind(this);
  }

  async getByTrain(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const seats = await this.seatService.findByTrainId(request.params.trainId);
      response.json(seats);
    } catch (error) {
      if (error instanceof AppError) {
        response.status(error.statusCode).json({ error: error.message });
      } else {
        next(error);
      }
    }
  }

  async getByClass(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const { trainId, class: className } = request.params;
      const seats = await this.seatService.findByClass(trainId, className as 'economy' | 'business' | 'vip');
      response.json(seats);
    } catch (error) {
      if (error instanceof AppError) {
        response.status(error.statusCode).json({ error: error.message });
      } else {
        next(error);
      }
    }
  }

  async create(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const createData: CreateSeat = {
        seat_number: request.body.seat_number,
        class: request.body.class,
      };

      const seat_id = await this.seatService.create(request.params.trainId, createData);
      response.status(201).json({ seat_id });
    } catch (error) {
      if (error instanceof AppError) {
        response.status(error.statusCode).json({ error: error.message });
      } else {
        next(error);
      }
    }
  }

  async delete(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      await this.seatService.delete(request.params.id);
      response.json({ message: 'Seat deleted' });
    } catch (error) {
      if (error instanceof AppError) {
        response.status(error.statusCode).json({ error: error.message });
      } else {
        next(error);
      }
    }
  }
}
