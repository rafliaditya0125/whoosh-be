import { PaymentServiceImpl } from '../src/domains/payment/service';
import { PaymentRepository } from '../src/domains/payment/repository';

describe('PaymentService', () => {
  let paymentService: PaymentServiceImpl;
  let mockPaymentRepository: jest.Mocked<PaymentRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPaymentRepository = {
      findByBookingId: jest.fn(),
      create: jest.fn(),
      updateStatus: jest.fn(),
    } as any;
    paymentService = new PaymentServiceImpl(mockPaymentRepository);
  });

  describe('create', () => {
    it('should create a payment successfully', async () => {
      mockPaymentRepository.create.mockResolvedValue(['pay-1']);

      const result = await paymentService.create('book-1', 'credit_card', 500000);

      expect(result).toBe('pay-1');
      expect(mockPaymentRepository.create).toHaveBeenCalledWith({
        booking_id: 'book-1',
        payment_method: 'credit_card',
        amount: 500000,
        payment_status: 'pending',
      });
    });

    // Extreme case: Large amount
    it('should handle large payment amounts', async () => {
        mockPaymentRepository.create.mockResolvedValue(['pay-huge']);
        const largeAmount = 999999999;
        const result = await paymentService.create('book-1', 'bank_transfer', largeAmount);
        expect(result).toBe('pay-huge');
        expect(mockPaymentRepository.create).toHaveBeenCalledWith(expect.objectContaining({
            amount: largeAmount
        }));
    });
  });

  describe('updateStatus', () => {
    it('should update payment status', async () => {
      mockPaymentRepository.updateStatus.mockResolvedValue(undefined);

      await paymentService.updateStatus('pay-1', 'paid');

      expect(mockPaymentRepository.updateStatus).toHaveBeenCalledWith('pay-1', 'paid');
    });
  });

  describe('findByBookingId', () => {
    it('should return payment details', async () => {
      const mockPayment = {
        payment_id: 'pay-1',
        booking_id: 'book-1',
        payment_status: 'pending'
      };
      mockPaymentRepository.findByBookingId.mockResolvedValue(mockPayment as any);

      const result = await paymentService.findByBookingId('book-1');

      expect(result).toEqual(mockPayment);
    });
  });
});
