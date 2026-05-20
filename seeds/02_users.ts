import type { Knex } from 'knex';
import bcrypt from 'bcryptjs';

export async function seed(knex: Knex): Promise<void> {
    // Deletes ALL existing entries
    await knex('users').del();

    const hashedPassword = await bcrypt.hash('password123', 10);

    // Inserts seed entries
    await knex('users').insert([
        {
            full_name: 'Super Admin Whoosh',
            email: 'admin@whoosh.id',
            phone: '+6281234567890',
            password_hash: hashedPassword,
            role: 'admin',
            is_active: true
        },
        {
            full_name: 'Operational Manager',
            email: 'manager@whoosh.id',
            phone: '+6281234567891',
            password_hash: hashedPassword,
            role: 'manager',
            is_active: true
        },
        {
            full_name: 'Regular Passenger',
            email: 'user@whoosh.id',
            phone: '+6281234567892',
            password_hash: hashedPassword,
            role: 'user',
            is_active: true
        }
    ]);
}
