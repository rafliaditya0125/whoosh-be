import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable('refunds', table => {
        table.increments('refund_id');
        table.integer('booking_id').unsigned();
        table.integer('user_id').unsigned();
        table.decimal('original_amount', 12, 2);
        table.decimal('cancellation_fee', 12, 2);
        table.decimal('refund_amount', 12, 2);
        table.text('reason');
        table.json('bank_account');
        table.enu('status', ['pending', 'approved', 'rejected', 'processed']).defaultTo('pending');
        table.timestamp('requested_at').defaultTo(knex.fn.now());
        table.timestamp('processed_at').nullable();
        table.text('notes').nullable();

        table.foreign('booking_id').references('bookings.booking_id');
        table.foreign('user_id').references('users.user_id');
    });

    await knex.schema.createTable('reschedule_history', table => {
        table.increments('reschedule_id');
        table.integer('booking_id').unsigned();
        table.integer('old_schedule_id').unsigned();
        table.integer('new_schedule_id').unsigned();
        table.decimal('price_difference', 12, 2);
        table.decimal('reschedule_fee', 12, 2);
        table.timestamp('rescheduled_at').defaultTo(knex.fn.now());
        table.text('reason').nullable();

        table.foreign('booking_id').references('bookings.booking_id');
        table.foreign('old_schedule_id').references('schedules.schedule_id');
        table.foreign('new_schedule_id').references('schedules.schedule_id');
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists('reschedule_history');
    await knex.schema.dropTableIfExists('refunds');
}
