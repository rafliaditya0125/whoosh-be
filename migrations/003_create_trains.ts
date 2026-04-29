import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable('trains', table => {
        table.increments('train_id');
        table.string('train_name', 100).notNullable();
        table.string('train_code', 20).unique();
        table.integer('total_seats').defaultTo(600);
    });
}

export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTableIfExists('trains');
}
