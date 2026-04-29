import { UserRepository, SavedPassengerRepository } from './repository';
import { User, SavedPassenger, CreateSavedPassenger } from './types';
import { AppError, ErrorCode } from '../../shared/error';

/**
 * User service interface
 */
export interface UserService {
  findById(id: string): Promise<User | null>;
  update(id: string, data: Partial<User>): Promise<void>;
  delete(id: string): Promise<void>;
}

/**
 * Saved passenger service interface
 */
export interface SavedPassengerService {
  findByUserId(userId: string): Promise<SavedPassenger[]>;
  create(userId: string, data: CreateSavedPassenger): Promise<string>;
  delete(id: string): Promise<void>;
}

/**
 * User service implementation
 */
export class UserServiceImpl implements UserService {
  constructor(private userRepository: UserRepository) {}

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findById(id);
  }

  async update(id: string, data: Partial<User>): Promise<void> {
    const existing = await this.userRepository.findById(id);
    if (!existing) {
      throw new AppError('User not found', 404, ErrorCode.NOT_FOUND);
    }
    await this.userRepository.update(id, data);
  }

  async delete(id: string): Promise<void> {
    const existing = await this.userRepository.findById(id);
    if (!existing) {
      throw new AppError('User not found', 404, ErrorCode.NOT_FOUND);
    }
    await this.userRepository.delete(id);
  }
}

/**
 * Saved passenger service implementation
 */
export class SavedPassengerServiceImpl implements SavedPassengerService {
  constructor(private savedPassengerRepository: SavedPassengerRepository) {}

  async findByUserId(userId: string): Promise<SavedPassenger[]> {
    return this.savedPassengerRepository.findByUserId(userId);
  }

  async create(userId: string, data: CreateSavedPassenger): Promise<string> {
    const [id] = await this.savedPassengerRepository.create({ ...data, user_id: userId });
    return id;
  }

  async delete(id: string): Promise<void> {
    const existing = await this.savedPassengerRepository.findById(id);
    if (!existing) {
      throw new AppError('Saved passenger not found', 404, ErrorCode.NOT_FOUND);
    }
    await this.savedPassengerRepository.delete(id);
  }
}
