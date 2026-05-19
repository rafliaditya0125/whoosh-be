import { Request, Response, NextFunction } from 'express';
import { errorHandler } from '../src/shared/middleware';
import { AppError, UserErrorCode, ServerErrorCode } from '../src/shared/error';

describe('Security - Error Handler', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let jsonSpy: jest.Mock;
  let statusSpy: jest.Mock;

  beforeEach(() => {
    jsonSpy = jest.fn();
    statusSpy = jest.fn().mockReturnValue({ json: jsonSpy });
    
    mockRequest = {};
    mockResponse = {
      status: statusSpy,
      json: jsonSpy,
    };
    mockNext = jest.fn();
    
    // Mock console.error to prevent test output pollution
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('SECURITY: Information Disclosure Prevention', () => {
    it('should NEVER leak stack traces to client', () => {
      const error = new Error('Database connection failed');
      error.stack = 'Error: Database connection failed\n    at /home/user/app/src/db.ts:123:45';

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusSpy).toHaveBeenCalledWith(500);
      const response = jsonSpy.mock.calls[0][0];
      
      // CRITICAL: Stack trace must NOT be in response
      expect(JSON.stringify(response)).not.toContain('at /home/user');
      expect(JSON.stringify(response)).not.toContain('.ts:');
      expect(JSON.stringify(response)).not.toContain('stack');
    });

    it('should NEVER leak SQL queries to client', () => {
      const dbError = new Error('SQL Error') as any;
      dbError.sql = 'SELECT * FROM users WHERE email = "test@example.com"';
      dbError.sqlMessage = 'Table users does not exist';

      errorHandler(dbError, mockRequest as Request, mockResponse as Response, mockNext);

      const response = jsonSpy.mock.calls[0][0];
      
      // CRITICAL: SQL must NOT be in response
      expect(JSON.stringify(response)).not.toContain('SELECT');
      expect(JSON.stringify(response)).not.toContain('FROM users');
      expect(JSON.stringify(response)).not.toContain('sql');
      expect(JSON.stringify(response)).not.toContain('sqlMessage');
    });

    it('should NEVER leak database error codes to client', () => {
      const dbError = new Error('Database error') as any;
      dbError.code = 'ER_NO_SUCH_TABLE';
      dbError.errno = 1146;
      dbError.sqlState = '42S02';

      errorHandler(dbError, mockRequest as Request, mockResponse as Response, mockNext);

      const response = jsonSpy.mock.calls[0][0];
      
      // CRITICAL: Database error codes must NOT be in response
      expect(JSON.stringify(response)).not.toContain('ER_NO_SUCH_TABLE');
      expect(JSON.stringify(response)).not.toContain('1146');
      expect(JSON.stringify(response)).not.toContain('42S02');
      expect(JSON.stringify(response)).not.toContain('errno');
      expect(JSON.stringify(response)).not.toContain('sqlState');
    });

    it('should NEVER leak internal file paths to client', () => {
      const error = new Error('Internal error');
      error.stack = 'Error: Internal error\n    at /home/user/whoosh-be/src/domains/auth/authService.ts:123:45';

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      const response = jsonSpy.mock.calls[0][0];
      
      // CRITICAL: File paths must NOT be in response
      expect(JSON.stringify(response)).not.toContain('/home/');
      expect(JSON.stringify(response)).not.toContain('/src/');
      expect(JSON.stringify(response)).not.toContain('service.ts');
    });

    it('should return generic message for unexpected errors', () => {
      const error = new Error('Detailed internal error with sensitive info');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusSpy).toHaveBeenCalledWith(500);
      const response = jsonSpy.mock.calls[0][0];
      
      // Should return generic message
      expect(response.error).toContain('Terjadi kesalahan internal');
      expect(response.error).toContain('kode error');
      expect(response.referenceCode).toBeDefined();
      
      // Should NOT contain original error message
      expect(response.error).not.toContain('Detailed internal error');
      expect(response.error).not.toContain('sensitive info');
    });

    it('should include reference code for tracking (but no sensitive details)', () => {
      const error = new Error('Database timeout');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      const response = jsonSpy.mock.calls[0][0];
      
      // Should have reference code for support
      expect(response.referenceCode).toBe(1300);
      expect(response.code).toBe('INTERNAL_SERVER_ERROR');
      
      // But NO sensitive details
      expect(response.details).toBeUndefined();
    });
  });

  describe('SECURITY: AppError Handling', () => {
    it('should safely handle User Errors (no sensitive info)', () => {
      const error = new AppError(
        'Email sudah terdaftar',
        409,
        UserErrorCode.EMAIL_ALREADY_EXISTS
      );

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusSpy).toHaveBeenCalledWith(409);
      const response = jsonSpy.mock.calls[0][0];
      
      expect(response.error).toBe('Email sudah terdaftar');
      expect(response.code).toBe(UserErrorCode.EMAIL_ALREADY_EXISTS);
      expect(response.referenceCode).toBeUndefined(); // User errors don't have reference codes
    });

    it('should safely handle Server Errors with reference code', () => {
      const error = new AppError(
        'Terjadi kesalahan database. Silakan hubungi support dengan kode error: 1001',
        500,
        ServerErrorCode.DATABASE_QUERY_ERROR,
        { operation: 'create_user' }, // Safe detail
        true,
        1001
      );

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusSpy).toHaveBeenCalledWith(500);
      const response = jsonSpy.mock.calls[0][0];
      
      expect(response.error).toContain('Terjadi kesalahan database');
      expect(response.code).toBe(ServerErrorCode.DATABASE_QUERY_ERROR);
      expect(response.referenceCode).toBe(1001);
      expect(response.details).toEqual({ operation: 'create_user' });
    });

    it('should filter out sensitive keys from AppError details', () => {
      const error = new AppError(
        'Database error',
        500,
        ServerErrorCode.DATABASE_QUERY_ERROR,
        {
          operation: 'create_user', // Safe
          sql: 'SELECT * FROM users', // SENSITIVE - should be filtered
          stack: 'Error stack trace', // SENSITIVE - should be filtered
          query: 'INSERT INTO users', // SENSITIVE - should be filtered
          sqlMessage: 'Duplicate entry', // SENSITIVE - should be filtered
        },
        true,
        1001
      );

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      const response = jsonSpy.mock.calls[0][0];
      
      // Should only include safe details
      expect(response.details).toEqual({ operation: 'create_user' });
      
      // Should NOT include sensitive keys
      expect(response.details.sql).toBeUndefined();
      expect(response.details.stack).toBeUndefined();
      expect(response.details.query).toBeUndefined();
      expect(response.details.sqlMessage).toBeUndefined();
    });
  });

  describe('SECURITY: Response Format', () => {
    it('should always return JSON (never HTML)', () => {
      const error = new Error('Any error');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      // Should call json() method, not send() or other methods
      expect(jsonSpy).toHaveBeenCalled();
      
      const response = jsonSpy.mock.calls[0][0];
      expect(typeof response).toBe('object');
      expect(response.error).toBeDefined();
      expect(response.code).toBeDefined();
    });

    it('should have consistent error response structure', () => {
      const error = new Error('Test error');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      const response = jsonSpy.mock.calls[0][0];
      
      // Required fields
      expect(response).toHaveProperty('error');
      expect(response).toHaveProperty('code');
      expect(response).toHaveProperty('statusCode');
      expect(response).toHaveProperty('referenceCode');
      
      // Should NOT have these fields
      expect(response).not.toHaveProperty('stack');
      expect(response).not.toHaveProperty('sql');
      expect(response).not.toHaveProperty('message'); // Use 'error' instead
    });
  });
});
