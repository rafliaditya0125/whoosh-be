import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AuthServiceImpl } from '../src/domains/auth/service';
import { AuthRepository } from '../src/domains/auth/repository';
import { AppError, UserErrorCode, ServerErrorCode } from '../src/shared/error';

// Mock dependencies
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('AuthService', () => {
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

  describe('login', () => {
    const loginRequest = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should login successfully and return a token', async () => {
      const mockUser = {
        user_id: 'user-1',
        full_name: 'Test User',
        email: 'test@example.com',
        phone: '123456789',
        password_hash: 'hashed-password',
        role: 'user' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockAuthRepository.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue('mock-token');

      const result = await authService.login(loginRequest);

      expect(result).toEqual({
        token: 'mock-token',
        user: {
          user_id: 'user-1',
          full_name: 'Test User',
          email: 'test@example.com',
          phone: '123456789',
          role: 'user',
        },
      });
      expect(mockAuthRepository.findByEmail).toHaveBeenCalledWith(loginRequest.email);
    });

    it('should throw AppError if user not found', async () => {
      mockAuthRepository.findByEmail.mockResolvedValue(null);

      try {
        await authService.login(loginRequest);
        fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect((error as AppError).statusCode).toBe(401);
        expect((error as AppError).code).toBe(UserErrorCode.INVALID_CREDENTIALS);
      }
    });

    it('should throw AppError if password does not match', async () => {
      mockAuthRepository.findByEmail.mockResolvedValue({
        password_hash: 'hashed-password',
      } as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      try {
        await authService.login(loginRequest);
        fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect((error as AppError).statusCode).toBe(401);
        expect((error as AppError).code).toBe(UserErrorCode.INVALID_CREDENTIALS);
      }
    });

    // Extreme Scenario: Extremely long password
    it('should handle extremely long passwords (1KB)', async () => {
      const longPassword = 'a'.repeat(1024);
      const mockUser = {
        user_id: 'user-1',
        full_name: 'Test User',
        email: 'test@example.com',
        password_hash: 'hashed-password',
        role: 'user' as const,
      };

      mockAuthRepository.findByEmail.mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue('mock-token');

      const result = await authService.login({ ...loginRequest, password: longPassword });
      expect(result.token).toBe('mock-token');
      expect(bcrypt.compare).toHaveBeenCalledWith(longPassword, 'hashed-password');
    });
  });

  describe('register', () => {
    const registerRequest = {
      full_name: 'New User',
      email: 'new@example.com',
      phone: '+628123456789',
      password: 'password123',
    };

    it('should register successfully', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      mockAuthRepository.create.mockResolvedValue(['new-user-id']);

      const result = await authService.register(registerRequest);

      expect(result).toEqual({
        message: 'User berhasil terdaftar',
        user: {
          user_id: 'new-user-id',
          full_name: 'New User',
          email: 'new@example.com',
          phone: '+628123456789',
          role: 'user',
        },
      });
      expect(mockAuthRepository.create).toHaveBeenCalled();
    });

    // Extreme Scenario: Duplicate entry simulation
    it('should throw AppError if email already exists', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      const error = new Error('Duplicate entry');
      (error as any).code = 'ER_DUP_ENTRY';
      (error as any).sqlMessage = 'Duplicate entry for key email';
      mockAuthRepository.create.mockRejectedValue(error);

      try {
        await authService.register(registerRequest);
        fail('Should have thrown error');
      } catch (err) {
        expect(err).toBeInstanceOf(AppError);
        expect((err as AppError).statusCode).toBe(409);
        expect((err as AppError).code).toBe(UserErrorCode.EMAIL_ALREADY_EXISTS);
      }
    });

    // Extreme Scenario: Malicious characters in registration
    it('should pass malicious strings safely to repository', async () => {
      const maliciousRequest = {
        ...registerRequest,
        full_name: "Test' OR '1'='1",
        email: 'malicious@example.com',
      };
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      mockAuthRepository.create.mockResolvedValue(['new-id']);

      await authService.register(maliciousRequest);
      expect(mockAuthRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        full_name: maliciousRequest.full_name,
        email: maliciousRequest.email,
      }));
    });

    // Field Length Validation Tests
    it('should throw AppError if full_name exceeds 100 characters', async () => {
      const longNameRequest = {
        ...registerRequest,
        full_name: 'a'.repeat(101), // 101 characters
      };

      try {
        await authService.register(longNameRequest);
        fail('Should have thrown error');
      } catch (err) {
        expect(err).toBeInstanceOf(AppError);
        expect((err as AppError).statusCode).toBe(400);
        expect((err as AppError).code).toBe(UserErrorCode.FIELD_TOO_LONG);
        expect((err as AppError).message).toContain('Nama lengkap');
        expect((err as AppError).message).toContain('100 karakter');
      }
    });

    it('should throw AppError if email exceeds 100 characters', async () => {
      const longEmailRequest = {
        ...registerRequest,
        email: 'a'.repeat(90) + '@example.com', // 102 characters
      };

      try {
        await authService.register(longEmailRequest);
        fail('Should have thrown error');
      } catch (err) {
        expect(err).toBeInstanceOf(AppError);
        expect((err as AppError).statusCode).toBe(400);
        expect((err as AppError).code).toBe(UserErrorCode.FIELD_TOO_LONG);
        expect((err as AppError).message).toContain('Email');
        expect((err as AppError).message).toContain('100 karakter');
      }
    });

    it('should throw AppError if phone exceeds 20 characters', async () => {
      const longPhoneRequest = {
        ...registerRequest,
        phone: '+62' + '8'.repeat(20), // 23 characters
      };

      try {
        await authService.register(longPhoneRequest);
        fail('Should have thrown error');
      } catch (err) {
        expect(err).toBeInstanceOf(AppError);
        expect((err as AppError).statusCode).toBe(400);
        expect((err as AppError).code).toBe(UserErrorCode.FIELD_TOO_LONG);
        expect((err as AppError).message).toContain('Nomor telepon');
        expect((err as AppError).message).toContain('20 karakter');
      }
    });

    it('should throw AppError if invalid email format', async () => {
      const invalidEmailRequest = {
        ...registerRequest,
        email: 'invalid-email',
      };

      try {
        await authService.register(invalidEmailRequest);
        fail('Should have thrown error');
      } catch (err) {
        expect(err).toBeInstanceOf(AppError);
        expect((err as AppError).statusCode).toBe(400);
        expect((err as AppError).code).toBe(UserErrorCode.VALIDATION_ERROR);
        expect((err as AppError).message).toContain('Format email salah');
      }
    });

    it('should throw AppError if phone does not start with +62', async () => {
      const invalidPhoneRequest = {
        ...registerRequest,
        phone: '08123456789', // Missing +62
      };

      try {
        await authService.register(invalidPhoneRequest);
        fail('Should have thrown error');
      } catch (err) {
        expect(err).toBeInstanceOf(AppError);
        expect((err as AppError).statusCode).toBe(400);
        expect((err as AppError).code).toBe(UserErrorCode.INVALID_PHONE_FORMAT);
        expect((err as AppError).message).toContain('+62');
      }
    });

    it('should throw AppError if password is too short', async () => {
      const shortPasswordRequest = {
        ...registerRequest,
        password: 'short', // Less than 8 characters
      };

      try {
        await authService.register(shortPasswordRequest);
        fail('Should have thrown error');
      } catch (err) {
        expect(err).toBeInstanceOf(AppError);
        expect((err as AppError).statusCode).toBe(400);
        expect((err as AppError).code).toBe(UserErrorCode.VALIDATION_ERROR);
        expect((err as AppError).message).toContain('Password terlalu pendek');
      }
    });

    it('should handle WARN_DATA_TRUNCATED as User Error', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      const error = new Error('Data truncated');
      (error as any).code = 'WARN_DATA_TRUNCATED';
      (error as any).sqlMessage = 'Data truncated for column full_name';
      mockAuthRepository.create.mockRejectedValue(error);

      try {
        await authService.register(registerRequest);
        fail('Should have thrown error');
      } catch (err) {
        expect(err).toBeInstanceOf(AppError);
        expect((err as AppError).statusCode).toBe(400); // User Error, not 500
        expect((err as AppError).code).toBe(UserErrorCode.FIELD_TOO_LONG);
        expect((err as AppError).message).toContain('Nama lengkap');
      }
    });

    it('should handle ER_DATA_TOO_LONG as User Error', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      const error = new Error('Data too long');
      (error as any).code = 'ER_DATA_TOO_LONG';
      (error as any).sqlMessage = 'Data too long for column email';
      mockAuthRepository.create.mockRejectedValue(error);

      try {
        await authService.register(registerRequest);
        fail('Should have thrown error');
      } catch (err) {
        expect(err).toBeInstanceOf(AppError);
        expect((err as AppError).statusCode).toBe(400); // User Error, not 500
        expect((err as AppError).code).toBe(UserErrorCode.FIELD_TOO_LONG);
        expect((err as AppError).message).toContain('Email');
      }
    });
  });

  describe('me', () => {
    it('should return user info if found', async () => {
      const mockUser = {
        user_id: 'user-1',
        full_name: 'Test User',
        email: 'test@example.com',
        phone: '123456789',
        role: 'user',
      };
      mockAuthRepository.findById.mockResolvedValue(mockUser as any);

      const result = await authService.me('user-1');

      expect(result).toEqual({
        user_id: 'user-1',
        full_name: 'Test User',
        email: 'test@example.com',
        phone: '123456789',
        role: 'user',
      });
    });

    it('should throw AppError if user not found', async () => {
      mockAuthRepository.findById.mockResolvedValue(null);

      try {
        await authService.me('user-1');
        fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect((error as AppError).statusCode).toBe(404);
        expect((error as AppError).code).toBe(UserErrorCode.NOT_FOUND);
      }
    });
  });
});
