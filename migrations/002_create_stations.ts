import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable('stations', table => {
        table.increments('station_id');
        table.string('station_name', 100).notNullable();
        table.string('city', 100);
        table.string('code', 10).unique();
    });
}

export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTableIfExists('stations');
}
