import { Schedule, CreateSchedule } from './scheduleTypes';
import { db } from '../../shared/db';
import { formatMySQLDateTime } from '../../shared/dateUtils';

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
        'dep.station_name as dep_name',
        'dep.location as dep_location',
        'arr.station_name as arr_name',
        'arr.location as arr_location'
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

    const results = await query;
    return Promise.all(results.map(s => this.mapSchedule(s)));
  }

  async findById(id: string): Promise<Schedule | null> {
    const s = await db('schedules')
      .join('trains', 'schedules.train_id', 'trains.train_id')
      .join('stations as dep', 'schedules.departure_station', 'dep.station_id')
      .join('stations as arr', 'schedules.arrival_station', 'arr.station_id')
      .select(
        'schedules.*',
        'trains.train_name',
        'dep.station_name as dep_name',
        'dep.location as dep_location',
        'arr.station_name as arr_name',
        'arr.location as arr_location'
      )
      .where('schedule_id', id)
      .first();

    if (!s) return null;
    return this.mapSchedule(s);
  }

  private async mapSchedule(s: any): Promise<Schedule> {
    const availability = await this.getAvailability(s.schedule_id, s.train_id);
    return {
      schedule_id: String(s.schedule_id),
      train_id: String(s.train_id),
      departure_time: s.departure_time,
      arrival_time: s.arrival_time,
      price: Number(s.price),
      price_business: s.price_business ? Number(s.price_business) : undefined,
      price_vip: s.price_vip ? Number(s.price_vip) : undefined,
      status: s.status,
      created_at: s.created_at,
      updated_at: s.updated_at,
      departure_station: {
        station_id: String(s.departure_station),
        station_name: s.dep_name,
        location: s.dep_location,
      },
      arrival_station: {
        station_id: String(s.arrival_station),
        station_name: s.arr_name,
        location: s.arr_location,
      },
      ...availability
    } as Schedule;
  }

  private async getAvailability(scheduleId: string, trainId: string) {
    const classes = ['economy', 'business', 'vip'];
    const result: any = {};

    for (const className of classes) {
      const totalSeats = await db('seats')
        .where({ train_id: trainId, class: className })
        .count('seat_id as count')
        .first();

      const bookedSeats = await db('booking_passengers')
        .join('bookings', 'booking_passengers.booking_id', 'bookings.booking_id')
        .join('seats', 'booking_passengers.seat_id', 'seats.seat_id')
        .where('bookings.schedule_id', scheduleId)
        .where('seats.class', className)
        .whereIn('bookings.status', ['paid', 'pending', 'completed'])
        .count('booking_passengers.passenger_id as count')
        .first();

      const lockedSeats = await db('seat_locks')
        .join('seats', 'seat_locks.seat_id', 'seats.seat_id')
        .where('seat_locks.schedule_id', scheduleId)
        .where('seats.class', className)
        .where('seat_locks.status', 'active')
        .where('seat_locks.expires_at', '>', db.fn.now())
        .count('seat_locks.lock_id as count')
        .first();

      const total = Number(totalSeats?.count || 0);
      const booked = Number(bookedSeats?.count || 0);
      const locked = Number(lockedSeats?.count || 0);
      
      result[`available_${className}`] = Math.max(0, total - booked - locked);
    }

    return result;
  }

  async create(data: CreateSchedule): Promise<string[]> {
    const formattedData = {
      ...data,
      departure_time: formatMySQLDateTime(data.departure_time),
      arrival_time: formatMySQLDateTime(data.arrival_time)
    };
    return db('schedules').insert(formattedData);
  }

  async update(id: string, data: Partial<Schedule>): Promise<void> {
    const formattedData = { ...data };
    if (data.departure_time) formattedData.departure_time = formatMySQLDateTime(data.departure_time);
    if (data.arrival_time) formattedData.arrival_time = formatMySQLDateTime(data.arrival_time);
    
    await db('schedules').where({ schedule_id: id }).update(formattedData);
  }

  async delete(id: string): Promise<void> {
    await db('schedules').where({ schedule_id: id }).del();
  }
}
