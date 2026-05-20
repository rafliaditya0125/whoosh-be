import { db } from '../../shared/db';
import { formatMySQLDateTime } from '../../shared/dateUtils';

/**
 * Booking repository interface
 */
export interface BookingRepository {
  findById(id: string): Promise<Booking | null>;
  findByIdWithDetails(id: string): Promise<any>;
  findByUserId(userId: string): Promise<Booking[]>;
  findByUserIdWithDetails(userId: string, limit?: number, offset?: number): Promise<any[]>;
  countByUserId(userId: string): Promise<number>;
  create(data: Partial<Booking>): Promise<string[]>;
  updateStatus(id: string, status: string): Promise<void>;
  addPassengers(passengers: Partial<BookingPassenger>[]): Promise<void>;
  getPassengers(bookingId: string): Promise<BookingPassenger[]>;
  createRefund(data: any): Promise<number[]>;
  getRefundById(id: string): Promise<any>;
  createRescheduleHistory(data: any): Promise<number[]>;
  updateBookingSchedule(bookingId: string, scheduleId: string): Promise<void>;
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
  booking_date: string; // Database column name
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
  passenger_id: string;
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
      .orderBy('bookings.booking_date', 'desc') as unknown as Booking[];
  }

  async create(data: Partial<Booking>): Promise<string[]> {
    const formattedData = { ...data };
    if (data.booking_date) formattedData.booking_date = formatMySQLDateTime(data.booking_date);
    return db('bookings').insert(formattedData);
  }

  async updateStatus(id: string, status: string): Promise<void> {
    await db('bookings').where({ booking_id: id }).update({ status });
  }

  async addPassengers(passengers: Partial<BookingPassenger>[]): Promise<void> {
    const formattedPassengers = passengers.map(p => ({
      ...p,
      created_at: p.created_at ? formatMySQLDateTime(p.created_at) : undefined,
      updated_at: p.updated_at ? formatMySQLDateTime(p.updated_at) : undefined,
    }));
    await db('booking_passengers').insert(formattedPassengers);
  }

  async getPassengers(bookingId: string): Promise<BookingPassenger[]> {
    return db('booking_passengers')
      .join('seats', 'booking_passengers.seat_id', 'seats.seat_id')
      .select('booking_passengers.*', 'seats.seat_number', 'seats.class')
      .where('booking_id', bookingId) as unknown as BookingPassenger[];
  }

  async createRefund(data: any): Promise<number[]> {
    const formattedData = { ...data };
    if (data.refund_date) formattedData.refund_date = formatMySQLDateTime(data.refund_date);
    return db('refunds').insert(formattedData);
  }

  async getRefundById(id: string): Promise<any> {
    return db('refunds').where({ refund_id: id }).first();
  }

  async createRescheduleHistory(data: any): Promise<number[]> {
    const formattedData = { ...data };
    if (data.old_departure_time) formattedData.old_departure_time = formatMySQLDateTime(data.old_departure_time);
    if (data.new_departure_time) formattedData.new_departure_time = formatMySQLDateTime(data.new_departure_time);
    return db('reschedule_history').insert(formattedData);
  }

  async updateBookingSchedule(bookingId: string, scheduleId: string): Promise<void> {
    await db('bookings').where({ booking_id: bookingId }).update({ schedule_id: scheduleId });
  }

  async findByUserIdWithDetails(userId: string, limit?: number, offset?: number): Promise<any[]> {
    let query = db('bookings')
      .where('bookings.user_id', userId)
      .orderBy('bookings.booking_date', 'desc')
      .select('bookings.booking_id');

    if (limit !== undefined) {
      query = query.limit(limit);
    }
    if (offset !== undefined) {
      query = query.offset(offset);
    }

    const bookings = await query;

    const result = [];
    for (const booking of bookings) {
      const detail = await this.findByIdWithDetails(booking.booking_id);
      if (detail) {
        result.push(detail);
      }
    }

    return result;
  }

  async countByUserId(userId: string): Promise<number> {
    const result = await db('bookings')
      .where('user_id', userId)
      .count('booking_id as total')
      .first();
    return Number(result?.total || 0);
  }

  async findByIdWithDetails(id: string): Promise<any> {
    // Get booking with schedule, train, and stations
    const booking = await db('bookings')
      .join('schedules', 'bookings.schedule_id', 'schedules.schedule_id')
      .join('trains', 'schedules.train_id', 'trains.train_id')
      .join('stations as dep', 'schedules.departure_station', 'dep.station_id')
      .join('stations as arr', 'schedules.arrival_station', 'arr.station_id')
      .select(
        'bookings.booking_id',
        'bookings.booking_code',
        'bookings.status',
        'bookings.total_price',
        'bookings.booking_date as created_at',
        'schedules.schedule_id',
        'schedules.departure_time',
        'schedules.arrival_time',
        'schedules.price',
        'trains.train_id',
        'trains.train_name',
        'trains.train_code',
        'dep.station_id as dep_station_id',
        'dep.station_name as dep_station_name',
        'dep.location as dep_location',
        'arr.station_id as arr_station_id',
        'arr.station_name as arr_station_name',
        'arr.location as arr_location'
      )
      .where('bookings.booking_id', id)
      .first();

    if (!booking) return null;

    // Get passengers with seats
    const passengers = await db('booking_passengers')
      .leftJoin('seats', 'booking_passengers.seat_id', 'seats.seat_id')
      .select(
        'booking_passengers.full_name',
        'booking_passengers.id_number',
        'seats.seat_id',
        'seats.seat_number',
        'seats.class'
      )
      .where('booking_passengers.booking_id', id);

    // Get payment info
    const payment = await db('payments')
      .select('payment_id', 'payment_status as status', 'payment_method as method', 'payment_date as paid_at')
      .where('booking_id', id)
      .first();

    // Get ticket info
    const ticket = await db('tickets')
      .select('ticket_id', 'qr_data')
      .where('booking_id', id)
      .first();

    // Format response according to mobile contract
    return {
      booking_id: booking.booking_id,
      booking_code: booking.booking_code,
      status: booking.status,
      total_price: booking.total_price,
      created_at: booking.created_at,
      schedule: {
        schedule_id: booking.schedule_id,
        departure_station: {
          station_id: booking.dep_station_id,
          station_name: booking.dep_station_name,
          location: booking.dep_location,
        },
        arrival_station: {
          station_id: booking.arr_station_id,
          station_name: booking.arr_station_name,
          location: booking.arr_location,
        },
        departure_time: booking.departure_time,
        arrival_time: booking.arrival_time,
        train: {
          train_id: booking.train_id,
          train_name: booking.train_name,
          train_code: booking.train_code,
        },
        price: booking.price,
      },
      passengers: passengers.map((p: any) => ({
        full_name: p.full_name,
        id_number: p.id_number,
        seat: p.seat_id ? {
          seat_id: p.seat_id,
          seat_number: p.seat_number,
          class: p.class,
        } : null,
      })),
      payment: payment ? {
        payment_id: payment.payment_id,
        status: payment.status,
        method: payment.method,
        paid_at: payment.paid_at,
      } : null,
      ticket: ticket ? {
        ticket_id: ticket.ticket_id,
        qr_code_url: `/api/tickets/${ticket.ticket_id}/qr`,
        qr_data: ticket.qr_data,
      } : null,
    };
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
