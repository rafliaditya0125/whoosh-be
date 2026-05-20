import type { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
    await knex('stations').del();
    await knex('stations').insert([
        { station_name: 'Halim', location: 'Jakarta', code: 'HLM' },
        { station_name: 'Karawang', location: 'Karawang', code: 'KWG' },
        { station_name: 'Padalarang', location: 'Bandung', code: 'PDL' },
        { station_name: 'Tegalluar', location: 'Bandung', code: 'TGL' },
    ]);
}
