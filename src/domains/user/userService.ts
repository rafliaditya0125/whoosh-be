import { UserRepository, SavedPassengerRepository } from './userRepository';
import { User, SavedPassenger, CreateSavedPassenger } from './userTypes';
import { UserErrorHelper, ServerErrorHelper } from '../../shared/error';

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
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw UserErrorHelper.notFound('User', id);
    }
    return user;
  }

  async update(id: string, data: Partial<User>): Promise<void> {
    const existing = await this.userRepository.findById(id);
    if (!existing) {
      throw UserErrorHelper.notFound('User', id);
    }
    
    try {
      await this.userRepository.update(id, data);
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw ServerErrorHelper.databaseError('update user', {
          operation: 'update_user',
          user_id: id,
        });
      }
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    const existing = await this.userRepository.findById(id);
    if (!existing) {
      throw UserErrorHelper.notFound('User', id);
    }
    
    try {
      await this.userRepository.delete(id);
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw ServerErrorHelper.databaseError('delete user', {
          operation: 'delete_user',
          user_id: id,
        });
      }
      throw error;
    }
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
    try {
      const [id] = await this.savedPassengerRepository.create({ ...data, user_id: userId });
      return id;
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw ServerErrorHelper.databaseError('membuat saved passenger', {
          operation: 'create_saved_passenger',
          user_id: userId,
        });
      }
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    const existing = await this.savedPassengerRepository.findById(id);
    if (!existing) {
      throw UserErrorHelper.notFound('Saved passenger', id);
    }
    
    try {
      await this.savedPassengerRepository.delete(id);
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw ServerErrorHelper.databaseError('delete saved passenger', {
          operation: 'delete_saved_passenger',
          saved_passenger_id: id,
        });
      }
      throw error;
    }
  }
}
