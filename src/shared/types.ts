import { Request } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { ParsedQs } from 'qs';

/**
 * Role types for users
 */
export type Role = 'user' | 'manager' | 'admin';

/**
 * Request interface with typed user information
 */
export interface UserRequest extends Request {
  user?: {
    user_id: string;
    email: string;
    role: Role;
  };
}

/**
 * Request interface with pagination query parameters
 */
export interface PaginatedRequest extends Request {
  query: ParsedQs & {
    page?: string;
    limit?: string;
  };
}

/**
 * Request interface with route parameters
 */
export interface RequestWithParams<T extends ParamsDictionary> extends Request {
  params: T;
}

/**
 * Request interface with body
 */
export interface RequestWithBody<T> extends Request {
  body: T;
}

/**
 * Pagination metadata
 */
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  items: T[];
  pagination: Pagination;
}
