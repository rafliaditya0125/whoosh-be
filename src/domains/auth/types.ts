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
 * Auth response interface
 */
export interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    role: 'user' | 'admin';
  };
}

/**
 * User response interface
 */
export interface UserResponse {
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  role: 'user' | 'admin';
}
