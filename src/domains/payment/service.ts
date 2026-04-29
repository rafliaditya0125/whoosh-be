import { PaymentRepository } from './repository';
import { Payment } from './types';

/**
 * Payment service interface
 */
export interface PaymentService {
  findByBookingId(bookingId: string): Promise<Payment | null>;
  create(bookingId: string, paymentMethod: string, amount: number): Promise<string>;
  updateStatus(paymentId: string, status: string): Promise<void>;
}

/**
 * Payment service implementation
 */
export class PaymentServiceImpl implements PaymentService {
  constructor(private paymentRepository: PaymentRepository) {}

  async findByBookingId(bookingId: string): Promise<Payment | null> {
    return this.paymentRepository.findByBookingId(bookingId);
  }

  async create(bookingId: string, paymentMethod: string, amount: number): Promise<string> {
    const [payment_id] = await this.paymentRepository.create({
      booking_id: bookingId,
      payment_method: paymentMethod,
      amount,
      payment_status: 'pending',
    });
    return payment_id;
  }

  async updateStatus(paymentId: string, status: string): Promise<void> {
    await this.paymentRepository.updateStatus(paymentId, status);
  }
}
