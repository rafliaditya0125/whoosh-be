import { AdminRepository, AdminRepositoryImpl } from './adminRepository';
import {
  UserListQuery,
  UserUpdateRequest,
  UserStatusUpdateRequest,
  BookingListQuery,
  RefundListQuery,
  RefundUpdateRequest,
  PaginatedResponse,
} from './adminTypes';

/**
 * Admin service interface
 */
export interface AdminService {
  // User management
  getUsers(query: UserListQuery): Promise<PaginatedResponse<any>>;
  getUserById(userId: string): Promise<any>;
  updateUser(userId: string, data: UserUpdateRequest): Promise<any>;
  updateUserStatus(userId: string, data: UserStatusUpdateRequest): Promise<any>;

  // Booking management
  getBookings(query: BookingListQuery): Promise<PaginatedResponse<any>>;

  // Refund management
  getRefunds(query: RefundListQuery): Promise<PaginatedResponse<any>>;
  updateRefund(refundId: string, data: RefundUpdateRequest): Promise<any>;
}

/**
 * Admin service implementation
 */
export class AdminServiceImpl implements AdminService {
  constructor(private repository: AdminRepository = new AdminRepositoryImpl()) {}

  /**
   * Get users with pagination and filters
   */
  async getUsers(query: UserListQuery): Promise<PaginatedResponse<any>> {
    return this.repository.getUsers(query);
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<any> {
    const user = await this.repository.getUserById(userId);
    
    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    return user;
  }

  /**
   * Update user data
   */
  async updateUser(userId: string, data: UserUpdateRequest): Promise<any> {
    // Check if user exists
    const user = await this.repository.getUserById(userId);
    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    // Validate email format if provided
    if (data.email && !this.isValidEmail(data.email)) {
      throw new Error('INVALID_EMAIL_FORMAT');
    }

    // Validate phone format if provided
    if (data.phone && !this.isValidPhone(data.phone)) {
      throw new Error('INVALID_PHONE_FORMAT');
    }

    return this.repository.updateUser(userId, data);
  }

  /**
   * Update user status (block/unblock)
   */
  async updateUserStatus(userId: string, data: UserStatusUpdateRequest): Promise<any> {
    // Check if user exists
    const user = await this.repository.getUserById(userId);
    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    return this.repository.updateUserStatus(userId, data.is_active);
  }

  /**
   * Get bookings with pagination and filters
   */
  async getBookings(query: BookingListQuery): Promise<PaginatedResponse<any>> {
    return this.repository.getBookings(query);
  }

  /**
   * Get refunds with pagination and filters
   */
  async getRefunds(query: RefundListQuery): Promise<PaginatedResponse<any>> {
    return this.repository.getRefunds(query);
  }

  /**
   * Update refund status (approve/reject)
   */
  async updateRefund(refundId: string, data: RefundUpdateRequest): Promise<any> {
    return this.repository.updateRefund(refundId, data);
  }

  /**
   * Helper: Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Helper: Validate phone format (+62...)
   */
  private isValidPhone(phone: string): boolean {
    const phoneRegex = /^\+62[0-9]{9,13}$/;
    return phoneRegex.test(phone);
  }
}
