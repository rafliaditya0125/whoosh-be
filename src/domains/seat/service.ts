import { v4 as uuidv4 } from 'uuid';

import { SeatRepository } from './repository';
import { LockSeatRequest, LockSeatResponse, AvailableSeatResponse, Seat } from './types';
import { UserErrorHelper, UserErrorCode, ServerErrorHelper } from '../../shared/error';

/**
 * Seat service interface
 */
export interface SeatService {
  lockSeats(request: LockSeatRequest, userId: string): Promise<LockSeatResponse>;
  unlockSeats(lockId: string): Promise<void>;
  getAvailableSeats(scheduleId: string, className?: string): Promise<AvailableSeatResponse[]>;
  autoReleaseLocks(): Promise<number>;
  getByTrain(trainId: string): Promise<Seat[]>;
  getByClass(trainId: string, className: string): Promise<Seat[]>;
  create(data: Partial<Seat>): Promise<string[]>;
  delete(id: string): Promise<void>;
}

/**
 * Seat service implementation
 */
export class SeatServiceImpl implements SeatService {
  constructor(private seatRepository: SeatRepository) {}

  async getByTrain(trainId: string): Promise<Seat[]> {
    return this.seatRepository.findByTrainId(trainId);
  }

  async getByClass(trainId: string, className: string): Promise<Seat[]> {
    return this.seatRepository.findByClass(trainId, className);
  }

  async create(data: Partial<Seat>): Promise<string[]> {
    try {
      return this.seatRepository.create(data);
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw ServerErrorHelper.databaseError('membuat seat', {
          operation: 'create_seat',
        });
      }
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.seatRepository.delete(id);
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw ServerErrorHelper.databaseError('menghapus seat', {
          operation: 'delete_seat',
          seat_id: id,
        });
      }
      throw error;
    }
  }

  async lockSeats(request: LockSeatRequest, userId: string): Promise<LockSeatResponse> {
    const { schedule_id, seat_ids, lock_duration = 600 } = request;

    // Validate availability for all seats
    const unavailableSeats = [];
    for (const seatId of seat_ids) {
      const isAvailable = await this.seatRepository.isSeatAvailable(seatId, schedule_id);
      if (!isAvailable) {
        unavailableSeats.push(seatId);
      }
    }

    if (unavailableSeats.length > 0) {
      throw UserErrorHelper.businessRule(
        `Beberapa kursi tidak tersedia: ${unavailableSeats.join(', ')}. Kursi sudah di-lock atau dibooking oleh user lain. Silakan pilih kursi lain`,
        UserErrorCode.SEAT_ALREADY_BOOKED
      );
    }

    const lockId = 'lock_' + uuidv4().slice(0, 8);
    const expiresAt = new Date(Date.now() + lock_duration * 1000);

    const locks = seat_ids.map(seatId => ({
      lock_id: lockId,
      seat_id: seatId,
      schedule_id: schedule_id,
      user_id: userId,
      expires_at: expiresAt.toISOString().replace('T', ' ').slice(0, 19),
      status: 'active' as const,
    }));

    try {
      await this.seatRepository.createLock(locks);

      return {
        message: 'Seats locked successfully',
        lock_id: lockId,
        locked_seats: seat_ids,
        expires_at: expiresAt.toISOString(),
      };
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw ServerErrorHelper.databaseError('lock kursi', {
          operation: 'lock_seats',
          seat_ids,
        });
      }
      throw error;
    }
  }

  async unlockSeats(lockId: string): Promise<void> {
    try {
      await this.seatRepository.updateLockStatus(lockId, 'released');
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw ServerErrorHelper.databaseError('unlock kursi', {
          operation: 'unlock_seats',
          lock_id: lockId,
        });
      }
      throw error;
    }
  }

  async getAvailableSeats(scheduleId: string, className?: string): Promise<AvailableSeatResponse[]> {
    return this.seatRepository.getAvailableSeats(scheduleId, className);
  }

  async autoReleaseLocks(): Promise<number> {
    return this.seatRepository.releaseExpiredLocks();
  }
}
