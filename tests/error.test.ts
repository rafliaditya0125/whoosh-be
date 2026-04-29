import { AppError, ErrorCode } from '../src/shared/error';

describe('AppError', () => {
  it('should initialize with correct properties', () => {
    const error = new AppError('Test Error', 400, ErrorCode.VALIDATION_ERROR);

    expect(error.message).toBe('Test Error');
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
    expect(error.name).toBe('AppError');
  });

  it('should have default statusCode and code', () => {
    const error = new AppError('Another Error');

    expect(error.message).toBe('Another Error');
    expect(error.statusCode).toBe(500);
    expect(error.code).toBe(ErrorCode.INTERNAL_ERROR);
  });
});
