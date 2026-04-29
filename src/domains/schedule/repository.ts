import { Schedule, CreateSchedule } from './types';
import { db } from '../../shared/db';

/**
 * Schedule repository interface
 */
export interface ScheduleRepository {
  findAll(params?: { departure?: string; arrival?: string; date?: string }): Promise<Schedule[]>;
  findById(id: string): Promise<Schedule | null>;
  create(data: CreateSchedule): Promise<string[]>;
  update(id: string, data: Partial<Schedule>): Promise<void>;
  delete(id: string): Promise<void>;
}

/**
 * Schedule repository implementation
 */
export class ScheduleRepositoryImpl implements ScheduleRepository {
  async findAll(params?: { departure?: string; arrival?: string; date?: string }): Promise<Schedule[]> {
    let query = db('schedules')
      .join('trains', 'schedules.train_id', 'trains.train_id')
      .join('stations as dep', 'schedules.departure_station', 'dep.station_id')
      .join('stations as arr', 'schedules.arrival_station', 'arr.station_id')
      .select(
        'schedules.*',
        'trains.train_name',
        'dep.station_name as departure_station_name',
        'arr.station_name as arrival_station_name'
      );

    if (params?.departure) {
      query = query.where('dep.station_id', params.departure);
    }
    if (params?.arrival) {
      query = query.where('arr.station_id', params.arrival);
    }
    if (params?.date) {
      query = query.whereRaw('DATE(departure_time) = ?', [params.date]);
    }

    return query as Schedule[];
  }

  async findById(id: string): Promise<Schedule | null> {
    return db('schedules')
      .join('trains', 'schedules.train_id', 'trains.train_id')
      .join('stations as dep', 'schedules.departure_station', 'dep.station_id')
      .join('stations as arr', 'schedules.arrival_station', 'arr.station_id')
      .where('schedule_id', id)
      .first() as Schedule | null;
  }

  async create(data: CreateSchedule): Promise<string[]> {
    return db('schedules').insert(data);
  }

  async update(id: string, data: Partial<Schedule>): Promise<void> {
    await db('schedules').where({ schedule_id: id }).update(data);
  }

  async delete(id: string): Promise<void> {
    await db('schedules').where({ schedule_id: id }).del();
  }
}
