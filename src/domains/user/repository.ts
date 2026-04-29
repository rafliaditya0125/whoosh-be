import { User, CreateUser, SavedPassenger, CreateSavedPassenger } from './types';
import { db } from '../../shared/db';

/**
 * User repository interface
 */
export interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  create(data: CreateUser): Promise<string[]>;
  update(id: string, data: Partial<User>): Promise<void>;
  delete(id: string): Promise<void>;
}

/**
 * Saved passenger repository interface
 */
export interface SavedPassengerRepository {
  findByUserId(userId: string): Promise<SavedPassenger[]>;
  findById(id: string): Promise<SavedPassenger | null>;
  create(data: CreateSavedPassenger): Promise<string[]>;
  delete(id: string): Promise<void>;
}

/**
 * User repository implementation
 */
export class UserRepositoryImpl implements UserRepository {
  async findByEmail(email: string): Promise<User | null> {
    return db('users').where({ email }).first() as User | null;
  }

  async findById(id: string): Promise<User | null> {
    return db('users').where({ user_id: id }).first() as User | null;
  }

  async create(data: CreateUser): Promise<string[]> {
    return db('users').insert(data);
  }

  async update(id: string, data: Partial<User>): Promise<void> {
    await db('users').where({ user_id: id }).update(data);
  }

  async delete(id: string): Promise<void> {
    await db('users').where({ user_id: id }).del();
  }
}

/**
 * Saved passenger repository implementation
 */
export class SavedPassengerRepositoryImpl implements SavedPassengerRepository {
  async findByUserId(userId: string): Promise<SavedPassenger[]> {
    return db('saved_passengers').where({ user_id: userId }) as SavedPassenger[];
  }

  async findById(id: string): Promise<SavedPassenger | null> {
    return db('saved_passengers').where({ id }).first();
  }

  async create(data: CreateSavedPassenger): Promise<string[]> {
    return db('saved_passengers').insert(data);
  }

  async delete(id: string): Promise<void> {
    await db('saved_passengers').where({ id }).del();
  }
}
