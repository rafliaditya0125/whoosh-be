import { Seat, SeatLock, AvailableSeatResponse } from './seatTypes';
import { db } from '../../shared/db';
import { formatMySQLDateTime } from '../../shared/dateUtils';

/**
 * Seat repository interface
 */
export interface SeatRepository {
  findSeatById(id: string): Promise<Seat | null>;
  findLockById(lockId: string): Promise<SeatLock[]>;
  getAvailableSeats(scheduleId: string, className?: string): Promise<AvailableSeatResponse[]>;
  createLock(locks: Partial<SeatLock>[]): Promise<void>;
  updateLockStatus(lockId: string, status: string): Promise<void>;
  updateLockStatusBySeat(seatId: string, scheduleId: string, status: string): Promise<void>;
  releaseExpiredLocks(): Promise<number>;
  isSeatAvailable(seatId: string, scheduleId: string): Promise<boolean>;
  findByTrainId(trainId: string): Promise<Seat[]>;
  findByClass(trainId: string, className: string): Promise<Seat[]>;
  create(data: Partial<Seat>): Promise<string[]>;
  delete(id: string): Promise<void>;
}

/**
 * Seat repository implementation
 */
export class SeatRepositoryImpl implements SeatRepository {
  async findSeatById(id: string): Promise<Seat | null> {
    return db('seats').where({ seat_id: id }).first() as unknown as Seat | null;
  }

  async findByTrainId(trainId: string): Promise<Seat[]> {
    return db('seats').where({ train_id: trainId }) as unknown as Seat[];
  }

  async findByClass(trainId: string, className: string): Promise<Seat[]> {
    return db('seats').where({ train_id: trainId, class: className }) as unknown as Seat[];
  }

  async create(data: Partial<Seat>): Promise<string[]> {
    return db('seats').insert(data);
  }

  async delete(id: string): Promise<void> {
    await db('seats').where({ seat_id: id }).delete();
  }

  async findLockById(lockId: string): Promise<SeatLock[]> {
    return db('seat_locks').where({ lock_id: lockId }) as unknown as SeatLock[];
  }

  async getAvailableSeats(scheduleId: string, className?: string): Promise<AvailableSeatResponse[]> {
    // Get train_id for this schedule
    const schedule = await db('schedules').where({ schedule_id: scheduleId }).first();
    if (!schedule) return [];

    const trainId = schedule.train_id;

    // Subquery for booked seats
    const bookedSeatsSubquery = db('booking_passengers')
      .select('booking_passengers.seat_id')
      .join('bookings', 'booking_passengers.booking_id', 'bookings.booking_id')
      .where('bookings.schedule_id', scheduleId)
      .whereIn('bookings.status', ['paid', 'pending', 'completed']);

    // Subquery for locked seats
    const lockedSeatsSubquery = db('seat_locks')
      .select('seat_id')
      .where('schedule_id', scheduleId)
      .where('status', 'active')
      .where('expires_at', '>', db.fn.now());

    // Main query
    let query = db('seats')
      .where('seats.train_id', trainId)
      .select(
        'seats.seat_id',
        'seats.seat_number',
        'seats.class',
        db.raw(`
          CASE 
            WHEN seats.seat_id IN (${bookedSeatsSubquery.toString()}) THEN 'booked'
            WHEN seats.seat_id IN (${lockedSeatsSubquery.toString()}) THEN 'locked'
            ELSE 'available'
          END as status
        `)
      );

    if (className) {
      query = query.where('seats.class', className);
    }

    return query as unknown as AvailableSeatResponse[];
  }

  async createLock(locks: Partial<SeatLock>[]): Promise<void> {
    const formattedLocks = locks.map(lock => ({
      ...lock,
      locked_at: lock.locked_at ? formatMySQLDateTime(lock.locked_at) : undefined,
      expires_at: lock.expires_at ? formatMySQLDateTime(lock.expires_at) : undefined,
    }));
    await db('seat_locks').insert(formattedLocks);
  }

  async updateLockStatus(lockId: string, status: string): Promise<void> {
    await db('seat_locks').where({ lock_id: lockId }).update({ status });
  }

  async updateLockStatusBySeat(seatId: string, scheduleId: string, status: string): Promise<void> {
    await db('seat_locks')
      .where({ seat_id: seatId, schedule_id: scheduleId, status: 'active' })
      .update({ status });
  }

  async releaseExpiredLocks(): Promise<number> {
    return db('seat_locks')
      .where('status', 'active')
      .andWhere('expires_at', '<', db.fn.now())
      .update({ status: 'expired' });
  }

  async isSeatAvailable(seatId: string, scheduleId: string): Promise<boolean> {
    // Check if booked
    const booked = await db('booking_passengers')
      .join('bookings', 'booking_passengers.booking_id', 'bookings.booking_id')
      .where('bookings.schedule_id', scheduleId)
      .where('booking_passengers.seat_id', seatId)
      .whereIn('bookings.status', ['paid', 'pending', 'completed'])
      .first();

    if (booked) return false;

    // Check if locked
    const locked = await db('seat_locks')
      .where('seat_id', seatId)
      .where('schedule_id', scheduleId)
      .where('status', 'active')
      .where('expires_at', '>', db.fn.now())
      .first();

    if (locked) return false;

    return true;
  }
}
