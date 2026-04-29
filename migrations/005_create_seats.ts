import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable('seats', table => {
        table.increments('seat_id');
        table.integer('train_id').unsigned();
        table.string('seat_number', 10);
        table.enu('class', ['economy', 'business', 'vip']).defaultTo('economy');

        table.foreign('train_id').references('trains.train_id');
    });
}

export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTableIfExists('seats');
}
