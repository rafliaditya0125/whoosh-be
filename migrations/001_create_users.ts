import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable('users', table => {
        table.increments('user_id');
        table.string('full_name', 100).notNullable();
        table.string('email', 100).unique().notNullable();
        table.string('phone', 20).unique().notNullable();
        table.string('password_hash', 255).notNullable();
        table.enu('role', ['user', 'admin']).defaultTo('user');
        table.timestamp('created_at').defaultTo(knex.fn.now());
    });
}

export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTableIfExists('users');
}
