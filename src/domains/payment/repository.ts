import { Payment, CreatePayment } from './types';
import { db } from '../../shared/db';

/**
 * Payment repository interface
 */
export interface PaymentRepository {
  findById(paymentId: string): Promise<Payment | null>;
  findByBookingId(bookingId: string): Promise<Payment | null>;
  create(data: CreatePayment): Promise<string[]>;
  updateStatus(id: string, status: string): Promise<void>;
}

/**
 * Payment repository implementation
 */
export class PaymentRepositoryImpl implements PaymentRepository {
  async findById(paymentId: string): Promise<Payment | null> {
    return db('payments').where({ payment_id: paymentId }).first() as unknown as Payment | null;
  }

  async findByBookingId(bookingId: string): Promise<Payment | null> {
    return db('payments').where({ booking_id: bookingId }).first() as unknown as Payment | null;
  }

  async create(data: CreatePayment): Promise<string[]> {
    return db('payments').insert(data);
  }

  async updateStatus(id: string, status: string): Promise<void> {
    await db('payments').where({ payment_id: id }).update({ payment_status: status });
  }
}
