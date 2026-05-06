import { Ticket, TicketValidation } from './types';
import { db } from '../../shared/db';

export interface TicketRepository {
  findById(id: string): Promise<Ticket | null>;
  update(id: string, data: Partial<Ticket>): Promise<void>;
  createValidation(data: Partial<TicketValidation>): Promise<void>;
  getBookingByTicketId(ticketId: string): Promise<any>;
}

export class TicketRepositoryImpl implements TicketRepository {
  async findById(id: string): Promise<Ticket | null> {
    return db('tickets').where({ ticket_id: id }).first() as unknown as Ticket | null;
  }

  async update(id: string, data: Partial<Ticket>): Promise<void> {
    await db('tickets').where({ ticket_id: id }).update(data);
  }

  async createValidation(data: Partial<TicketValidation>): Promise<void> {
    await db('ticket_validations').insert(data);
  }

  async getBookingByTicketId(ticketId: string): Promise<any> {
    return db('tickets')
      .join('bookings', 'tickets.booking_id', 'bookings.booking_id')
      .join('schedules', 'bookings.schedule_id', 'schedules.schedule_id')
      .join('booking_passengers', 'bookings.booking_id', 'booking_passengers.booking_id')
      .join('seats', 'booking_passengers.seat_id', 'seats.seat_id')
      .join('trains', 'schedules.train_id', 'trains.train_id')
      .join('stations as dep', 'schedules.departure_station', 'dep.station_id')
      .join('stations as arr', 'schedules.arrival_station', 'arr.station_id')
      .where('tickets.ticket_id', ticketId)
      .select(
        'tickets.*',
        'bookings.booking_code',
        'booking_passengers.full_name',
        'booking_passengers.id_number',
        'trains.train_name',
        'dep.station_name as departure_station_name',
        'arr.station_name as arrival_station_name',
        'schedules.departure_time',
        'schedules.arrival_time',
        'seats.seat_number',
        'seats.class'
      )
      .first();
  }
}
