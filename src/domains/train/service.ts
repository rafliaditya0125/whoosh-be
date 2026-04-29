import { TrainRepository, SeatRepository } from './repository';
import { Train, Seat, CreateTrain, CreateSeat } from './types';
import { AppError, ErrorCode } from '../../shared/error';

/**
 * Train service interface
 */
export interface TrainService {
  findAll(): Promise<Train[]>;
  findById(id: string): Promise<Train | null>;
  create(data: CreateTrain): Promise<string>;
  update(id: string, data: Partial<Train>): Promise<void>;
  delete(id: string): Promise<void>;
}

/**
 * Seat service interface
 */
export interface SeatService {
  findByTrainId(trainId: string): Promise<Seat[]>;
  findByClass(trainId: string, className: 'economy' | 'business' | 'vip'): Promise<Seat[]>;
  create(trainId: string, data: CreateSeat): Promise<string>;
  delete(id: string): Promise<void>;
}

/**
 * Train service implementation
 */
export class TrainServiceImpl implements TrainService {
  constructor(private trainRepository: TrainRepository) {}

  async findAll(): Promise<Train[]> {
    return this.trainRepository.findAll();
  }

  async findById(id: string): Promise<Train | null> {
    return this.trainRepository.findById(id);
  }

  async create(data: CreateTrain): Promise<string> {
    const [train_id] = await this.trainRepository.create(data);
    return train_id;
  }

  async update(id: string, data: Partial<Train>): Promise<void> {
    const existing = await this.trainRepository.findById(id);
    if (!existing) {
      throw new AppError('Train not found', 404, ErrorCode.NOT_FOUND);
    }
    await this.trainRepository.update(id, data);
  }

  async delete(id: string): Promise<void> {
    const existing = await this.trainRepository.findById(id);
    if (!existing) {
      throw new AppError('Train not found', 404, ErrorCode.NOT_FOUND);
    }
    await this.trainRepository.delete(id);
  }
}

/**
 * Seat service implementation
 */
export class SeatServiceImpl implements SeatService {
  constructor(private seatRepository: SeatRepository) {}

  async findByTrainId(trainId: string): Promise<Seat[]> {
    return this.seatRepository.findByTrainId(trainId);
  }

  async findByClass(trainId: string, className: 'economy' | 'business' | 'vip'): Promise<Seat[]> {
    return this.seatRepository.findByClass(trainId, className);
  }

  async create(trainId: string, data: CreateSeat): Promise<string> {
    const [seat_id] = await this.seatRepository.create({ ...data, train_id: trainId });
    return seat_id;
  }

  async delete(id: string): Promise<void> {
    const existing = await this.seatRepository.findById(id);
    if (!existing) {
      throw new AppError('Seat not found', 404, ErrorCode.NOT_FOUND);
    }
    await this.seatRepository.delete(id);
  }
}
