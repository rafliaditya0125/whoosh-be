import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { AuthRepository } from './authRepository';
import { LoginRequest, RegisterRequest, AuthResponse, RegisterResponse, UserResponse } from './authTypes';
import { UserErrorCode, UserErrorHelper, ServerErrorHelper } from '../../shared/error';

/**
 * Auth service interface
 */
export interface AuthService {
  login(request: LoginRequest): Promise<AuthResponse>;
  register(request: RegisterRequest): Promise<RegisterResponse>;
  me(userId: string): Promise<UserResponse>;
}

/**
 * Auth service implementation
 */
export class AuthServiceImpl implements AuthService {
  constructor(private authRepository: AuthRepository) {}

  async login(request: LoginRequest): Promise<AuthResponse> {
    const { email, password } = request;

    // Validation
    if (!email || !password) {
      const fields: Record<string, string> = {};
      if (!email) fields.email = 'Wajib diisi';
      if (!password) fields.password = 'Wajib diisi';

      throw UserErrorHelper.validation('Email dan password wajib diisi', fields);
    }

    const user = await this.authRepository.findByEmail(email);
    if (!user) {
      throw UserErrorHelper.invalidCredentials();
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      throw UserErrorHelper.invalidCredentials();
    }

    const token = jwt.sign(
      { user_id: user.user_id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '7d' }
    );

    // Return consistent user schema
    return {
      token,
      user: {
        user_id: String(user.user_id),
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    };
  }

  async register(request: RegisterRequest): Promise<RegisterResponse> {
    const { full_name, email, phone, password } = request;

    // Validation
    if (!full_name || !email || !phone || !password) {
      const fields: Record<string, string> = {};
      if (!full_name) fields.full_name = 'Wajib diisi';
      if (!email) fields.email = 'Wajib diisi';
      if (!phone) fields.phone = 'Wajib diisi';
      if (!password) fields.password = 'Wajib diisi';

      throw UserErrorHelper.validation('Semua field wajib diisi', fields);
    }

    // Validate field lengths (based on database schema)
    const MAX_FULL_NAME_LENGTH = 100;
    const MAX_EMAIL_LENGTH = 100;
    const MAX_PHONE_LENGTH = 20;

    if (full_name.length > MAX_FULL_NAME_LENGTH) {
      throw UserErrorHelper.fieldTooLong('Nama lengkap', MAX_FULL_NAME_LENGTH, full_name.length);
    }

    if (email.length > MAX_EMAIL_LENGTH) {
      throw UserErrorHelper.fieldTooLong('Email', MAX_EMAIL_LENGTH, email.length);
    }

    if (phone.length > MAX_PHONE_LENGTH) {
      throw UserErrorHelper.fieldTooLong('Nomor telepon', MAX_PHONE_LENGTH, phone.length);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw UserErrorHelper.validation(
        'Format email salah. Silakan gunakan format email yang valid',
        { email: 'Format salah' }
      );
    }

    // Validate phone format (WAJIB diawali +62)
    const phoneRegex = /^\+62[0-9]{9,12}$/;
    if (!phoneRegex.test(phone)) {
      throw UserErrorHelper.invalidPhoneFormat();
    }

    // Validate password length
    if (password.length < 8) {
      throw UserErrorHelper.validation(
        'Password terlalu pendek. Password minimal 8 karakter',
        { password: 'Minimal 8 karakter' }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      const [user_id] = await this.authRepository.create({
        full_name,
        email,
        phone,
        password_hash: hashedPassword,
        role: 'user',
      });

      // Return consistent user schema (same as login and me)
      return {
        message: 'User berhasil terdaftar',
        user: {
          user_id: String(user_id),
          full_name,
          email,
          phone,
          role: 'user',
        },
      };
    } catch (error: unknown) {
      if (error instanceof Error && 'code' in error) {
        const dbError = error as { code: string; sqlMessage?: string };
        
        if (dbError.code === 'ER_DUP_ENTRY') {
          // Check which field is duplicate
          const sqlMessage = dbError.sqlMessage || '';
          
          if (sqlMessage.includes('email')) {
            throw UserErrorHelper.emailExists();
          } else if (sqlMessage.includes('phone')) {
            throw UserErrorHelper.phoneExists();
          } else {
            throw UserErrorHelper.conflict(
              'Email atau nomor telepon sudah terdaftar. Silakan gunakan kredensial lain atau login',
              UserErrorCode.DUPLICATE_ENTRY
            );
          }
        }
        
        // Data truncation errors - USER ERROR (data too long)
        if (dbError.code === 'WARN_DATA_TRUNCATED' || dbError.code === 'ER_DATA_TOO_LONG') {
          const sqlMessage = dbError.sqlMessage || '';
          
          // Try to identify which field
          if (sqlMessage.toLowerCase().includes('full_name')) {
            throw UserErrorHelper.fieldTooLong('Nama lengkap', MAX_FULL_NAME_LENGTH);
          } else if (sqlMessage.toLowerCase().includes('email')) {
            throw UserErrorHelper.fieldTooLong('Email', MAX_EMAIL_LENGTH);
          } else if (sqlMessage.toLowerCase().includes('phone')) {
            throw UserErrorHelper.fieldTooLong('Nomor telepon', MAX_PHONE_LENGTH);
          } else {
            // Generic message if we can't identify the field
            throw UserErrorHelper.validation(
              'Salah satu field terlalu panjang. Silakan periksa panjang data Anda',
              { error: 'Data terlalu panjang' }
            );
          }
        }
        
        // Database error - this is SERVER ERROR
        throw ServerErrorHelper.databaseError('registrasi user', {
          operation: 'create_user',
          error: dbError.code,
        });
      }
      
      // Unknown error - this is SERVER ERROR
      throw ServerErrorHelper.internalError('registrasi user gagal', {
        operation: 'register',
      });
    }
  }

  async me(userId: string): Promise<UserResponse> {
    const user = await this.authRepository.findById(userId);
    if (!user) {
      throw UserErrorHelper.notFound('User', userId);
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
