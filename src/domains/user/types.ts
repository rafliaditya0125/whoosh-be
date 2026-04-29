/**
 * User domain type definitions
 */

/**
 * User interface
 */
export interface User {
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  password_hash: string;
  role: 'user' | 'admin';
  created_at: string;
  updated_at: string;
}

/**
 * Create user interface
 */
export interface CreateUser {
  full_name: string;
  email: string;
  phone: string;
  password_hash: string;
  role?: 'user';
}

/**
 * Saved passenger interface
 */
export interface SavedPassenger {
  id: string;
  user_id: string;
  full_name: string;
  id_number: string;
  created_at: string;
  updated_at: string;
}

/**
 * Create saved passenger interface
 */
export interface CreateSavedPassenger {
  user_id: string;
  full_name: string;
  id_number: string;
}
