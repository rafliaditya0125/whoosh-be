import { Station, CreateStation } from './types';
import { db } from '../../shared/db';

/**
 * Station repository interface
 */
export interface StationRepository {
  findAll(): Promise<Station[]>;
  findById(id: string): Promise<Station | null>;
  create(data: CreateStation): Promise<string[]>;
  update(id: string, data: Partial<Station>): Promise<void>;
  delete(id: string): Promise<void>;
}

/**
 * Station repository implementation
 */
export class StationRepositoryImpl implements StationRepository {
  async findAll(): Promise<Station[]> {
    return db('stations').select('*') as Station[];
  }

  async findById(id: string): Promise<Station | null> {
    return db('stations').where({ station_id: id }).first() as Station | null;
  }

  async create(data: CreateStation): Promise<string[]> {
    return db('stations').insert(data);
  }

  async update(id: string, data: Partial<Station>): Promise<void> {
    await db('stations').where({ station_id: id }).update(data);
  }

  async delete(id: string): Promise<void> {
    await db('stations').where({ station_id: id }).del();
  }
}
