import { Request } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { ParsedQs } from 'qs';

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
 * Request interface with query parameters
 */
export interface RequestWithQuery<T extends ParsedQs> extends Request {
  query: T;
}
