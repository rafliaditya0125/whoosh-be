import { BookingServiceImpl } from '../src/domains/booking/bookingService';
import { BookingRepository, SeatRepository } from '../src/domains/booking/bookingRepository';
import { db } from '../src/shared/db';
import { AppError, UserErrorCode } from '../src/shared/error';

// Mock dependencies
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid'),
}));

jest.mock('../src/shared/db', () => {
  const mKnex = jest.fn().mockReturnValue({
    where: jest.fn().mockReturnThis(),
    first: jest.fn(),
  });
  (mKnex as any).transaction = jest.fn();
  return { db: mKnex };
});

describe('BookingService', () => {
  let bookingService: BookingServiceImpl;
  let mockBookingRepository: jest.Mocked<BookingRepository>;
  let mockSeatRepository: jest.Mocked<SeatRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockBookingRepository = {
      findById: jest.fn(),
      findByUserId: jest.fn(),
      create: jest.fn(),
      updateStatus: jest.fn(),
      addPassengers: jest.fn(),
      getPassengers: jest.fn(),
    } as any;
    mockSeatRepository = {
      getAvailableSeats: jest.fn(),
      findById: jest.fn(),
    } as any;
    bookingService = new BookingServiceImpl(mockBookingRepository, mockSeatRepository);
  });

  describe('createBooking', () => {
    const createRequest = {
      schedule_id: 'sched-1',
      passengers: [
        { full_name: 'Passenger 1', id_number: 'ID1', seat_id: 'seat-1' },
      ],
    };
    const userId = 'user-1';

    it('should create booking successfully', async () => {
      const mockSchedule = { schedule_id: 'sched-1', train_id: 'train-1', price: 100000 };
      const trxMock = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(mockSchedule),
      });
      (trxMock as any).commit = jest.fn();
      (trxMock as any).rollback = jest.fn();
      (db.transaction as jest.Mock).mockResolvedValue(trxMock);

      mockBookingRepository.create.mockResolvedValue(['booking-1']);
      mockBookingRepository.addPassengers.mockResolvedValue(undefined);

      const result = await bookingService.createBooking(createRequest, userId);

      expect(result).toEqual({
        booking_id: 'booking-1',
        booking_code: expect.stringContaining('WOOSH-'),
        total_price: 100000,
      });
      expect(trxMock).toHaveBeenCalled();
      expect(mockBookingRepository.create).toHaveBeenCalled();
      expect((trxMock as any).commit).toHaveBeenCalled();
    });

    it('should throw AppError if schedule not found', async () => {
      const trxMock = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(null),
      });
      (trxMock as any).commit = jest.fn();
      (trxMock as any).rollback = jest.fn();
      (db.transaction as jest.Mock).mockResolvedValue(trxMock);

      try {
        await bookingService.createBooking(createRequest, userId);
        fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect((error as AppError).statusCode).toBe(404);
        expect((error as AppError).code).toBe(UserErrorCode.NOT_FOUND);
        expect((trxMock as any).rollback).toHaveBeenCalled();
      }
    });

    // Extreme Scenario: requesting more passengers than physical capacity (simulated)
    it('should scale with many passengers (e.g. 100)', async () => {
      const mockSchedule = { schedule_id: 'sched-1', train_id: 'train-1', price: 1000 };
      const manyPassengers = Array.from({ length: 100 }, (_, i) => ({
        full_name: `User ${i}`,
        id_number: `ID${i}`,
        seat_id: `seat-${i}`
      }));

      const trxMock = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(mockSchedule),
      });
      (trxMock as any).commit = jest.fn();
      (trxMock as any).rollback = jest.fn();
      (db.transaction as jest.Mock).mockResolvedValue(trxMock);

      mockBookingRepository.create.mockResolvedValue(['booking-big']);
      
      const result = await bookingService.createBooking({ schedule_id: 'sched-1', passengers: manyPassengers }, userId);
      expect(result.total_price).toBe(100000);
      expect(mockBookingRepository.addPassengers).toHaveBeenCalledTimes(100);
    });

    // Extreme Scenario: Automatic seat selection when seat_id is missing
    it('should auto-assign seat if missing from request', async () => {
        const mockSchedule = { schedule_id: 'sched-1', train_id: 'train-1', price: 100000 };
        const trxMock = jest.fn().mockReturnValue({
          where: jest.fn().mockReturnThis(),
          first: jest.fn().mockResolvedValue(mockSchedule),
        });
        (trxMock as any).commit = jest.fn();
        (db.transaction as jest.Mock).mockResolvedValue(trxMock);
  
        mockBookingRepository.create.mockResolvedValue(['booking-1']);
        mockSeatRepository.getAvailableSeats.mockResolvedValue([{ seat_id: 'auto-seat-1' } as any]);
  
        const result = await bookingService.createBooking({
            schedule_id: 'sched-1',
            passengers: [{ full_name: 'P1', id_number: 'ID1' }] // missing seat_id
        }, userId);
  
        expect(result.booking_id).toBe('booking-1');
        expect(mockBookingRepository.addPassengers).toHaveBeenCalledWith([{
            booking_id: 'booking-1',
            full_name: 'P1',
            id_number: 'ID1',
            seat_id: 'auto-seat-1'
        }]);
    });

    it('should throw error if auto-assign fails (no seats left)', async () => {
        const mockSchedule = { schedule_id: 'sched-1', train_id: 'train-1', price: 100000 };
        const trxMock = jest.fn().mockReturnValue({
          where: jest.fn().mockReturnThis(),
          first: jest.fn().mockResolvedValue(mockSchedule),
        });
        (trxMock as any).rollback = jest.fn();
        (db.transaction as jest.Mock).mockResolvedValue(trxMock);
  
        mockBookingRepository.create.mockResolvedValue(['booking-1']);
        mockSeatRepository.getAvailableSeats.mockResolvedValue([]); // Empty
  
        try {
          await bookingService.createBooking({
              schedule_id: 'sched-1',
              passengers: [{ full_name: 'P1', id_number: 'ID1' }]
          }, userId);
          fail('Should have thrown error');
        } catch (error) {
          expect(error).toBeInstanceOf(AppError);
          expect((error as AppError).statusCode).toBe(422);
          expect((error as AppError).code).toBe(UserErrorCode.NO_SEATS_AVAILABLE);
        }
    });
  });

  describe('cancelBooking', () => {
    it('should cancel booking if status is pending', async () => {
      const mockBooking = {
        booking_id: 'booking-1',
        user_id: 'user-1',
        status: 'pending',
      };
      mockBookingRepository.findById.mockResolvedValue(mockBooking as any);
      mockBookingRepository.updateStatus.mockResolvedValue(undefined);

      await bookingService.cancelBooking('booking-1', 'user-1');

      expect(mockBookingRepository.updateStatus).toHaveBeenCalledWith('booking-1', 'cancelled');
    });

    it('should throw AppError if booking not found', async () => {
      mockBookingRepository.findById.mockResolvedValue(null);

      try {
        await bookingService.cancelBooking('booking-1', 'user-1');
        fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect((error as AppError).statusCode).toBe(404);
        expect((error as AppError).code).toBe(UserErrorCode.NOT_FOUND);
      }
    });

    it('should throw AppError if status is not pending', async () => {
      const mockBooking = {
        booking_id: 'booking-1',
        user_id: 'user-1',
        status: 'paid',
      };
      mockBookingRepository.findById.mockResolvedValue(mockBooking as any);

      try {
        await bookingService.cancelBooking('booking-1', 'user-1');
        fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect((error as AppError).statusCode).toBe(422);
        expect((error as AppError).code).toBe(UserErrorCode.CANNOT_CANCEL_PAID_BOOKING);
      }
    });
  });
});
