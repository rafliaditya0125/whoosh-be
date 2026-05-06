/**
 * Error Handling Tests
 * 
 * Tests for User Error vs Server Error distinction
 * Validates error codes, status codes, messages, and reference codes
 */

import { 
  AppError, 
  UserErrorCode, 
  ServerErrorCode,
  UserErrorHelper, 
  ServerErrorHelper 
} from '../src/shared/error';

describe('Error Handling System', () => {
  
  describe('UserErrorHelper - User Errors (NO 500, NO reference code)', () => {
    
    describe('notFound (404)', () => {
      it('should create 404 error with specific message', () => {
        const error = UserErrorHelper.notFound('Booking', 'booking123');
        
        expect(error).toBeInstanceOf(AppError);
        expect(error.statusCode).toBe(404);
        expect(error.code).toBe(UserErrorCode.NOT_FOUND);
        expect(error.message).toContain('Booking');
        expect(error.message).toContain('booking123');
        expect(error.message).toContain('tidak ditemukan');
        expect(error.referenceCode).toBeUndefined(); // NO reference code for user errors
        expect(error.isServerError).toBe(false);
      });

      it('should create 404 error without identifier', () => {
        const error = UserErrorHelper.notFound('User');
        
        expect(error.statusCode).toBe(404);
        expect(error.message).toContain('User');
        expect(error.message).toContain('tidak ditemukan');
        expect(error.referenceCode).toBeUndefined();
      });
    });

    describe('unauthorized (401)', () => {
      it('should create 401 error with default message', () => {
        const error = UserErrorHelper.unauthorized();
        
        expect(error.statusCode).toBe(401);
        expect(error.code).toBe(UserErrorCode.UNAUTHORIZED);
        expect(error.message).toContain('Unauthorized');
        expect(error.message).toContain('login');
        expect(error.referenceCode).toBeUndefined();
      });

      it('should create 401 error with custom reason', () => {
        const error = UserErrorHelper.unauthorized('Token expired');
        
        expect(error.statusCode).toBe(401);
        expect(error.message).toContain('Token expired');
        expect(error.referenceCode).toBeUndefined();
      });
    });

    describe('forbidden (403)', () => {
      it('should create 403 error with default message', () => {
        const error = UserErrorHelper.forbidden();
        
        expect(error.statusCode).toBe(403);
        expect(error.code).toBe(UserErrorCode.FORBIDDEN);
        expect(error.message).toContain('permission');
        expect(error.referenceCode).toBeUndefined();
      });

      it('should create 403 error with custom reason', () => {
        const error = UserErrorHelper.forbidden('Admin only');
        
        expect(error.statusCode).toBe(403);
        expect(error.message).toContain('Admin only');
        expect(error.referenceCode).toBeUndefined();
      });
    });

    describe('validation (400)', () => {
      it('should create 400 error with message only', () => {
        const error = UserErrorHelper.validation('Invalid email format');
        
        expect(error.statusCode).toBe(400);
        expect(error.code).toBe(UserErrorCode.VALIDATION_ERROR);
        expect(error.message).toBe('Invalid email format');
        expect(error.details).toBeUndefined();
        expect(error.referenceCode).toBeUndefined();
      });

      it('should create 400 error with field-level details', () => {
        const error = UserErrorHelper.validation('Validation failed', {
          email: 'Format salah',
          password: 'Minimal 8 karakter'
        });
        
        expect(error.statusCode).toBe(400);
        expect(error.details).toEqual({
          fields: {
            email: 'Format salah',
            password: 'Minimal 8 karakter'
          }
        });
        expect(error.referenceCode).toBeUndefined();
      });
    });

    describe('conflict (409)', () => {
      it('should create 409 error with default code', () => {
        const error = UserErrorHelper.conflict('Resource already exists');
        
        expect(error.statusCode).toBe(409);
        expect(error.code).toBe(UserErrorCode.RESOURCE_CONFLICT);
        expect(error.message).toBe('Resource already exists');
        expect(error.referenceCode).toBeUndefined();
      });

      it('should create 409 error with custom code', () => {
        const error = UserErrorHelper.conflict(
          'Email already exists', 
          UserErrorCode.EMAIL_ALREADY_EXISTS
        );
        
        expect(error.statusCode).toBe(409);
        expect(error.code).toBe(UserErrorCode.EMAIL_ALREADY_EXISTS);
        expect(error.referenceCode).toBeUndefined();
      });
    });

    describe('businessRule (422)', () => {
      it('should create 422 error with default code', () => {
        const error = UserErrorHelper.businessRule('Cannot perform this action');
        
        expect(error.statusCode).toBe(422);
        expect(error.code).toBe(UserErrorCode.BUSINESS_RULE_VIOLATION);
        expect(error.message).toBe('Cannot perform this action');
        expect(error.referenceCode).toBeUndefined();
      });

      it('should create 422 error with custom code', () => {
        const error = UserErrorHelper.businessRule(
          'Booking already paid',
          UserErrorCode.BOOKING_ALREADY_PAID
        );
        
        expect(error.statusCode).toBe(422);
        expect(error.code).toBe(UserErrorCode.BOOKING_ALREADY_PAID);
        expect(error.referenceCode).toBeUndefined();
      });
    });

    describe('Specific User Error Helpers', () => {
      it('invalidCredentials - should create 401 error', () => {
        const error = UserErrorHelper.invalidCredentials();
        
        expect(error.statusCode).toBe(401);
        expect(error.code).toBe(UserErrorCode.INVALID_CREDENTIALS);
        expect(error.message).toContain('Email atau password salah');
        expect(error.referenceCode).toBeUndefined();
      });

      it('emailExists - should create 409 error', () => {
        const error = UserErrorHelper.emailExists();
        
        expect(error.statusCode).toBe(409);
        expect(error.code).toBe(UserErrorCode.EMAIL_ALREADY_EXISTS);
        expect(error.message).toContain('Email sudah terdaftar');
        expect(error.referenceCode).toBeUndefined();
      });

      it('phoneExists - should create 409 error', () => {
        const error = UserErrorHelper.phoneExists();
        
        expect(error.statusCode).toBe(409);
        expect(error.code).toBe(UserErrorCode.PHONE_ALREADY_EXISTS);
        expect(error.message).toContain('Nomor telepon sudah terdaftar');
        expect(error.referenceCode).toBeUndefined();
      });

      it('invalidPhoneFormat - should create 400 error with field details', () => {
        const error = UserErrorHelper.invalidPhoneFormat();
        
        expect(error.statusCode).toBe(400);
        expect(error.code).toBe(UserErrorCode.INVALID_PHONE_FORMAT);
        expect(error.message).toContain('wajib diawali +62');
        expect(error.details).toEqual({
          fields: {
            phone: 'Format salah, wajib diawali +62'
          }
        });
        expect(error.referenceCode).toBeUndefined();
      });

      it('seatAlreadyBooked - should create 409 error', () => {
        const error = UserErrorHelper.seatAlreadyBooked('A1');
        
        expect(error.statusCode).toBe(409);
        expect(error.code).toBe(UserErrorCode.SEAT_ALREADY_BOOKED);
        expect(error.message).toContain('Kursi A1');
        expect(error.message).toContain('sudah dibooking');
        expect(error.referenceCode).toBeUndefined();
      });

      it('seatLocked - should create 409 error with expiry time', () => {
        const expiresAt = new Date('2026-05-06T14:00:00Z');
        const error = UserErrorHelper.seatLocked('A1', expiresAt);
        
        expect(error.statusCode).toBe(409);
        expect(error.code).toBe(UserErrorCode.SEAT_LOCKED);
        expect(error.message).toContain('Kursi A1');
        expect(error.message).toContain('di-lock');
        expect(error.message).toContain(expiresAt.toISOString());
        expect(error.referenceCode).toBeUndefined();
      });

      it('noSeatsAvailable - should create 422 error', () => {
        const error = UserErrorHelper.noSeatsAvailable();
        
        expect(error.statusCode).toBe(422);
        expect(error.code).toBe(UserErrorCode.NO_SEATS_AVAILABLE);
        expect(error.message).toContain('Tidak ada kursi tersedia');
        expect(error.referenceCode).toBeUndefined();
      });

      it('cannotCancelPaidBooking - should create 422 error', () => {
        const error = UserErrorHelper.cannotCancelPaidBooking();
        
        expect(error.statusCode).toBe(422);
        expect(error.code).toBe(UserErrorCode.CANNOT_CANCEL_PAID_BOOKING);
        expect(error.message).toContain('Tidak dapat membatalkan booking');
        expect(error.message).toContain('paid');
        expect(error.message).toContain('pending');
        expect(error.referenceCode).toBeUndefined();
      });

      it('cannotRefundUnpaidBooking - should create 422 error', () => {
        const error = UserErrorHelper.cannotRefundUnpaidBooking();
        
        expect(error.statusCode).toBe(422);
        expect(error.code).toBe(UserErrorCode.CANNOT_REFUND_UNPAID_BOOKING);
        expect(error.message).toContain('Tidak dapat refund');
        expect(error.message).toContain('belum dibayar');
        expect(error.referenceCode).toBeUndefined();
      });

      it('ticketAlreadyUsed - should create 422 error', () => {
        const error = UserErrorHelper.ticketAlreadyUsed();
        
        expect(error.statusCode).toBe(422);
        expect(error.code).toBe(UserErrorCode.TICKET_ALREADY_USED);
        expect(error.message).toContain('Tiket sudah digunakan');
        expect(error.referenceCode).toBeUndefined();
      });

      it('ticketExpired - should create 422 error', () => {
        const error = UserErrorHelper.ticketExpired();
        
        expect(error.statusCode).toBe(422);
        expect(error.code).toBe(UserErrorCode.TICKET_EXPIRED);
        expect(error.message).toContain('Tiket sudah expired');
        expect(error.referenceCode).toBeUndefined();
      });

      it('invalidQRCode - should create 400 error', () => {
        const error = UserErrorHelper.invalidQRCode('QR code expired');
        
        expect(error.statusCode).toBe(400);
        expect(error.code).toBe(UserErrorCode.INVALID_QR_CODE);
        expect(error.message).toContain('QR code tidak valid');
        expect(error.message).toContain('QR code expired');
        expect(error.referenceCode).toBeUndefined();
      });
    });

    describe('User Error - NEVER uses 500', () => {
      it('should NEVER have status code 500', () => {
        const userErrors = [
          UserErrorHelper.notFound('Resource'),
          UserErrorHelper.unauthorized(),
          UserErrorHelper.forbidden(),
          UserErrorHelper.validation('Invalid'),
          UserErrorHelper.conflict('Conflict'),
          UserErrorHelper.businessRule('Business rule'),
          UserErrorHelper.invalidCredentials(),
          UserErrorHelper.emailExists(),
          UserErrorHelper.phoneExists(),
          UserErrorHelper.seatAlreadyBooked(),
          UserErrorHelper.noSeatsAvailable(),
          UserErrorHelper.cannotCancelPaidBooking(),
          UserErrorHelper.ticketAlreadyUsed(),
        ];

        userErrors.forEach(error => {
          expect(error.statusCode).not.toBe(500);
          expect(error.referenceCode).toBeUndefined();
          expect(error.isServerError).toBe(false);
        });
      });
    });
  });

  describe('ServerErrorHelper - Server Errors (CAN use 500, WITH reference code)', () => {
    
    // Mock console.error to avoid cluttering test output
    beforeEach(() => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    describe('databaseError (500)', () => {
      it('should create 500 error with reference code', () => {
        const error = ServerErrorHelper.databaseError('registrasi user', {
          operation: 'create_user',
          error: 'ER_DUP_ENTRY'
        });
        
        expect(error).toBeInstanceOf(AppError);
        expect(error.statusCode).toBe(500);
        expect(error.code).toBe(ServerErrorCode.DATABASE_QUERY_ERROR);
        expect(error.message).toContain('Terjadi kesalahan database');
        expect(error.message).toContain('registrasi user');
        expect(error.message).toContain('reference code');
        expect(error.referenceCode).toBeDefined();
        expect(error.referenceCode).toBe(1001); // Numeric reference code
        expect(error.isServerError).toBe(true);
        expect(error.details).toEqual({
          operation: 'create_user',
          error: 'ER_DUP_ENTRY'
        });
      });

      it('should auto-log error with reference code', () => {
        const error = ServerErrorHelper.databaseError('test operation');
        
        expect(console.error).toHaveBeenCalled();
        expect(console.error).toHaveBeenCalledWith(
          expect.stringContaining('SERVER ERROR - Reference Code:')
        );
        expect(console.error).toHaveBeenCalledWith(
          expect.stringContaining(String(error.referenceCode!))
        );
      });
    });

    describe('databaseConnectionError (500)', () => {
      it('should create 500 error with reference code', () => {
        const error = ServerErrorHelper.databaseConnectionError();
        
        expect(error.statusCode).toBe(500);
        expect(error.code).toBe(ServerErrorCode.DATABASE_CONNECTION_ERROR);
        expect(error.message).toContain('Tidak dapat terhubung ke database');
        expect(error.referenceCode).toBeDefined();
        expect(error.referenceCode).toBe(1000); // Numeric reference code
        expect(error.isServerError).toBe(true);
      });
    });

    describe('paymentGatewayError (500)', () => {
      it('should create 500 error with gateway name and reference code', () => {
        const error = ServerErrorHelper.paymentGatewayError('Midtrans', {
          error: 'Connection timeout',
          amount: 500000
        });
        
        expect(error.statusCode).toBe(500);
        expect(error.code).toBe(ServerErrorCode.PAYMENT_GATEWAY_ERROR);
        expect(error.message).toContain('payment gateway Midtrans');
        expect(error.referenceCode).toBeDefined();
        expect(error.details).toEqual({
          error: 'Connection timeout',
          amount: 500000
        });
        expect(error.isServerError).toBe(true);
      });
    });

    describe('externalServiceError (500)', () => {
      it('should create 500 error with service name and reference code', () => {
        const error = ServerErrorHelper.externalServiceError('Email Service', {
          service: 'SendGrid',
          error: 'API rate limit exceeded'
        });
        
        expect(error.statusCode).toBe(500);
        expect(error.code).toBe(ServerErrorCode.EXTERNAL_SERVICE_ERROR);
        expect(error.message).toContain('layanan eksternal Email Service');
        expect(error.referenceCode).toBeDefined();
        expect(error.isServerError).toBe(true);
      });
    });

    describe('configurationError (500)', () => {
      it('should create 500 error with config name and reference code', () => {
        const error = ServerErrorHelper.configurationError('JWT_SECRET');
        
        expect(error.statusCode).toBe(500);
        expect(error.code).toBe(ServerErrorCode.CONFIGURATION_ERROR);
        expect(error.message).toContain('Konfigurasi server salah');
        expect(error.message).toContain('JWT_SECRET');
        expect(error.referenceCode).toBeDefined();
        expect(error.details).toEqual({
          config: 'JWT_SECRET'
        });
        expect(error.isServerError).toBe(true);
      });
    });

    describe('internalError (500)', () => {
      it('should create 500 error with custom message and reference code', () => {
        const error = ServerErrorHelper.internalError('unexpected error', {
          stack: 'Error stack trace'
        });
        
        expect(error.statusCode).toBe(500);
        expect(error.code).toBe(ServerErrorCode.INTERNAL_SERVER_ERROR);
        expect(error.message).toContain('Terjadi kesalahan internal');
        expect(error.message).toContain('unexpected error');
        expect(error.referenceCode).toBeDefined();
        expect(error.isServerError).toBe(true);
      });
    });

    describe('Reference Code Format', () => {
      it('should generate same reference codes for same error type', () => {
        const error1 = ServerErrorHelper.databaseError('op1');
        const error2 = ServerErrorHelper.databaseError('op2');
        
        // Same error type = same reference code (1001 for database errors)
        expect(error1.referenceCode).toBe(error2.referenceCode);
        expect(error1.referenceCode).toBe(1001);
      });

      it('should use numeric reference codes', () => {
        const error = ServerErrorHelper.databaseError('test');
        const refCode = error.referenceCode!;
        
        // Reference code should be a number
        expect(typeof refCode).toBe('number');
        expect(refCode).toBe(1001); // DB_QUERY_FAILED
      });

      it('should use application-level numeric codes', () => {
        const dbError = ServerErrorHelper.databaseError('test');
        const connError = ServerErrorHelper.databaseConnectionError();
        const paymentError = ServerErrorHelper.paymentGatewayError('Midtrans');
        
        // Each error type has its own numeric code
        expect(dbError.referenceCode).toBe(1001); // DB_QUERY_FAILED
        expect(connError.referenceCode).toBe(1000); // DB_CONNECTION_FAILED
        expect(paymentError.referenceCode).toBe(1100); // PAYMENT_GATEWAY_FAILED
      });
    });

    describe('Server Error - ALWAYS has reference code', () => {
      it('should ALWAYS have reference code for 500 errors', () => {
        const serverErrors = [
          ServerErrorHelper.databaseError('op'),
          ServerErrorHelper.databaseConnectionError(),
          ServerErrorHelper.paymentGatewayError('Gateway'),
          ServerErrorHelper.externalServiceError('Service'),
          ServerErrorHelper.configurationError('Config'),
          ServerErrorHelper.internalError('Error'),
        ];

        serverErrors.forEach(error => {
          expect(error.statusCode).toBe(500);
          expect(error.referenceCode).toBeDefined();
          expect(typeof error.referenceCode).toBe('number'); // Numeric reference code
          expect(error.isServerError).toBe(true);
        });
      });
    });
  });

  describe('AppError - toJSON()', () => {
    it('should serialize User Error without reference code', () => {
      const error = UserErrorHelper.validation('Invalid email', {
        email: 'Format salah'
      });
      
      const json = error.toJSON();
      
      expect(json).toEqual({
        error: 'Invalid email',
        code: UserErrorCode.VALIDATION_ERROR,
        statusCode: 400,
        details: {
          fields: {
            email: 'Format salah'
          }
        }
      });
      expect(json).not.toHaveProperty('referenceCode');
    });

    it('should serialize Server Error with reference code', () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      
      const error = ServerErrorHelper.databaseError('test', {
        operation: 'test_op'
      });
      
      const json = error.toJSON();
      
      expect(json).toEqual({
        error: expect.stringContaining('Terjadi kesalahan database'),
        code: ServerErrorCode.DATABASE_QUERY_ERROR,
        statusCode: 500,
        referenceCode: expect.stringMatching(/^ERR-\d{8}-\d{6}-[A-Z0-9]{4}$/),
        details: {
          operation: 'test_op'
        }
      });
      expect(json).toHaveProperty('referenceCode');
      
      jest.restoreAllMocks();
    });
  });

  describe('Error Code Enums', () => {
    it('should have all User Error Codes', () => {
      const userCodes = Object.values(UserErrorCode);
      
      expect(userCodes).toContain('VALIDATION_ERROR');
      expect(userCodes).toContain('INVALID_EMAIL_FORMAT');
      expect(userCodes).toContain('INVALID_PHONE_FORMAT');
      expect(userCodes).toContain('INVALID_CREDENTIALS');
      expect(userCodes).toContain('UNAUTHORIZED');
      expect(userCodes).toContain('FORBIDDEN');
      expect(userCodes).toContain('NOT_FOUND');
      expect(userCodes).toContain('EMAIL_ALREADY_EXISTS');
      expect(userCodes).toContain('SEAT_ALREADY_BOOKED');
      expect(userCodes).toContain('SEAT_LOCKED');
      expect(userCodes).toContain('NO_SEATS_AVAILABLE');
      expect(userCodes).toContain('CANNOT_CANCEL_PAID_BOOKING');
      expect(userCodes).toContain('TICKET_ALREADY_USED');
      expect(userCodes).toContain('TICKET_EXPIRED');
      
      expect(userCodes.length).toBeGreaterThan(40);
    });

    it('should have all Server Error Codes', () => {
      const serverCodes = Object.values(ServerErrorCode);
      
      expect(serverCodes).toContain('DATABASE_CONNECTION_ERROR');
      expect(serverCodes).toContain('DATABASE_QUERY_ERROR');
      expect(serverCodes).toContain('PAYMENT_GATEWAY_ERROR');
      expect(serverCodes).toContain('EXTERNAL_SERVICE_ERROR');
      expect(serverCodes).toContain('CONFIGURATION_ERROR');
      expect(serverCodes).toContain('INTERNAL_SERVER_ERROR');
      
      expect(serverCodes.length).toBeGreaterThanOrEqual(7);
    });
  });

  describe('Error Distinction - User vs Server', () => {
    it('User Error should NEVER be a Server Error', () => {
      const userError = UserErrorHelper.notFound('Resource');
      
      expect(userError.isServerError).toBe(false);
      expect(userError.statusCode).not.toBe(500);
      expect(userError.referenceCode).toBeUndefined();
    });

    it('Server Error should ALWAYS be marked as Server Error', () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      
      const serverError = ServerErrorHelper.databaseError('test');
      
      expect(serverError.isServerError).toBe(true);
      expect(serverError.statusCode).toBe(500);
      expect(serverError.referenceCode).toBeDefined();
      
      jest.restoreAllMocks();
    });
  });
});
