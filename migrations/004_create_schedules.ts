import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable('schedules', table => {
        table.increments('schedule_id');
        table.integer('train_id').unsigned();
        table.integer('departure_station').unsigned();
        table.integer('arrival_station').unsigned();
        table.dateTime('departure_time');
        table.dateTime('arrival_time');
        table.decimal('price', 12, 2);

        table.foreign('train_id').references('trains.train_id');
        table.foreign('departure_station').references('stations.station_id');
        table.foreign('arrival_station').references('stations.station_id');
    });
}

export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTableIfExists('schedules');
}
