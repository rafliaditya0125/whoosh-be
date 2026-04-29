import { Request, Response, NextFunction } from 'express';

import { StationService } from './service';
import { CreateStation } from './types';
import { AppError, ErrorCode } from '../../shared/error';

/**
 * Station controller interface
 */
export interface StationController {
  getAll(request: Request, response: Response, next: NextFunction): Promise<void>;
  getById(request: Request, response: Response, next: NextFunction): Promise<void>;
  create(request: Request, response: Response, next: NextFunction): Promise<void>;
  update(request: Request, response: Response, next: NextFunction): Promise<void>;
  delete(request: Request, response: Response, next: NextFunction): Promise<void>;
}

/**
 * Station controller implementation
 */
export class StationControllerImpl implements StationController {
  constructor(private stationService: StationService) {
    this.getAll = this.getAll.bind(this);
    this.getById = this.getById.bind(this);
    this.create = this.create.bind(this);
    this.update = this.update.bind(this);
    this.delete = this.delete.bind(this);
  }

  async getAll(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const stations = await this.stationService.findAll();
      response.json(stations);
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
      const station = await this.stationService.findById(request.params.id);
      if (!station) {
        throw new AppError('Station not found', 404, ErrorCode.NOT_FOUND);
      }
      response.json(station);
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
      const createData: CreateStation = {
        station_name: request.body.station_name,
        location: request.body.location,
      };

      const station_id = await this.stationService.create(createData);
      response.status(201).json({ station_id });
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
      const updateData: Partial<CreateStation> = {
        station_name: request.body.station_name,
        location: request.body.location,
      };

      await this.stationService.update(request.params.id, updateData);
      response.json({ message: 'Station updated' });
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
      await this.stationService.delete(request.params.id);
      response.json({ message: 'Station deleted' });
    } catch (error) {
      if (error instanceof AppError) {
        response.status(error.statusCode).json({ error: error.message });
      } else {
        next(error);
      }
    }
  }
}
