import { Request, Response, NextFunction } from 'express';

import { ScheduleService } from './scheduleService';
import { CreateSchedule } from './scheduleTypes';
import { AppError, ErrorCode } from '../../shared/error';

/**
 * Schedule controller interface
 */
export interface ScheduleController {
  getAll(request: Request, response: Response, next: NextFunction): Promise<void>;
  getById(request: Request, response: Response, next: NextFunction): Promise<void>;
  create(request: Request, response: Response, next: NextFunction): Promise<void>;
  update(request: Request, response: Response, next: NextFunction): Promise<void>;
  updateStatus(request: Request, response: Response, next: NextFunction): Promise<void>;
  delete(request: Request, response: Response, next: NextFunction): Promise<void>;
}

/**
 * Schedule controller implementation
 */
export class ScheduleControllerImpl implements ScheduleController {
  constructor(private scheduleService: ScheduleService) {
    this.getAll = this.getAll.bind(this);
    this.getById = this.getById.bind(this);
    this.create = this.create.bind(this);
    this.update = this.update.bind(this);
    this.updateStatus = this.updateStatus.bind(this);
    this.delete = this.delete.bind(this);
  }

  async getAll(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const params = {
        departure: request.query.departure as string | undefined,
        arrival: request.query.arrival as string | undefined,
        date: request.query.date as string | undefined,
      };

      const schedules = await this.scheduleService.findAll(params);
      response.json(schedules);
    } catch (error) {
      next(error); // Let error handler middleware handle all errors
    }
  }

  async getById(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const schedule = await this.scheduleService.findById(request.params.id as string);
      if (!schedule) {
        throw new AppError('Schedule not found', 404, ErrorCode.NOT_FOUND);
      }
      response.json(schedule);
    } catch (error) {
      next(error); // Let error handler middleware handle all errors
    }
  }

  async create(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const createData: CreateSchedule = {
        train_id: request.body.train_id,
        departure_station: request.body.departure_station,
        arrival_station: request.body.arrival_station,
        departure_time: request.body.departure_time,
        arrival_time: request.body.arrival_time,
        price: request.body.price,
      };

      const schedule_id = await this.scheduleService.create(createData);
      response.status(201).json({ schedule_id });
    } catch (error) {
      next(error); // Let error handler middleware handle all errors
    }
  }

  async update(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const updateData: Partial<CreateSchedule> = {
        train_id: request.body.train_id,
        departure_station: request.body.departure_station,
        arrival_station: request.body.arrival_station,
        departure_time: request.body.departure_time,
        arrival_time: request.body.arrival_time,
        price: request.body.price,
      };

      await this.scheduleService.update(request.params.id as string, updateData);
      response.json({ message: 'Schedule updated' });
    } catch (error) {
      next(error); // Let error handler middleware handle all errors
    }
  }

  async updateStatus(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const { status } = request.body;

      if (!status || !['active', 'inactive'].includes(status)) {
        throw new AppError('Status must be active or inactive', 400, ErrorCode.VALIDATION_ERROR);
      }

      await this.scheduleService.updateStatus(request.params.id as string, status);
      response.json({ message: 'Schedule status updated', status });
    } catch (error) {
      next(error); // Let error handler middleware handle all errors
    }
  }

  async delete(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      await this.scheduleService.delete(request.params.id as string);
      response.json({ message: 'Schedule deleted' });
    } catch (error) {
      next(error); // Let error handler middleware handle all errors
    }
  }
}
