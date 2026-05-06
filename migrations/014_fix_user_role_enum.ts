import type { Knex } from 'knex';

/**
 * Fix user role enum from 'customer' to 'user'
 * This migration fixes the inconsistency between database enum and application code
 */
export async function up(knex: Knex): Promise<void> {
  // MySQL/MariaDB: Need to alter the column to change enum values
  await knex.raw(`
    ALTER TABLE users 
    MODIFY COLUMN role ENUM('user', 'admin') DEFAULT 'user'
  `);
  
  // Update existing 'customer' values to 'user' (if any exist)
  await knex('users')
    .where('role', 'customer')
    .update({ role: 'user' });
}

export async function down(knex: Knex): Promise<void> {
  // Revert back to 'customer'
  await knex('users')
    .where('role', 'user')
    .update({ role: 'customer' });
    
  await knex.raw(`
    ALTER TABLE users 
    MODIFY COLUMN role ENUM('customer', 'admin') DEFAULT 'customer'
  `);
}
