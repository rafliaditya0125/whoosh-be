import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AuthServiceImpl } from '../src/domains/auth/service';
import { AuthRepository } from '../src/domains/auth/repository';
import { AppError } from '../src/shared/error';

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
          id: 'user-1',
          name: 'Test User',
          role: 'user',
        },
      });
      expect(mockAuthRepository.findByEmail).toHaveBeenCalledWith(loginRequest.email);
    });

    it('should throw AppError if user not found', async () => {
      mockAuthRepository.findByEmail.mockResolvedValue(null);

      await expect(authService.login(loginRequest)).rejects.toThrow(AppError);
    });

    it('should throw AppError if password does not match', async () => {
      mockAuthRepository.findByEmail.mockResolvedValue({
        password_hash: 'hashed-password',
      } as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(authService.login(loginRequest)).rejects.toThrow(AppError);
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
      phone: '123456789',
      password: 'password123',
    };

    it('should register successfully', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      mockAuthRepository.create.mockResolvedValue(['new-user-id']);

      const result = await authService.register(registerRequest);

      expect(result).toEqual({
        message: 'User registered',
        user_id: 'new-user-id',
      });
      expect(mockAuthRepository.create).toHaveBeenCalled();
    });

    // Extreme Scenario: Duplicate entry simulation
    it('should throw AppError if email already exists', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      const error = new Error('Duplicate entry');
      (error as any).code = 'ER_DUP_ENTRY';
      mockAuthRepository.create.mockRejectedValue(error);

      await expect(authService.register(registerRequest)).rejects.toThrow(AppError);
    });

    // Extreme Scenario: Malicious characters in registration
    it('should pass malicious strings safely to repository', async () => {
      const maliciousRequest = {
        ...registerRequest,
        full_name: "Test' OR '1'='1",
        email: 'test@example.com; DROP TABLE users',
      };
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      mockAuthRepository.create.mockResolvedValue(['new-id']);

      await authService.register(maliciousRequest);
      expect(mockAuthRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        full_name: maliciousRequest.full_name,
        email: maliciousRequest.email,
      }));
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

      await expect(authService.me('user-1')).rejects.toThrow(AppError);
    });
  });
});
