import type { Knex } from 'knex';

const formatDateTime = (date: Date) => {
  return date.toISOString().slice(0, 19).replace('T', ' ');
};

export async function seed(knex: Knex): Promise<void> {
    // Deletes ALL existing entries
    await knex('schedules').del();

    // Get train and station IDs
    const trains = await knex('trains').select('train_id');
    const stations = await knex('stations').select('station_id', 'station_name');

    const halim = stations.find(s => s.station_name === 'Halim')?.station_id;
    const tegalluar = stations.find(s => s.station_name === 'Tegalluar')?.station_id;
    const padalarang = stations.find(s => s.station_name === 'Padalarang')?.station_id;

    if (!halim || !tegalluar || !padalarang || trains.length === 0) {
        console.error('Required data for schedules not found');
        return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const schedules = [];

    // Schedule for today and tomorrow
    for (let i = 0; i < 2; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);

        // Halim to Tegalluar
        const depTime1 = new Date(date);
        depTime1.setHours(8, 0, 0);
        const arrTime1 = new Date(date);
        arrTime1.setHours(8, 45, 0);

        schedules.push({
            train_id: trains[0].train_id,
            departure_station: halim,
            arrival_station: tegalluar,
            departure_time: formatDateTime(depTime1),
            arrival_time: formatDateTime(arrTime1),
            price: 150000,
            price_business: 200000,
            price_vip: 350000,
            status: 'active'
        });

        // Tegalluar to Halim
        const depTime2 = new Date(date);
        depTime2.setHours(10, 0, 0);
        const arrTime2 = new Date(date);
        arrTime2.setHours(10, 45, 0);

        schedules.push({
            train_id: trains[1].train_id,
            departure_station: tegalluar,
            arrival_station: halim,
            departure_time: formatDateTime(depTime2),
            arrival_time: formatDateTime(arrTime2),
            price: 150000,
            price_business: 200000,
            price_vip: 350000,
            status: 'active'
        });

        // Halim to Padalarang
        const depTime3 = new Date(date);
        depTime3.setHours(13, 0, 0);
        const arrTime3 = new Date(date);
        arrTime3.setHours(13, 30, 0);

        schedules.push({
            train_id: trains[2].train_id,
            departure_station: halim,
            arrival_station: padalarang,
            departure_time: formatDateTime(depTime3),
            arrival_time: formatDateTime(arrTime3),
            price: 120000,
            price_business: 180000,
            price_vip: 300000,
            status: 'active'
        });
    }

    // Inserts seed entries
    await knex('schedules').insert(schedules);
}
