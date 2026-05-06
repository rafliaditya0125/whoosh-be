import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    await knex.schema.alterTable('tickets', table => {
        table.text('qr_data').nullable();
        table.text('qr_code_url').nullable();
        table.timestamp('qr_generated_at').nullable();
        table.timestamp('qr_expires_at').nullable();
    });

    await knex.schema.createTable('ticket_validations', table => {
        table.increments('validation_id');
        table.integer('ticket_id').unsigned();
        table.integer('station_id').unsigned();
        table.string('validator_id').nullable();
        table.timestamp('validated_at').defaultTo(knex.fn.now());
        table.enu('validation_result', ['success', 'failed']).defaultTo('success');
        table.text('failure_reason').nullable();
        table.string('ip_address').nullable();

        table.foreign('ticket_id').references('tickets.ticket_id');
        table.foreign('station_id').references('stations.station_id');
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists('ticket_validations');
    await knex.schema.alterTable('tickets', table => {
        table.dropColumn('qr_data');
        table.dropColumn('qr_code_url');
        table.dropColumn('qr_generated_at');
        table.dropColumn('qr_expires_at');
    });
}
