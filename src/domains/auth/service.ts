import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { AuthRepository } from './repository';
import { LoginRequest, RegisterRequest, AuthResponse, UserResponse } from './types';
import { AppError, ErrorCode } from '../../shared/error';

/**
 * Auth service interface
 */
export interface AuthService {
  login(request: LoginRequest): Promise<AuthResponse>;
  register(request: RegisterRequest): Promise<{ message: string; user_id: string }>;
  me(userId: string): Promise<UserResponse>;
}

/**
 * Auth service implementation
 */
export class AuthServiceImpl implements AuthService {
  constructor(private authRepository: AuthRepository) {}

  async login(request: LoginRequest): Promise<AuthResponse> {
    const { email, password } = request;

    const user = await this.authRepository.findByEmail(email);
    if (!user) {
      throw new AppError('Invalid email or password', 400, ErrorCode.UNAUTHORIZED);
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      throw new AppError('Invalid email or password', 400, ErrorCode.UNAUTHORIZED);
    }

    const token = jwt.sign(
      { user_id: user.user_id, role: user.role },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '7d' }
    );

    return {
      token,
      user: {
        id: user.user_id,
        name: user.full_name,
        role: user.role,
      },
    };
  }

  async register(request: RegisterRequest): Promise<{ message: string; user_id: string }> {
    const { full_name, email, phone, password } = request;

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      const [user_id] = await this.authRepository.create({
        full_name,
        email,
        phone,
        password_hash: hashedPassword,
        role: 'user',
      });

      return { message: 'User registered', user_id };
    } catch (error: unknown) {
      if (error instanceof Error && 'code' in error && (error as { code: string }).code === 'ER_DUP_ENTRY') {
        throw new AppError('Email or phone already exists', 400, ErrorCode.VALIDATION_ERROR);
      }
      throw new AppError('Failed to register user', 500, ErrorCode.DATABASE_ERROR);
    }
  }

  async me(userId: string): Promise<UserResponse> {
    const user = await this.authRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404, ErrorCode.NOT_FOUND);
    }

    return {
      user_id: user.user_id,
      full_name: user.full_name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    };
  }
}
