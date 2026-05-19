/**
 * Auth domain type definitions
 */

/**
 * Login request interface
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Register request interface
 */
export interface RegisterRequest {
  full_name: string;
  email: string;
  phone: string;
  password: string;
}

/**
 * Auth response interface (for login and register)
 */
export interface AuthResponse {
  token: string;
  user: UserResponse; // Use consistent UserResponse schema
}

/**
 * Register response interface
 */
export interface RegisterResponse {
  message: string;
  user: UserResponse; // Return full user object, not just user_id
}

/**
 * User response interface (consistent schema for all endpoints)
 */
export interface UserResponse {
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  role: 'user' | 'manager' | 'admin';
  is_active?: boolean;
  created_at?: string;
}
