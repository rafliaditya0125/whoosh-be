/**
 * Manager domain type definitions
 */

/**
 * Dashboard summary response
 */
export interface DashboardSummary {
  revenue: {
    today: number;
    this_week: number;
    this_month: number;
  };
  tickets_sold: {
    today: number;
    this_week: number;
    this_month: number;
  };
  average_occupancy: number;
  top_routes: TopRoute[];
}

/**
 * Top route interface
 */
export interface TopRoute {
  departure_station: string;
  arrival_station: string;
  tickets_sold: number;
  revenue: number;
}

/**
 * Sales report item
 */
export interface SalesReportItem {
  date: string;
  route: string;
  train_name: string;
  class: 'economy' | 'business' | 'vip';
  tickets_sold: number;
  revenue: number;
  occupancy_rate: number;
}

/**
 * Sales report query parameters
 */
export interface SalesReportQuery {
  date_from: string;
  date_to: string;
  route?: string;
  train_id?: string;
  page?: number;
  limit?: number;
}

/**
 * Transaction list item
 */
export interface TransactionListItem {
  payment_id: string;
  booking_code: string;
  user_name: string;
  user_email: string;
  amount: number;
  payment_method: string;
  status: 'pending' | 'success' | 'failed' | 'expired';
  created_at: string;
}

/**
 * Transaction query parameters
 */
export interface TransactionQuery {
  status?: 'pending' | 'success' | 'failed' | 'expired';
  date_from?: string;
  date_to?: string;
  search?: string;
  page?: number;
  limit?: number;
}

/**
 * Pagination metadata
 */
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  items: T[];
  pagination: Pagination;
}
