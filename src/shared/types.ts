import { Request } from 'express';

/**
 * Role types for users
 */
export type Role = 'user' | 'admin';

/**
 * Request interface with typed user information
 */
export interface UserRequest extends Request {
  user?: {
    user_id: string;
    role: Role;
  };
}

/**
 * Request interface with pagination query parameters
 */
export interface PaginatedRequest extends Request {
  query?: {
    page?: string;
    limit?: string;
    [key: string]: string | undefined;
  };
}

/**
 * Request interface with route parameters
 */
export interface RequestWithParams<T> extends Request {
  params: T;
}

/**
 * Request interface with body
 */
export interface RequestWithBody<T> extends Request {
  body: T;
}

/**
 * Request interface with query parameters
 */
export interface RequestWithQuery<T> extends Request {
  query: T;
}
