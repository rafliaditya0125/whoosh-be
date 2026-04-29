/**
 * Booking domain type definitions
 */

/**
 * Passenger interface
 */
export interface Passenger {
  full_name: string;
  id_number: string;
  seat_id?: string;
}

/**
 * Passenger response interface
 */
export interface PassengerResponse {
  full_name: string;
  id_number: string;
  seat_number: string;
  class: 'economy' | 'business' | 'vip';
}

/**
 * Create booking request interface
 */
export interface CreateBookingRequest {
  schedule_id: string;
  passengers: Passenger[];
}

/**
 * Booking response interface
 */
export interface BookingResponse {
  booking_id: string;
  booking_code: string;
  total_price: number;
  status: 'pending' | 'paid' | 'completed' | 'cancelled';
  schedule: ScheduleResponse;
  passengers: PassengerResponse[];
}

/**
 * Schedule response interface
 */
export interface ScheduleResponse {
  schedule_id: string;
  train_name: string;
  departure_station_name: string;
  arrival_station_name: string;
  departure_time: string;
  arrival_time: string;
  price: number;
}

/**
 * Schedule interface
 */
export interface Schedule {
  schedule_id: string;
  train_id: string;
  departure_station: string;
  arrival_station: string;
  departure_time: string;
  arrival_time: string;
  price: number;
  created_at: string;
  updated_at: string;
}

/**
 * Booking interface
 */
export interface Booking {
  booking_id: string;
  user_id: string;
  schedule_id: string;
  booking_code: string;
  total_price: number;
  status: 'pending' | 'paid' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

/**
 * Create booking interface
 */
export interface CreateBooking {
  user_id: string;
  schedule_id: string;
  booking_code: string;
  total_price: number;
  status: 'pending';
}

/**
 * Booking passenger interface
 */
export interface BookingPassenger {
  id: string;
  booking_id: string;
  full_name: string;
  id_number: string;
  seat_id: string;
  created_at: string;
  updated_at: string;
}

/**
 * Create booking passenger interface
 */
export interface CreateBookingPassenger {
  booking_id: string;
  full_name: string;
  id_number: string;
  seat_id: string;
}
