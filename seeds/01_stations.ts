import type { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
    await knex('stations').del();
    await knex('stations').insert([
        { station_name: 'Halim', city: 'Jakarta', code: 'HLM' },
        { station_name: 'Karawang', city: 'Karawang', code: 'KWG' },
        { station_name: 'Padalarang', city: 'Bandung', code: 'PDL' },
        { station_name: 'Tegalluar', city: 'Bandung', code: 'TGL' },
    ]);
}
