import { v4 as uuidv4 } from 'uuid';

import { BookingRepository, SeatRepository } from './repository';
import { CreateBookingRequest } from './types';
import { db } from '../../shared/db';
import { AppError, UserErrorCode, UserErrorHelper, ServerErrorHelper } from '../../shared/error';

/**
 * Booking service interface
 */
export interface BookingService {
  createBooking(request: CreateBookingRequest, userId: string): Promise<{ booking_id: string; booking_code: string; total_price: number }>;
  findById(bookingId: string): Promise<any>;
  findByUserId(userId: string): Promise<any[]>;
  cancelBooking(bookingId: string, userId: string): Promise<void>;
  rescheduleBooking(bookingId: string, userId: string, newScheduleId: string, reason?: string): Promise<any>;
  requestRefund(bookingId: string, userId: string, reason: string, bankAccount: any): Promise<any>;
  getRefundStatus(refundId: string): Promise<any>;
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
    const { schedule_id, passengers, lock_id } = request;

    // Start transaction
    const trx = await db.transaction();

    try {
      // Get schedule
      const schedule = await trx('schedules').where({ schedule_id }).first<{ schedule_id: string; train_id: string; price: number } | null>();
      if (!schedule) {
        throw UserErrorHelper.notFound('Schedule', schedule_id);
      }

      // If lock_id is provided, validate it
      if (lock_id) {
        const locks = await trx('seat_locks')
          .where({ lock_id, status: 'active', user_id: userId, schedule_id })
          .andWhere('expires_at', '>', db.fn.now());
        
        if (locks.length === 0) {
          throw UserErrorHelper.businessRule(
            'Lock ID tidak valid atau sudah expired. Silakan lock kursi kembali',
            UserErrorCode.SEAT_LOCK_EXPIRED
          );
        }

        // Validate that all passengers with seat_id match the locks
        const lockedSeatIds = locks.map(l => String(l.seat_id));
        for (const p of passengers) {
          if (p.seat_id && !lockedSeatIds.includes(String(p.seat_id))) {
            throw UserErrorHelper.businessRule(
              `Kursi ${p.seat_id} tidak di-lock oleh Anda. Silakan lock kursi terlebih dahulu`,
              UserErrorCode.INVALID_LOCK_ID
            );
          }
        }
      }

      // Calculate total price
      const total_price = passengers.length * schedule.price;

      // Generate booking code
      const booking_code = 'WOOSH-' + uuidv4().slice(0, 8).toUpperCase();

      // Create booking
      const [booking_id] = await trx('bookings').insert({
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
          // Also filter out currently active locks
          const activeLocks = await trx('seat_locks')
            .where({ schedule_id, status: 'active' })
            .andWhere('expires_at', '>', db.fn.now());
          const lockedSeatIds = activeLocks.map(l => l.seat_id);
          
          const filteredSeats = availableSeats.filter(s => !lockedSeatIds.includes(Number(s.seat_id)));

          if (filteredSeats.length === 0) {
            throw UserErrorHelper.noSeatsAvailable();
          }
          final_seat_id = filteredSeats[0].seat_id;
        } else {
          // If not using lock_id, check if seat is available
          if (!lock_id) {
            const isBooked = await trx('booking_passengers')
              .join('bookings', 'booking_passengers.booking_id', 'bookings.booking_id')
              .where('bookings.schedule_id', schedule_id)
              .where('booking_passengers.seat_id', final_seat_id)
              .whereIn('bookings.status', ['paid', 'pending', 'completed'])
              .first();
            
            const isLocked = await trx('seat_locks')
              .where('seat_id', final_seat_id)
              .where('schedule_id', schedule_id)
              .where('status', 'active')
              .where('expires_at', '>', db.fn.now())
              .first();
            
            if (isBooked) {
              throw UserErrorHelper.seatAlreadyBooked(String(final_seat_id));
            }
            
            if (isLocked) {
              const lockInfo = await trx('seat_locks')
                .where('seat_id', final_seat_id)
                .where('schedule_id', schedule_id)
                .where('status', 'active')
                .where('expires_at', '>', db.fn.now())
                .first();
              throw UserErrorHelper.seatLocked(String(final_seat_id), lockInfo?.expires_at);
            }
          }
        }

        await trx('booking_passengers').insert({
          booking_id,
          full_name: p.full_name,
          id_number: p.id_number,
          seat_id: final_seat_id,
        });
      }

      // If success and lock_id exists, confirm locks
      if (lock_id) {
        await trx('seat_locks').where({ lock_id }).update({ status: 'confirmed' });
      }

      await trx.commit();

      return { booking_id: String(booking_id), booking_code, total_price };
    } catch (error) {
      await trx.rollback();
      
      // Re-throw AppError as-is
      if (error instanceof AppError) {
        throw error;
      }
      
      // Database errors are SERVER ERRORS
      if (error instanceof Error && 'code' in error) {
        throw ServerErrorHelper.databaseError('membuat booking', {
          operation: 'create_booking',
          error: (error as any).code,
        });
      }
      
      // Unknown errors are SERVER ERRORS
      throw ServerErrorHelper.internalError('membuat booking gagal', {
        operation: 'create_booking',
      });
    }
  }

  async findById(bookingId: string): Promise<any> {
    const booking = await this.bookingRepository.findByIdWithDetails(bookingId);
    if (!booking) {
      throw UserErrorHelper.notFound('Booking', bookingId);
    }
    return booking;
  }

  async findByUserId(userId: string): Promise<any[]> {
    const bookings = await this.bookingRepository.findByUserIdWithDetails(userId);
    // Return empty array if no bookings (not an error)
    return bookings;
  }

  async cancelBooking(bookingId: string, userId: string): Promise<void> {
    const booking = await this.bookingRepository.findById(bookingId);
    if (!booking || booking.user_id !== userId) {
      throw UserErrorHelper.notFound('Booking', bookingId);
    }
    
    if (booking.status === 'paid') {
      throw UserErrorHelper.cannotCancelPaidBooking();
    }
    
    if (booking.status === 'cancelled') {
      throw UserErrorHelper.businessRule(
        'Booking sudah dibatalkan sebelumnya',
        UserErrorCode.BOOKING_ALREADY_CANCELLED
      );
    }
    
    if (booking.status !== 'pending') {
      throw UserErrorHelper.businessRule(
        `Tidak dapat membatalkan booking: Status booking adalah "${booking.status}". Hanya booking dengan status "pending" yang dapat dibatalkan`,
        UserErrorCode.INVALID_STATE_TRANSITION
      );
    }

    try {
      await this.bookingRepository.updateStatus(bookingId, 'cancelled');
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw ServerErrorHelper.databaseError('membatalkan booking', {
          operation: 'cancel_booking',
          booking_id: bookingId,
        });
      }
      throw error;
    }
  }

  async rescheduleBooking(bookingId: string, userId: string, newScheduleId: string, reason?: string): Promise<any> {
    const booking = await this.bookingRepository.findById(bookingId);
    if (!booking || booking.user_id !== userId) {
      throw UserErrorHelper.notFound('Booking', bookingId);
    }
    
    if (booking.status !== 'paid') {
      throw UserErrorHelper.businessRule(
        `Tidak dapat reschedule booking: Status booking adalah "${booking.status}". Hanya booking dengan status "paid" yang dapat di-reschedule`,
        UserErrorCode.INVALID_STATE_TRANSITION
      );
    }

    const newSchedule = await db('schedules').where({ schedule_id: newScheduleId }).first();
    if (!newSchedule) {
      throw UserErrorHelper.notFound('Schedule', newScheduleId);
    }

    const priceDifference = Number(newSchedule.price) - Number(booking.price);
    const rescheduleFee = 25000;
    const totalPayment = priceDifference + rescheduleFee;

    try {
      await this.bookingRepository.createRescheduleHistory({
        booking_id: bookingId,
        old_schedule_id: booking.schedule_id,
        new_schedule_id: newScheduleId,
        price_difference: priceDifference,
        reschedule_fee: rescheduleFee,
        reason,
      });

      await this.bookingRepository.updateBookingSchedule(bookingId, newScheduleId);

      return {
        message: 'Booking rescheduled successfully',
        booking_id: bookingId,
        old_schedule_id: booking.schedule_id,
        new_schedule_id: newScheduleId,
        price_difference: priceDifference,
        reschedule_fee: rescheduleFee,
        total_payment: totalPayment,
      };
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw ServerErrorHelper.databaseError('reschedule booking', {
          operation: 'reschedule_booking',
          booking_id: bookingId,
        });
      }
      throw error;
    }
  }

  async requestRefund(bookingId: string, userId: string, reason: string, bankAccount: any): Promise<any> {
    const booking = await this.bookingRepository.findById(bookingId);
    if (!booking || booking.user_id !== userId) {
      throw UserErrorHelper.notFound('Booking', bookingId);
    }
    
    if (booking.status !== 'paid') {
      throw UserErrorHelper.cannotRefundUnpaidBooking();
    }

    // Calculate cancellation fee
    const departureTime = new Date(booking.departure_time);
    const now = new Date();
    const diffInHours = (departureTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    let feePercentage = 0.1; // > 7 days
    if (diffInHours < 24) feePercentage = 0.75;
    else if (diffInHours < 72) feePercentage = 0.5; // 1-3 days
    else if (diffInHours < 168) feePercentage = 0.25; // 3-7 days

    const originalAmount = Number(booking.total_price);
    const cancellationFee = originalAmount * feePercentage;
    const refundAmount = originalAmount - cancellationFee;

    try {
      const [refund_id] = await this.bookingRepository.createRefund({
        booking_id: bookingId,
        user_id: userId,
        original_amount: originalAmount,
        cancellation_fee: cancellationFee,
        refund_amount: refundAmount,
        reason,
        bank_account: JSON.stringify(bankAccount),
        status: 'pending',
      });

      await this.bookingRepository.updateStatus(bookingId, 'cancelled');

      return {
        message: 'Refund request submitted successfully',
        refund_id,
        booking_id: bookingId,
        refund_amount: refundAmount,
        cancellation_fee: cancellationFee,
        original_amount: originalAmount,
        status: 'pending',
      };
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw ServerErrorHelper.databaseError('request refund', {
          operation: 'request_refund',
          booking_id: bookingId,
        });
      }
      throw error;
    }
  }

  async getRefundStatus(refundId: string): Promise<any> {
    const refund = await this.bookingRepository.getRefundById(refundId);
    if (!refund) {
      throw UserErrorHelper.notFound('Refund request', refundId);
    }
    return refund;
  }
}
