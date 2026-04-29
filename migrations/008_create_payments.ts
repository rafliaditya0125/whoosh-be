import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable('payments', table => {
        table.increments('payment_id');
        table.integer('booking_id').unsigned();
        table.enu('payment_method', ['bank_transfer', 'ewallet', 'credit_card']);
        table.timestamp('payment_date').defaultTo(knex.fn.now());
        table.decimal('amount', 12, 2);
        table.enu('payment_status', ['pending', 'success', 'failed']).defaultTo('pending');

        table.foreign('booking_id').references('bookings.booking_id');
    });
}

export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTableIfExists('payments');
}
