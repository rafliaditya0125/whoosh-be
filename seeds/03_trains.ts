import type { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
    // Deletes ALL existing entries
    await knex('trains').del();

    // Inserts seed entries
    await knex('trains').insert([
        { train_name: 'Whoosh Red', train_code: 'W-001', total_seats: 601 },
        { train_name: 'Whoosh Blue', train_code: 'W-002', total_seats: 601 },
        { train_name: 'Whoosh Yellow', train_code: 'W-003', total_seats: 601 },
        { train_name: 'Whoosh Green', train_code: 'W-004', total_seats: 601 },
    ]);
}
