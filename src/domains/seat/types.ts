/**
 * Seat domain types
 */

export interface Seat {
  seat_id: string;
  train_id: string;
  seat_number: string;
  class: 'economy' | 'business' | 'vip';
  created_at: string;
  updated_at: string;
}

export interface SeatLock {
  lock_id: string;
  seat_id: string;
  schedule_id: string;
  user_id: string;
  locked_at: string;
  expires_at: string;
  status: 'active' | 'expired' | 'released' | 'confirmed';
}

export interface LockSeatRequest {
  schedule_id: string;
  seat_ids: string[];
  lock_duration?: number; // in seconds
}

export interface LockSeatResponse {
  message: string;
  lock_id: string;
  locked_seats: string[];
  expires_at: string;
}

export interface AvailableSeatResponse {
  seat_id: string;
  seat_number: string;
  class: 'economy' | 'business' | 'vip';
  status: 'available' | 'locked' | 'booked';
}
