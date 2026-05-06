/**
 * Error codes for the Whoosh application
 * Divided into User Errors and Server Errors
 */

import { logServerError } from './logger';

// ============================================
// USER ERRORS (Client-side errors)
// These errors are caused by user input/actions
// NEVER use 500 status code for these
// ============================================
export enum UserErrorCode {
  // Validation Errors (400)
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT = 'INVALID_FORMAT',
  INVALID_EMAIL_FORMAT = 'INVALID_EMAIL_FORMAT',
  INVALID_PHONE_FORMAT = 'INVALID_PHONE_FORMAT',
  PASSWORD_TOO_SHORT = 'PASSWORD_TOO_SHORT',
  INVALID_DATE_FORMAT = 'INVALID_DATE_FORMAT',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  FIELD_TOO_LONG = 'FIELD_TOO_LONG',
  
  // Authentication Errors (401)
  UNAUTHORIZED = 'UNAUTHORIZED',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  MISSING_TOKEN = 'MISSING_TOKEN',
  
  // Authorization Errors (403)
  FORBIDDEN = 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  ADMIN_ONLY = 'ADMIN_ONLY',
  
  // Not Found Errors (404)
  NOT_FOUND = 'NOT_FOUND',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  BOOKING_NOT_FOUND = 'BOOKING_NOT_FOUND',
  PAYMENT_NOT_FOUND = 'PAYMENT_NOT_FOUND',
  TICKET_NOT_FOUND = 'TICKET_NOT_FOUND',
  SCHEDULE_NOT_FOUND = 'SCHEDULE_NOT_FOUND',
  STATION_NOT_FOUND = 'STATION_NOT_FOUND',
  TRAIN_NOT_FOUND = 'TRAIN_NOT_FOUND',
  SEAT_NOT_FOUND = 'SEAT_NOT_FOUND',
  
  // Conflict Errors (409)
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',
  EMAIL_ALREADY_EXISTS = 'EMAIL_ALREADY_EXISTS',
  PHONE_ALREADY_EXISTS = 'PHONE_ALREADY_EXISTS',
  RESOURCE_CONFLICT = 'RESOURCE_CONFLICT',
  SEAT_ALREADY_BOOKED = 'SEAT_ALREADY_BOOKED',
  SEAT_LOCKED = 'SEAT_LOCKED',
  BOOKING_CODE_EXISTS = 'BOOKING_CODE_EXISTS',
  
  // Business Logic Errors (422)
  BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',
  INVALID_STATE_TRANSITION = 'INVALID_STATE_TRANSITION',
  BOOKING_ALREADY_PAID = 'BOOKING_ALREADY_PAID',
  BOOKING_ALREADY_CANCELLED = 'BOOKING_ALREADY_CANCELLED',
  BOOKING_EXPIRED = 'BOOKING_EXPIRED',
  PAYMENT_ALREADY_PROCESSED = 'PAYMENT_ALREADY_PROCESSED',
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  NO_SEATS_AVAILABLE = 'NO_SEATS_AVAILABLE',
  SEAT_LOCK_EXPIRED = 'SEAT_LOCK_EXPIRED',
  INVALID_LOCK_ID = 'INVALID_LOCK_ID',
  CANNOT_CANCEL_PAID_BOOKING = 'CANNOT_CANCEL_PAID_BOOKING',
  CANNOT_REFUND_UNPAID_BOOKING = 'CANNOT_REFUND_UNPAID_BOOKING',
  REFUND_PERIOD_EXPIRED = 'REFUND_PERIOD_EXPIRED',
  TICKET_ALREADY_USED = 'TICKET_ALREADY_USED',
  TICKET_EXPIRED = 'TICKET_EXPIRED',
  INVALID_QR_CODE = 'INVALID_QR_CODE',
  WRONG_STATION = 'WRONG_STATION',
}

