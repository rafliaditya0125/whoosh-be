import { db } from '../../shared/db';

/**
 * Booking repository interface
 */
export interface BookingRepository {
  findById(id: string): Promise<Booking | null>;
  findByUserId(userId: string): Promise<Booking[]>;
  create(data: Partial<Booking>): Promise<string[]>;
  updateStatus(id: string, status: string): Promise<void>;
  addPassengers(passengers: Partial<BookingPassenger>[]): Promise<void>;
  getPassengers(bookingId: string): Promise<BookingPassenger[]>;
}

/**
 * Seat repository interface
 */
export interface SeatRepository {
  getAvailableSeats(trainId: string, scheduleId: string): Promise<Seat[]>;
  findById(id: string): Promise<Seat | null>;
}

/**
 * Booking interface
 */
export interface Booking {
  booking_id: string;
  user_id: string;
  schedule_id: string;
  booking_code: string;
  total_price: number;
  status: 'pending' | 'paid' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  // Joined fields
  train_name: string;
  departure_station_name: string;
  arrival_station_name: string;
  departure_time: string;
  arrival_time: string;
  price: number;
}

/**
 * Create booking interface
 */
export interface CreateBooking {
  user_id: string;
  schedule_id: string;
  booking_code: string;
  total_price: number;
  status: 'pending';
}

/**
 * Booking passenger interface
 */
export interface BookingPassenger {
  id: string;
  booking_id: string;
  full_name: string;
  id_number: string;
  seat_id: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  seat_number: string;
  class: 'economy' | 'business' | 'vip';
}

/**
 * Seat interface
 */
export interface Seat {
  seat_id: string;
  train_id: string;
  seat_number: string;
  class: 'economy' | 'business' | 'vip';
  created_at: string;
  updated_at: string;
}

/**
 * Booking repository implementation
 */
export class BookingRepositoryImpl implements BookingRepository {
  async findById(id: string): Promise<Booking | null> {
    return db('bookings')
      .join('schedules', 'bookings.schedule_id', 'schedules.schedule_id')
      .join('trains', 'schedules.train_id', 'trains.train_id')
      .join('stations as dep', 'schedules.departure_station', 'dep.station_id')
      .join('stations as arr', 'schedules.arrival_station', 'arr.station_id')
      .select(
        'bookings.*',
        'trains.train_name',
        'dep.station_name as departure_station_name',
        'arr.station_name as arrival_station_name',
        'schedules.departure_time',
        'schedules.arrival_time',
        'schedules.price'
      )
      .where('booking_id', id)
      .first() as unknown as Booking | null;
  }

  async findByUserId(userId: string): Promise<Booking[]> {
    return db('bookings')
      .join('schedules', 'bookings.schedule_id', 'schedules.schedule_id')
      .join('trains', 'schedules.train_id', 'trains.train_id')
      .select('bookings.*', 'trains.train_name', 'schedules.departure_time')
      .where('user_id', userId)
      .orderBy('bookings.created_at', 'desc') as unknown as Booking[];
  }

  async create(data: Partial<Booking>): Promise<string[]> {
    return db('bookings').insert(data);
  }

  async updateStatus(id: string, status: string): Promise<void> {
    await db('bookings').where({ booking_id: id }).update({ status });
  }

  async addPassengers(passengers: Partial<BookingPassenger>[]): Promise<void> {
    await db('booking_passengers').insert(passengers);
  }

  async getPassengers(bookingId: string): Promise<BookingPassenger[]> {
    return db('booking_passengers')
      .join('seats', 'booking_passengers.seat_id', 'seats.seat_id')
      .select('booking_passengers.*', 'seats.seat_number', 'seats.class')
      .where('booking_id', bookingId) as unknown as BookingPassenger[];
  }
}

/**
 * Seat repository implementation
 */
export class SeatRepositoryImpl implements SeatRepository {
  async getAvailableSeats(trainId: string, scheduleId: string): Promise<Seat[]> {
    return db('seats')
      .where('train_id', trainId)
      .whereNotIn('seat_id', function() {
        this.select('seat_id')
          .from('booking_passengers')
          .join('bookings', 'booking_passengers.booking_id', 'bookings.booking_id')
          .where('bookings.schedule_id', scheduleId)
          .whereIn('bookings.status', ['paid', 'pending']);
      })
      .select() as unknown as Seat[];
  }

  async findById(id: string): Promise<Seat | null> {
    return db('seats').where({ seat_id: id }).first() as unknown as Seat | null;
  }
}
