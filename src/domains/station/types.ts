/**
 * Station domain type definitions
 */

/**
 * Station interface
 */
export interface Station {
  station_id: string;
  station_name: string;
  location: string;
  created_at: string;
  updated_at: string;
}

/**
 * Create station interface
 */
export interface CreateStation {
  station_name: string;
  location: string;
}
