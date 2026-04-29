import type { Knex } from 'knex';
import { dbConfig } from './src/shared/db.config';

const config: { [key: string]: Knex.Config } = {
  development: {
    ...dbConfig.development,
    migrations: {
      directory: './migrations',
      extension: 'ts',
    },
    seeds: {
      directory: './seeds',
      extension: 'ts',
    },
  },
};

export default config;