/**
 * Payment domain type definitions
 */

/**
 * Payment interface
 */
export interface Payment {
  payment_id: string;
  booking_id: string;
  payment_method: string;
  amount: number;
  payment_status: 'pending' | 'success' | 'failed';
  payment_date: string; // Database column name
}

/**
 * Create payment interface
 */
export interface CreatePayment {
  booking_id: string;
  payment_method: string;
  amount: number;
  payment_status: 'pending';
}