// ============================================
// SERVER ERRORS (Server-side errors)
// These errors are caused by server issues
// CAN use 500 status code with reference code
// ============================================
export enum ServerErrorCode {
  DATABASE_CONNECTION_ERROR = 'DATABASE_CONNECTION_ERROR',
  DATABASE_QUERY_ERROR = 'DATABASE_QUERY_ERROR',
  DATABASE_TIMEOUT = 'DATABASE_TIMEOUT',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  PAYMENT_GATEWAY_ERROR = 'PAYMENT_GATEWAY_ERROR',
  EMAIL_SERVICE_ERROR = 'EMAIL_SERVICE_ERROR',
  FILE_SYSTEM_ERROR = 'FILE_SYSTEM_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
}

// Application-level error reference codes (for server errors)
export enum ServerErrorReferenceCode {
  // Database errors (1000-1099)
  DB_CONNECTION_FAILED = 1000,
  DB_QUERY_FAILED = 1001,
  DB_TIMEOUT = 1002,
  DB_TRANSACTION_FAILED = 1003,
  
  // External service errors (1100-1199)
  PAYMENT_GATEWAY_FAILED = 1100,
  PAYMENT_GATEWAY_TIMEOUT = 1101,
  EMAIL_SERVICE_FAILED = 1102,
  SMS_SERVICE_FAILED = 1103,
  
  // Configuration errors (1200-1299)
  MISSING_ENV_CONFIG = 1200,
  INVALID_CONFIG = 1201,
  
  // Internal errors (1300-1399)
  UNEXPECTED_ERROR = 1300,
  FILE_SYSTEM_ERROR = 1301,
}

// Combined type for all error codes
export type ErrorCode = UserErrorCode | ServerErrorCode;
export const ErrorCode = { ...UserErrorCode, ...ServerErrorCode };

/**
 * Custom application error class
 * Supports both User Errors and Server Errors
 */
export class AppError extends Error {
  public referenceCode?: number; // Application-level error code (e.g., 1000, 1001)

  constructor(
    public message: string,
    public statusCode: number,
    public code: ErrorCode,
    public details?: Record<string, unknown>,
    public isServerError: boolean = false,
    referenceCode?: number
  ) {
    super(message);
    this.name = 'AppError';
    
    // Set reference code for server errors
    if (isServerError && referenceCode) {
      this.referenceCode = referenceCode;
    }
  }

  /**
   * Convert error to JSON response format
   */
  toJSON() {
    const response: Record<string, unknown> = {
      error: this.message,
      code: this.code,
      statusCode: this.statusCode,
    };

    // Add reference code for server errors (MUST be in response)
    if (this.referenceCode !== undefined) {
      response.referenceCode = this.referenceCode;
    }

    // Add details if available
    if (this.details) {
      response.details = this.details;
    }

    return response;
  }

  /**
   * Log error with reference code (for server errors)
   */
  logError() {
    if (this.isServerError && this.referenceCode !== undefined) {
      logServerError(
        this.referenceCode,
        this.code,
        this.message,
        this.details,
        this.stack
      );
    }
  }
}

/**
 * Helper functions to create common USER errors
 * These errors NEVER use status code 500
 */
export class UserErrorHelper {
  static notFound(resource: string, identifier?: string): AppError {
    const message = identifier
      ? `${resource} dengan identifier '${identifier}' tidak ditemukan`
      : `${resource} tidak ditemukan`;
    return new AppError(message, 404, UserErrorCode.NOT_FOUND);
  }

  static unauthorized(reason?: string): AppError {
    const message = reason
      ? `Unauthorized: ${reason}`
      : 'Unauthorized. Silakan login untuk mengakses resource ini';
    return new AppError(message, 401, UserErrorCode.UNAUTHORIZED);
  }

  static forbidden(reason?: string): AppError {
    const message = reason
      ? `Forbidden: ${reason}`
      : 'Anda tidak memiliki permission untuk mengakses resource ini';
    return new AppError(message, 403, UserErrorCode.FORBIDDEN);
  }

  static validation(message: string, fields?: Record<string, string>): AppError {
    return new AppError(
      message,
      400,
      UserErrorCode.VALIDATION_ERROR,
      fields ? { fields } : undefined
    );
  }

  static conflict(message: string, code: UserErrorCode = UserErrorCode.RESOURCE_CONFLICT): AppError {
    return new AppError(message, 409, code);
  }

