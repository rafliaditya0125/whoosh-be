import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable('bookings', table => {
        table.increments('booking_id');
        table.integer('user_id').unsigned();
        table.integer('schedule_id').unsigned();
        table.string('booking_code', 20).unique();
        table.timestamp('booking_date').defaultTo(knex.fn.now());
        table.decimal('total_price', 12, 2);
        table.enu('status', ['pending', 'paid', 'cancelled', 'completed']).defaultTo('pending');

        table.foreign('user_id').references('users.user_id');
        table.foreign('schedule_id').references('schedules.schedule_id');
    });
}

export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTableIfExists('bookings');
}
