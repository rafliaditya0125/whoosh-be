import { Knex } from 'knex';

/**
 * Migration: Add manager role and user status
 * - Adds 'manager' to role enum (user, manager, admin)
 * - Adds is_active boolean field for blocking users
 */
export async function up(knex: Knex): Promise<void> {
  // Add is_active column to users table
  await knex.schema.alterTable('users', (table) => {
    table.boolean('is_active').defaultTo(true).notNullable();
  });

  // Update role enum to include manager
  // Note: MySQL/MariaDB requires recreating the column for enum changes
  await knex.raw(`
    ALTER TABLE users 
    MODIFY COLUMN role ENUM('user', 'manager', 'admin') NOT NULL DEFAULT 'user'
  `);
}

export async function down(knex: Knex): Promise<void> {
  // Remove is_active column
  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('is_active');
  });

  // Revert role enum to original (user, admin)
  await knex.raw(`
    ALTER TABLE users 
    MODIFY COLUMN role ENUM('user', 'admin') NOT NULL DEFAULT 'user'
  `);
}
