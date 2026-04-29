/**
 * Schedule domain type definitions
 */

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
 * Create schedule interface
 */
export interface CreateSchedule {
  train_id: string;
  departure_station: string;
  arrival_station: string;
  departure_time: string;
  arrival_time: string;
  price: number;
}
