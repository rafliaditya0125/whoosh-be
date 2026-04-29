/**
 * Domain base interfaces for the Whoosh application
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Controller interface
 * All controllers must implement a handle method
 */
export interface Controller {
  handle(request: Request, response: Response, next: NextFunction): Promise<void>;
}

/**
 * Service interface
 * All services should implement domain-specific methods
 */
export type Service = object;

/**
 * Repository interface
 * All repositories must implement CRUD operations
 */
export interface Repository<T> {
  findById(id: string): Promise<T | null>;
  findAll(): Promise<T[]>;
  create(data: Partial<T>): Promise<string[]>;
  update(id: string, data: Partial<T>): Promise<void>;
  delete(id: string): Promise<void>;
}
