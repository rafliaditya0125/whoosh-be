/**
 * Admin domain type definitions
 */

import { Pagination } from '../manager/managerTypes';

/**
 * User list query parameters
 */
export interface UserListQuery {
  search?: string;
  role?: 'user' | 'manager' | 'admin';
  is_active?: boolean;
  page?: number;
  limit?: number;
}

/**
 * User update request
 */
export interface UserUpdateRequest {
  full_name?: string;
  email?: string;
  phone?: string;
  role?: 'user' | 'manager' | 'admin';
}

/**
 * User status update request
 */
export interface UserStatusUpdateRequest {
  is_active: boolean;
}

/**
 * Booking list query parameters
 */
export interface BookingListQuery {
  status?: 'pending' | 'paid' | 'completed' | 'cancelled';
  date_from?: string;
  date_to?: string;
  search?: string;
  page?: number;
  limit?: number;
}

/**
 * Refund list query parameters
 */
export interface RefundListQuery {
  status?: 'pending' | 'approved' | 'rejected' | 'processed';
  page?: number;
  limit?: number;
}

/**
 * Refund update request
 */
export interface RefundUpdateRequest {
  status: 'approved' | 'rejected';
  notes?: string;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  items: T[];
  pagination: Pagination;
}
