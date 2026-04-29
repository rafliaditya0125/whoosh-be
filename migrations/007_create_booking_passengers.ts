import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable('booking_passengers', table => {
        table.increments('passenger_id');
        table.integer('booking_id').unsigned();
        table.string('full_name', 100);
        table.string('id_number', 30);
        table.integer('seat_id').unsigned();

        table.foreign('booking_id').references('bookings.booking_id');
        table.foreign('seat_id').references('seats.seat_id');
    });
}

export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTableIfExists('booking_passengers');
}
