import { v4 as uuidv4 } from 'uuid';

import { BookingRepository, SeatRepository, Booking } from './repository';
import { CreateBookingRequest, BookingResponse } from './types';
import { db } from '../../shared/db';
import { AppError, ErrorCode } from '../../shared/error';

/**
 * Booking service interface
 */
export interface BookingService {
  createBooking(request: CreateBookingRequest, userId: string): Promise<{ booking_id: string; booking_code: string; total_price: number }>;
  findById(bookingId: string): Promise<BookingResponse | null>;
  findByUserId(userId: string): Promise<Booking[]>;
  cancelBooking(bookingId: string, userId: string): Promise<void>;
}

/**
 * Booking service implementation
 */
export class BookingServiceImpl implements BookingService {
  constructor(
    private bookingRepository: BookingRepository,
    private seatRepository: SeatRepository
  ) {}

  async createBooking(request: CreateBookingRequest, userId: string): Promise<{ booking_id: string; booking_code: string; total_price: number }> {
    const { schedule_id, passengers } = request;

    // Start transaction
    const trx = await db.transaction();

    try {
      // Get schedule
      const schedule = await trx('schedules').where({ schedule_id }).first<{ schedule_id: string; train_id: string; price: number } | null>();
      if (!schedule) {
        throw new AppError('Schedule not found', 404, ErrorCode.NOT_FOUND);
      }

      // Calculate total price
      const total_price = passengers.length * schedule.price;

      // Generate booking code
      const booking_code = 'WOOSH-' + uuidv4().slice(0, 8).toUpperCase();

      // Create booking
      const [booking_id] = await this.bookingRepository.create({
        user_id: userId,
        schedule_id,
        booking_code,
        total_price,
        status: 'pending',
      });

      // Add passengers
      for (const p of passengers) {
        let final_seat_id = p.seat_id;
        if (!final_seat_id) {
          const availableSeats = await this.seatRepository.getAvailableSeats(schedule.train_id, schedule_id);
          if (availableSeats.length === 0) {
            throw new AppError('No seats available', 400, ErrorCode.VALIDATION_ERROR);
          }
          final_seat_id = availableSeats[0].seat_id;
        }

        await this.bookingRepository.addPassengers([{
          booking_id,
          full_name: p.full_name,
          id_number: p.id_number,
          seat_id: final_seat_id,
        }]);
      }

      await trx.commit();

      return { booking_id, booking_code, total_price };
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }

  async findById(bookingId: string): Promise<BookingResponse | null> {
    const booking = await this.bookingRepository.findById(bookingId);
    if (!booking) {
      return null;
    }

    const passengers = await this.bookingRepository.getPassengers(bookingId);

    return {
      booking_id: booking.booking_id,
      booking_code: booking.booking_code,
      total_price: booking.total_price,
      status: booking.status,
      schedule: {
        schedule_id: booking.schedule_id,
        train_name: booking.train_name,
        departure_station_name: booking.departure_station_name,
        arrival_station_name: booking.arrival_station_name,
        departure_time: booking.departure_time,
        arrival_time: booking.arrival_time,
        price: booking.price,
      },
      passengers: passengers.map((p) => ({
        full_name: p.full_name,
        id_number: p.id_number,
        seat_number: p.seat_number,
        class: p.class,
      })),
    };
  }

  async findByUserId(userId: string): Promise<Booking[]> {
    return this.bookingRepository.findByUserId(userId);
  }

  async cancelBooking(bookingId: string, userId: string): Promise<void> {
    const booking = await this.bookingRepository.findById(bookingId);
    if (!booking || booking.user_id !== userId) {
      throw new AppError('Booking not found', 404, ErrorCode.NOT_FOUND);
    }
    if (booking.status !== 'pending') {
      throw new AppError('Only pending bookings can be cancelled', 400, ErrorCode.VALIDATION_ERROR);
    }

    await this.bookingRepository.updateStatus(bookingId, 'cancelled');
  }
}