  static businessRule(message: string, code: UserErrorCode = UserErrorCode.BUSINESS_RULE_VIOLATION): AppError {
    return new AppError(message, 422, code);
  }

  static invalidCredentials(): AppError {
    return new AppError(
      'Email atau password salah. Silakan periksa kredensial Anda dan coba lagi',
      401,
      UserErrorCode.INVALID_CREDENTIALS
    );
  }

  static emailExists(): AppError {
    return new AppError(
      'Email sudah terdaftar. Silakan gunakan email lain atau login',
      409,
      UserErrorCode.EMAIL_ALREADY_EXISTS
    );
  }

  static phoneExists(): AppError {
    return new AppError(
      'Nomor telepon sudah terdaftar. Silakan gunakan nomor telepon lain',
      409,
      UserErrorCode.PHONE_ALREADY_EXISTS
    );
  }

  static invalidPhoneFormat(): AppError {
    return new AppError(
      'Format nomor telepon salah. Nomor telepon wajib diawali +62 (contoh: +628123456789)',
      400,
      UserErrorCode.INVALID_PHONE_FORMAT,
      { fields: { phone: 'Format salah, wajib diawali +62' } }
    );
  }

  static seatAlreadyBooked(seatNumber?: string): AppError {
    const message = seatNumber
      ? `Kursi ${seatNumber} sudah dibooking. Silakan pilih kursi lain`
      : 'Kursi sudah dibooking. Silakan pilih kursi lain';
    return new AppError(message, 409, UserErrorCode.SEAT_ALREADY_BOOKED);
  }

  static seatLocked(seatNumber?: string, expiresAt?: Date): AppError {
    let message = seatNumber
      ? `Kursi ${seatNumber} sedang di-lock oleh user lain`
      : 'Kursi sedang di-lock oleh user lain';
    
    if (expiresAt) {
      message += `. Lock akan expire pada ${expiresAt.toISOString()}`;
    }
    
    message += '. Silakan pilih kursi lain atau coba lagi nanti';
    return new AppError(message, 409, UserErrorCode.SEAT_LOCKED);
  }

  static noSeatsAvailable(): AppError {
    return new AppError(
      'Tidak ada kursi tersedia untuk jadwal ini. Silakan pilih jadwal atau kelas lain',
      422,
      UserErrorCode.NO_SEATS_AVAILABLE
    );
  }

  static cannotCancelPaidBooking(): AppError {
    return new AppError(
      'Tidak dapat membatalkan booking: Status booking adalah "paid". Hanya booking dengan status "pending" yang dapat dibatalkan. Silakan ajukan refund',
      422,
      UserErrorCode.CANNOT_CANCEL_PAID_BOOKING
    );
  }

  static cannotRefundUnpaidBooking(): AppError {
    return new AppError(
      'Tidak dapat refund booking: Booking belum dibayar. Hanya booking yang sudah dibayar yang dapat di-refund',
      422,
      UserErrorCode.CANNOT_REFUND_UNPAID_BOOKING
    );
  }

  static ticketAlreadyUsed(): AppError {
    return new AppError(
      'Tiket sudah digunakan untuk check-in. Setiap tiket hanya dapat digunakan sekali',
      422,
      UserErrorCode.TICKET_ALREADY_USED
    );
  }

  static ticketExpired(): AppError {
    return new AppError(
      'Tiket sudah expired. Waktu keberangkatan sudah lewat',
      422,
      UserErrorCode.TICKET_EXPIRED
    );
  }

  static invalidQRCode(reason?: string): AppError {
    const message = reason
      ? `QR code tidak valid: ${reason}`
      : 'QR code tidak valid. Pastikan Anda scan tiket yang benar';
    return new AppError(message, 400, UserErrorCode.INVALID_QR_CODE);
  }

