import { Train, CreateTrain, Seat, CreateSeat } from './trainTypes';
import { db } from '../../shared/db';

/**
 * Train repository interface
 */
export interface TrainRepository {
  findAll(): Promise<Train[]>;
  findById(id: string): Promise<Train | null>;
  create(data: CreateTrain): Promise<string[]>;
  update(id: string, data: Partial<Train>): Promise<void>;
  delete(id: string): Promise<void>;
}

/**
 * Seat repository interface
 */
export interface SeatRepository {
  findByTrainId(trainId: string): Promise<Seat[]>;
  findByClass(trainId: string, className: 'economy' | 'business' | 'vip'): Promise<Seat[]>;
  findById(id: string): Promise<Seat | null>;
  create(data: CreateSeat): Promise<string[]>;
  delete(id: string): Promise<void>;
}

/**
 * Train repository implementation
 */
export class TrainRepositoryImpl implements TrainRepository {
  async findAll(): Promise<Train[]> {
    return db('trains').select('*') as unknown as Train[];
  }

  async findById(id: string): Promise<Train | null> {
    return db('trains').where({ train_id: id }).first() as unknown as Train | null;
  }

  async create(data: CreateTrain): Promise<string[]> {
    return db('trains').insert(data);
  }

  async update(id: string, data: Partial<Train>): Promise<void> {
    await db('trains').where({ train_id: id }).update(data);
  }

  async delete(id: string): Promise<void> {
    await db('trains').where({ train_id: id }).del();
  }
}

/**
 * Seat repository implementation
 */
export class SeatRepositoryImpl implements SeatRepository {
  async findByTrainId(trainId: string): Promise<Seat[]> {
    return db('seats').where({ train_id: trainId }) as unknown as Seat[];
  }

  async findByClass(trainId: string, className: 'economy' | 'business' | 'vip'): Promise<Seat[]> {
    return db('seats').where({ train_id: trainId, class: className }) as unknown as Seat[];
  }

  async findById(id: string): Promise<Seat | null> {
    return db('seats').where({ seat_id: id }).first() as unknown as Seat | null;
  }

  async create(data: CreateSeat): Promise<string[]> {
    return db('seats').insert(data);
  }

  async delete(id: string): Promise<void> {
    await db('seats').where({ seat_id: id }).del();
  }
}
