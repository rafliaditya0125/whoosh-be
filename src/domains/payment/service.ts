import { PaymentRepository } from './repository';
import { Payment } from './types';
import { UserErrorHelper, ServerErrorHelper } from '../../shared/error';

/**
 * Payment service interface
 */
export interface PaymentService {
  getPaymentStatus(paymentId: string): Promise<Payment | null>;
  findByBookingId(bookingId: string): Promise<Payment | null>;
  create(bookingId: string, paymentMethod: string, amount: number): Promise<string>;
  updateStatus(paymentId: string, status: string): Promise<void>;
}

/**
 * Payment service implementation
 */
export class PaymentServiceImpl implements PaymentService {
  constructor(private paymentRepository: PaymentRepository) {}

  async getPaymentStatus(paymentId: string): Promise<Payment | null> {
    const payment = await this.paymentRepository.findById(paymentId);
    if (!payment) {
      throw UserErrorHelper.notFound('Payment', paymentId);
    }
    return payment;
  }

  async findByBookingId(bookingId: string): Promise<Payment | null> {
    const payment = await this.paymentRepository.findByBookingId(bookingId);
    if (!payment) {
      throw UserErrorHelper.notFound('Payment untuk booking', bookingId);
    }
    return payment;
  }

  async create(bookingId: string, paymentMethod: string, amount: number): Promise<string> {
    try {
      const [payment_id] = await this.paymentRepository.create({
        booking_id: bookingId,
        payment_method: paymentMethod,
        amount,
        payment_status: 'pending',
      });
      return payment_id;
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw ServerErrorHelper.databaseError('membuat payment', {
          operation: 'create_payment',
          booking_id: bookingId,
        });
      }
      throw error;
    }
  }

  async updateStatus(paymentId: string, status: string): Promise<void> {
    try {
      await this.paymentRepository.updateStatus(paymentId, status);
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw ServerErrorHelper.databaseError('update payment status', {
          operation: 'update_payment_status',
          payment_id: paymentId,
        });
      }
      throw error;
    }
  }
}
