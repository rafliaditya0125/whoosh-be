import { db } from '../../shared/db';

/**
 * Auth repository interface
 */
export interface AuthRepository {
  findByEmail(email: string): Promise<AuthUser | null>;
  findById(id: string): Promise<AuthUser | null>;
  create(user: Partial<AuthUser>): Promise<string[]>;
}

/**
 * Auth user interface
 */
export interface AuthUser {
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  password_hash: string;
  role: 'user' | 'admin';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Auth repository implementation
 */
export class AuthRepositoryImpl implements AuthRepository {
  async findByEmail(email: string): Promise<AuthUser | null> {
    return db('users').where({ email }).first<AuthUser | null>();
  }

  async findById(id: string): Promise<AuthUser | null> {
    return db('users').where({ user_id: id }).first<AuthUser | null>();
  }

  async create(user: Partial<AuthUser>): Promise<string[]> {
    return db('users').insert(user);
  }
}
