import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable('seat_locks', table => {
        table.string('lock_id').primary();
        table.integer('seat_id').unsigned();
        table.integer('schedule_id').unsigned();
        table.integer('user_id').unsigned();
        table.timestamp('locked_at').defaultTo(knex.fn.now());
        table.timestamp('expires_at');
        table.enu('status', ['active', 'expired', 'released', 'confirmed']).defaultTo('active');

        table.foreign('seat_id').references('seats.seat_id');
        table.foreign('schedule_id').references('schedules.schedule_id');
        table.foreign('user_id').references('users.user_id');
    });
}

export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTableIfExists('seat_locks');
}
