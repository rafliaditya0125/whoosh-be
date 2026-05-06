import { Request, Response, NextFunction } from 'express';

import { PaymentService } from './service';
import { AppError, ErrorCode } from '../../shared/error';

/**
 * Payment controller interface
 */
export interface PaymentController {
  create(request: Request, response: Response, next: NextFunction): Promise<void>;
  getStatus(request: Request, response: Response, next: NextFunction): Promise<void>;
  updateStatus(request: Request, response: Response, next: NextFunction): Promise<void>;
}

/**
 * Payment controller implementation
 */
export class PaymentControllerImpl implements PaymentController {
  constructor(private paymentService: PaymentService) {
    this.create = this.create.bind(this);
    this.getStatus = this.getStatus.bind(this);
    this.updateStatus = this.updateStatus.bind(this);
  }

  async create(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const bookingId = request.params.bookingId as string;
      
      // Support both payment_method and payment_method_id (mobile uses payment_method_id)
      const paymentMethod = (request.body.payment_method_id || request.body.payment_method) as string;
      const amount = request.body.amount as number;
      const channelCode = request.body.channel_code as string | undefined;

      if (!paymentMethod || !amount) {
        throw new AppError('Payment method and amount are required', 400, ErrorCode.VALIDATION_ERROR);
      }

      const payment_id = await this.paymentService.create(bookingId, paymentMethod, amount);
      
      // Return response compatible with mobile expectations
      response.status(201).json({ 
        payment_id,
        booking_id: bookingId,
        status: 'pending',
        amount,
        payment_method: paymentMethod,
        channel_code: channelCode,
      });
    } catch (error) {
      next(error); // Let error handler middleware handle all errors
    }
  }

  async getStatus(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const paymentId = request.params.paymentId as string;
      const payment = await this.paymentService.getPaymentStatus(paymentId);

      if (!payment) {
        throw new AppError('Payment not found', 404, ErrorCode.NOT_FOUND);
      }

      response.json({
        payment_id: payment.payment_id,
        booking_id: payment.booking_id,
        status: payment.payment_status,
        amount: payment.amount,
        payment_method: payment.payment_method,
        created_at: payment.created_at,
        updated_at: payment.updated_at,
      });
    } catch (error) {
      next(error); // Let error handler middleware handle all errors
    }
  }

  async updateStatus(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const paymentId = request.params.paymentId as string;
      const status = request.body.payment_status as string;

      await this.paymentService.updateStatus(paymentId, status);
      response.json({ message: 'Payment status updated' });
    } catch (error) {
      next(error); // Let error handler middleware handle all errors
    }
  }
}
