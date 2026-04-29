import { Request, Response, NextFunction } from 'express';

import { PaymentService } from './service';
import { AppError, ErrorCode } from '../../shared/error';

/**
 * Payment controller interface
 */
export interface PaymentController {
  create(request: Request, response: Response, next: NextFunction): Promise<void>;
  updateStatus(request: Request, response: Response, next: NextFunction): Promise<void>;
}

/**
 * Payment controller implementation
 */
export class PaymentControllerImpl implements PaymentController {
  constructor(private paymentService: PaymentService) {
    this.create = this.create.bind(this);
    this.updateStatus = this.updateStatus.bind(this);
  }

  async create(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const bookingId = request.params.bookingId;
      const paymentMethod = request.body.payment_method;
      const amount = request.body.amount;

      if (!paymentMethod || !amount) {
        throw new AppError('Payment method and amount are required', 400, ErrorCode.VALIDATION_ERROR);
      }

      const payment_id = await this.paymentService.create(bookingId, paymentMethod, amount);
      response.status(201).json({ payment_id });
    } catch (error) {
      if (error instanceof AppError) {
        response.status(error.statusCode).json({ error: error.message });
      } else {
        next(error);
      }
    }
  }

  async updateStatus(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const paymentId = request.params.paymentId;
      const status = request.body.payment_status;

      await this.paymentService.updateStatus(paymentId, status);
      response.json({ message: 'Payment status updated' });
    } catch (error) {
      if (error instanceof AppError) {
        response.status(error.statusCode).json({ error: error.message });
      } else {
        next(error);
      }
    }
  }
}
