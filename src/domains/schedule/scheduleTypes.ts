import { Station } from '../station/stationTypes';

/**
 * Schedule domain type definitions
 */

/**
 * Schedule interface
 */
export interface Schedule {
  schedule_id: string;
  train_id: string;
  departure_station: Station;
  arrival_station: Station;
  departure_time: string;
  arrival_time: string;
  price: number;
  price_business?: number;
  price_vip?: number;
  available_economy: number;
  available_business: number;
  available_vip: number;
  status: 'active' | 'inactive';
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
  price_business?: number;
  price_vip?: number;
}
