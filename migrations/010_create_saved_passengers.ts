import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable('saved_passengers', table => {
        table.increments('id');
        table.integer('user_id').unsigned();
        table.string('full_name', 100).notNullable();
        table.string('id_number', 30).notNullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());

        table.foreign('user_id').references('users.user_id');
    });
}

export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTableIfExists('saved_passengers');
}
