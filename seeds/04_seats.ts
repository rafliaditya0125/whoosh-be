import type { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
    // Deletes ALL existing entries
    await knex('seats').del();

    const trains = await knex('trains').select('train_id');

    if (trains.length === 0) {
        console.error('No trains found for seats seeding');
        return;
    }

    const seats = [];

    for (const train of trains) {
        // VIP Class (Car 1)
        for (let row = 1; row <= 2; row++) {
            ['A', 'C'].forEach(col => {
                seats.push({
                    train_id: train.train_id,
                    seat_number: `1-${row}${col}`,
                    class: 'vip'
                });
            });
        }

        // Business Class (Car 2)
        for (let row = 1; row <= 4; row++) {
            ['A', 'B', 'D', 'E'].forEach(col => {
                seats.push({
                    train_id: train.train_id,
                    seat_number: `2-${row}${col}`,
                    class: 'business'
                });
            });
        }

        // Economy Class (Car 3-4)
        for (let car = 3; car <= 4; car++) {
            for (let row = 1; row <= 10; row++) {
                ['A', 'B', 'C', 'D', 'E'].forEach(col => {
                    seats.push({
                        train_id: train.train_id,
                        seat_number: `${car}-${row}${col}`,
                        class: 'economy'
                    });
                });
            }
        }
    }

    // Inserts seed entries in chunks to avoid large payload issues
    const chunkSize = 500;
    for (let i = 0; i < seats.length; i += chunkSize) {
        await knex('seats').insert(seats.slice(i, i + chunkSize));
    }
}
