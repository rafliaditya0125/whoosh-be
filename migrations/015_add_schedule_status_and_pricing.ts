import { Knex } from 'knex';

/**
 * Migration: Add schedule status and class-based pricing
 * - Adds price_business and price_vip for multi-class pricing
 * - Adds status enum (active, inactive) for schedule management
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('schedules', (table) => {
    table.decimal('price_business', 10, 2).nullable();
    table.decimal('price_vip', 10, 2).nullable();
    table.enum('status', ['active', 'inactive']).defaultTo('active').notNullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('schedules', (table) => {
    table.dropColumn('price_business');
    table.dropColumn('price_vip');
    table.dropColumn('status');
  });
}
