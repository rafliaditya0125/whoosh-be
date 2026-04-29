import knex from 'knex';
import type { Knex } from 'knex';

import { dbConfig } from './db.config';

/**
 * Database connection instance
 */
export const db: Knex = knex(dbConfig.development);

/**
 * Type definition for Knex instance
 */
export type DbInstance = Knex;