  static fieldTooLong(fieldName: string, maxLength: number, actualLength?: number): AppError {
    let message = `${fieldName} terlalu panjang. Maksimal ${maxLength} karakter`;
    if (actualLength) {
      message += ` (Anda memasukkan ${actualLength} karakter)`;
    }
    return new AppError(
      message,
      400,
      UserErrorCode.FIELD_TOO_LONG,
      { 
        fields: { 
          [fieldName.toLowerCase().replace(' ', '_')]: `Maksimal ${maxLength} karakter` 
        },
        maxLength,
        actualLength
      }
    );
  }
}

/**
 * Helper functions to create SERVER errors
 * These errors CAN use status code 500 with reference code
 */
export class ServerErrorHelper {
  static databaseError(operation: string, details?: Record<string, unknown>): AppError {
    const error = new AppError(
      `Terjadi kesalahan database saat ${operation}. Silakan coba lagi atau hubungi support dengan kode error: ${ServerErrorReferenceCode.DB_QUERY_FAILED}`,
      500,
      ServerErrorCode.DATABASE_QUERY_ERROR,
      details,
      true, // isServerError
      ServerErrorReferenceCode.DB_QUERY_FAILED
    );
    error.logError();
    return error;
  }

  static databaseConnectionError(): AppError {
    const error = new AppError(
      `Tidak dapat terhubung ke database. Silakan coba lagi atau hubungi support dengan kode error: ${ServerErrorReferenceCode.DB_CONNECTION_FAILED}`,
      500,
      ServerErrorCode.DATABASE_CONNECTION_ERROR,
      undefined,
      true,
      ServerErrorReferenceCode.DB_CONNECTION_FAILED
    );
    error.logError();
    return error;
  }

  static databaseTimeout(): AppError {
    const error = new AppError(
      `Database timeout. Silakan coba lagi atau hubungi support dengan kode error: ${ServerErrorReferenceCode.DB_TIMEOUT}`,
      500,
      ServerErrorCode.DATABASE_TIMEOUT,
      undefined,
      true,
      ServerErrorReferenceCode.DB_TIMEOUT
    );
    error.logError();
    return error;
  }

  static paymentGatewayError(gatewayName: string, details?: Record<string, unknown>): AppError {
    const error = new AppError(
      `Terjadi kesalahan pada payment gateway ${gatewayName}. Silakan coba lagi atau hubungi support dengan kode error: ${ServerErrorReferenceCode.PAYMENT_GATEWAY_FAILED}`,
      500,
      ServerErrorCode.PAYMENT_GATEWAY_ERROR,
      details,
      true,
      ServerErrorReferenceCode.PAYMENT_GATEWAY_FAILED
    );
    error.logError();
    return error;
  }

  static externalServiceError(serviceName: string, details?: Record<string, unknown>): AppError {
    const error = new AppError(
      `Terjadi kesalahan pada layanan eksternal ${serviceName}. Silakan coba lagi atau hubungi support dengan kode error: ${ServerErrorReferenceCode.EMAIL_SERVICE_FAILED}`,
      500,
      ServerErrorCode.EXTERNAL_SERVICE_ERROR,
      details,
      true,
      ServerErrorReferenceCode.EMAIL_SERVICE_FAILED
    );
    error.logError();
    return error;
  }

  static configurationError(configName: string): AppError {
    const error = new AppError(
      `Konfigurasi server salah: ${configName}. Silakan hubungi support dengan kode error: ${ServerErrorReferenceCode.MISSING_ENV_CONFIG}`,
      500,
      ServerErrorCode.CONFIGURATION_ERROR,
      { config: configName },
      true,
      ServerErrorReferenceCode.MISSING_ENV_CONFIG
    );
    error.logError();
    return error;
  }

  static internalError(message: string, details?: Record<string, unknown>): AppError {
    const error = new AppError(
      `Terjadi kesalahan internal: ${message}. Silakan hubungi support dengan kode error: ${ServerErrorReferenceCode.UNEXPECTED_ERROR}`,
      500,
      ServerErrorCode.INTERNAL_SERVER_ERROR,
      details,
      true,
      ServerErrorReferenceCode.UNEXPECTED_ERROR
    );
    error.logError();
    return error;
  }
}

// Backward compatibility - export as ErrorHelper
export const ErrorHelper = UserErrorHelper;
