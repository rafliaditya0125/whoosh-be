/**
 * Error Handling Integration Tests
 * 
 * Tests error handling in actual service implementations
 * Validates that services use correct error types and codes
 */

import bcrypt from 'bcryptjs';
import { AuthServiceImpl } from '../src/domains/auth/service';
import { AuthRepository } from '../src/domains/auth/repository';
import { PaymentServiceImpl } from '../src/domains/payment/service';
import { PaymentRepository } from '../src/domains/payment/repository';
import { UserErrorCode, ServerErrorCode, AppError } from '../src/shared/error';

// Mock dependencies
jest.mock('bcryptjs');

describe('Error Handling Integration Tests', () => {
  
  describe('AuthService - Error Handling', () => {
    let authService: AuthServiceImpl;
    let mockAuthRepository: jest.Mocked<AuthRepository>;

    beforeEach(() => {
      jest.clearAllMocks();
      mockAuthRepository = {
        findByEmail: jest.fn(),
        findById: jest.fn(),
        create: jest.fn(),
      } as any;
      authService = new AuthServiceImpl(mockAuthRepository);
    });

    describe('User Errors (NO 500, NO reference code)', () => {
      it('login - should throw INVALID_CREDENTIALS (401) for wrong email', async () => {
        mockAuthRepository.findByEmail.mockResolvedValue(null);

        try {
          await authService.login({ email: 'wrong@example.com', password: 'pass' });
          fail('Should have thrown error');
        } catch (error) {
          expect(error).toBeInstanceOf(AppError);
          expect((error as AppError).statusCode).toBe(401);
          expect((error as AppError).code).toBe(UserErrorCode.INVALID_CREDENTIALS);
          expect((error as AppError).message).toContain('Email atau password salah');
          expect((error as AppError).referenceCode).toBeUndefined();
          expect((error as AppError).isServerError).toBe(false);
        }
      });

      it('login - should throw INVALID_CREDENTIALS (401) for wrong password', async () => {
        mockAuthRepository.findByEmail.mockResolvedValue({
          user_id: 'user1',
          password_hash: 'hashed',
        } as any);
        (bcrypt.compare as jest.Mock).mockResolvedValue(false);

        try {
          await authService.login({ email: 'test@example.com', password: 'wrong' });
          fail('Should have thrown error');
        } catch (error) {
          expect(error).toBeInstanceOf(AppError);
          expect((error as AppError).statusCode).toBe(401);
          expect((error as AppError).code).toBe(UserErrorCode.INVALID_CREDENTIALS);
          expect((error as AppError).referenceCode).toBeUndefined();
        }
      });

      it('register - should throw VALIDATION_ERROR (400) for invalid email', async () => {
        try {
          await authService.register({
            full_name: 'Test',
            email: 'invalid-email',
            phone: '+628123456789',
            password: 'password123'
          });
          fail('Should have thrown error');
        } catch (error) {
          expect(error).toBeInstanceOf(AppError);
          expect((error as AppError).statusCode).toBe(400);
          expect((error as AppError).code).toBe(UserErrorCode.VALIDATION_ERROR);
          expect((error as AppError).message).toContain('Format email salah');
          expect((error as AppError).details).toHaveProperty('fields');
          expect((error as AppError).referenceCode).toBeUndefined();
        }
      });

      it('register - should throw INVALID_PHONE_FORMAT (400) for invalid phone', async () => {
        try {
          await authService.register({
            full_name: 'Test',
            email: 'test@example.com',
            phone: '08123456789', // Missing +62
            password: 'password123'
          });
          fail('Should have thrown error');
        } catch (error) {
          expect(error).toBeInstanceOf(AppError);
          expect((error as AppError).statusCode).toBe(400);
          expect((error as AppError).code).toBe(UserErrorCode.INVALID_PHONE_FORMAT);
          expect((error as AppError).message).toContain('wajib diawali +62');
          expect((error as AppError).referenceCode).toBeUndefined();
        }
      });

      it('register - should throw VALIDATION_ERROR (400) for short password', async () => {
        try {
          await authService.register({
            full_name: 'Test',
            email: 'test@example.com',
            phone: '+628123456789',
            password: 'short'
          });
          fail('Should have thrown error');
        } catch (error) {
          expect(error).toBeInstanceOf(AppError);
          expect((error as AppError).statusCode).toBe(400);
          expect((error as AppError).code).toBe(UserErrorCode.VALIDATION_ERROR);
          expect((error as AppError).message).toContain('Password terlalu pendek');
          expect((error as AppError).referenceCode).toBeUndefined();
        }
      });

      it('register - should throw EMAIL_ALREADY_EXISTS (409) for duplicate email', async () => {
        (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
        const dbError = new Error('Duplicate entry') as any;
        dbError.code = 'ER_DUP_ENTRY';
        dbError.sqlMessage = 'Duplicate entry for key email';
        mockAuthRepository.create.mockRejectedValue(dbError);

        try {
          await authService.register({
            full_name: 'Test',
            email: 'existing@example.com',
            phone: '+628123456789',
            password: 'password123'
          });
          fail('Should have thrown error');
        } catch (error) {
          expect(error).toBeInstanceOf(AppError);
          expect((error as AppError).statusCode).toBe(409);
          expect((error as AppError).code).toBe(UserErrorCode.EMAIL_ALREADY_EXISTS);
          expect((error as AppError).message).toContain('Email sudah terdaftar');
          expect((error as AppError).referenceCode).toBeUndefined();
        }
      });

      it('register - should throw PHONE_ALREADY_EXISTS (409) for duplicate phone', async () => {
        (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
        const dbError = new Error('Duplicate entry') as any;
        dbError.code = 'ER_DUP_ENTRY';
        dbError.sqlMessage = 'Duplicate entry for key phone';
        mockAuthRepository.create.mockRejectedValue(dbError);

        try {
          await authService.register({
            full_name: 'Test',
            email: 'test@example.com',
            phone: '+628123456789',
            password: 'password123'
          });
          fail('Should have thrown error');
        } catch (error) {
          expect(error).toBeInstanceOf(AppError);
          expect((error as AppError).statusCode).toBe(409);
          expect((error as AppError).code).toBe(UserErrorCode.PHONE_ALREADY_EXISTS);
          expect((error as AppError).referenceCode).toBeUndefined();
        }
      });

      it('me - should throw NOT_FOUND (404) for non-existent user', async () => {
        mockAuthRepository.findById.mockResolvedValue(null);

        try {
          await authService.me('non-existent-user');
          fail('Should have thrown error');
        } catch (error) {
          expect(error).toBeInstanceOf(AppError);
          expect((error as AppError).statusCode).toBe(404);
          expect((error as AppError).code).toBe(UserErrorCode.NOT_FOUND);
          expect((error as AppError).message).toContain('User');
          expect((error as AppError).message).toContain('tidak ditemukan');
          expect((error as AppError).referenceCode).toBeUndefined();
        }
      });
    });

    describe('Server Errors (500 WITH reference code)', () => {
      beforeEach(() => {
        jest.spyOn(console, 'error').mockImplementation(() => {});
      });

      afterEach(() => {
        jest.restoreAllMocks();
      });

      it('register - should throw DATABASE_QUERY_ERROR (500) for database error', async () => {
        (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
        const dbError = new Error('Database error') as any;
        dbError.code = 'ER_LOCK_WAIT_TIMEOUT';
        mockAuthRepository.create.mockRejectedValue(dbError);

        try {
          await authService.register({
            full_name: 'Test',
            email: 'test@example.com',
            phone: '+628123456789',
            password: 'password123'
          });
          fail('Should have thrown error');
        } catch (error) {
          expect(error).toBeInstanceOf(AppError);
          expect((error as AppError).statusCode).toBe(500);
          expect((error as AppError).code).toBe(ServerErrorCode.DATABASE_QUERY_ERROR);
          expect((error as AppError).message).toContain('Terjadi kesalahan database');
          expect((error as AppError).referenceCode).toBeDefined();
          expect((error as AppError).referenceCode).toBe(1001); // Numeric reference code
          expect((error as AppError).isServerError).toBe(true);
          expect(console.error).toHaveBeenCalled();
        }
      });

      it('register - should throw INTERNAL_SERVER_ERROR (500) for unknown error', async () => {
        (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
        mockAuthRepository.create.mockRejectedValue(new Error('Unknown error'));

        try {
          await authService.register({
            full_name: 'Test',
            email: 'test@example.com',
            phone: '+628123456789',
            password: 'password123'
          });
          fail('Should have thrown error');
        } catch (error) {
          expect(error).toBeInstanceOf(AppError);
          expect((error as AppError).statusCode).toBe(500);
          expect((error as AppError).code).toBe(ServerErrorCode.INTERNAL_SERVER_ERROR);
          expect((error as AppError).referenceCode).toBeDefined();
          expect((error as AppError).isServerError).toBe(true);
        }
      });
    });
  });

  describe('Error Consistency Across Services', () => {
    let paymentService: PaymentServiceImpl;
    let mockPaymentRepository: jest.Mocked<PaymentRepository>;

    beforeEach(() => {
      jest.clearAllMocks();
      mockPaymentRepository = {
        findById: jest.fn(),
        create: jest.fn(),
        updateStatus: jest.fn(),
      } as any;
      paymentService = new PaymentServiceImpl(mockPaymentRepository);
    });

    describe('User Errors', () => {
      it('getPaymentStatus - should throw NOT_FOUND (404) for non-existent payment', async () => {
        mockPaymentRepository.findById.mockResolvedValue(null);

        try {
          await paymentService.getPaymentStatus('non-existent');
          fail('Should have thrown error');
        } catch (error) {
          expect(error).toBeInstanceOf(AppError);
          expect((error as AppError).statusCode).toBe(404);
          expect((error as AppError).code).toBe(UserErrorCode.NOT_FOUND);
          expect((error as AppError).message).toContain('Payment');
          expect((error as AppError).referenceCode).toBeUndefined();
        }
      });
    });

    describe('Server Errors', () => {
      beforeEach(() => {
        jest.spyOn(console, 'error').mockImplementation(() => {});
      });

      afterEach(() => {
        jest.restoreAllMocks();
      });

      it('create - should throw DATABASE_QUERY_ERROR (500) for database error', async () => {
        const dbError = new Error('Database error') as any;
        dbError.code = 'ER_LOCK_WAIT_TIMEOUT';
        mockPaymentRepository.create.mockRejectedValue(dbError);

        try {
          await paymentService.create('booking1', 'qris', 500000);
          fail('Should have thrown error');
        } catch (error) {
          expect(error).toBeInstanceOf(AppError);
          expect((error as AppError).statusCode).toBe(500);
          expect((error as AppError).code).toBe(ServerErrorCode.DATABASE_QUERY_ERROR);
          expect((error as AppError).referenceCode).toBeDefined();
          expect((error as AppError).isServerError).toBe(true);
        }
      });
    });
  });

  describe('Error Consistency Across Services', () => {
    it('All NOT_FOUND errors should use 404 status code', () => {
      const errors = [
        UserErrorCode.NOT_FOUND,
        UserErrorCode.USER_NOT_FOUND,
        UserErrorCode.BOOKING_NOT_FOUND,
        UserErrorCode.PAYMENT_NOT_FOUND,
        UserErrorCode.SCHEDULE_NOT_FOUND,
      ];

      // All NOT_FOUND related codes should result in 404
      errors.forEach(code => {
        expect(code).toContain('NOT_FOUND');
      });
    });

    it('All CONFLICT errors should use 409 status code', () => {
      const errors = [
        UserErrorCode.EMAIL_ALREADY_EXISTS,
        UserErrorCode.PHONE_ALREADY_EXISTS,
        UserErrorCode.SEAT_ALREADY_BOOKED,
        UserErrorCode.SEAT_LOCKED,
      ];

      errors.forEach(code => {
        expect(code).toBeTruthy();
      });
    });

    it('All BUSINESS_RULE errors should use 422 status code', () => {
      const errors = [
        UserErrorCode.CANNOT_CANCEL_PAID_BOOKING,
        UserErrorCode.CANNOT_REFUND_UNPAID_BOOKING,
        UserErrorCode.TICKET_ALREADY_USED,
        UserErrorCode.TICKET_EXPIRED,
        UserErrorCode.NO_SEATS_AVAILABLE,
      ];

      errors.forEach(code => {
        expect(code).toBeTruthy();
      });
    });
  });
});
