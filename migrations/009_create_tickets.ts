import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable('tickets', table => {
        table.increments('ticket_id');
        table.integer('booking_id').unsigned();
        table.string('qr_code', 255);
        table.timestamp('issued_at').defaultTo(knex.fn.now());

        table.foreign('booking_id').references('bookings.booking_id');
    });
}

export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTableIfExists('tickets');
}
