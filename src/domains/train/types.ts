/**
 * Train domain type definitions
 */

/**
 * Train interface
 */
export interface Train {
  train_id: string;
  train_name: string;
  train_code: string;
  total_seats: number;
  created_at: string;
  updated_at: string;
}

/**
 * Create train interface
 */
export interface CreateTrain {
  train_name: string;
  train_code: string;
  total_seats: number;
}

/**
 * Seat interface
 */
export interface Seat {
  seat_id: string;
  train_id: string;
  seat_number: string;
  class: 'economy' | 'business' | 'vip';
  created_at: string;
  updated_at: string;
}

/**
 * Create seat interface
 */
export interface CreateSeat {
  train_id: string;
  seat_number: string;
  class: 'economy' | 'business' | 'vip';
}
