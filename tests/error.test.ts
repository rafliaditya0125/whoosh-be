import { AppError, UserErrorCode, ServerErrorCode } from '../src/shared/error';

describe('AppError', () => {
  it('should initialize with correct properties', () => {
    const error = new AppError('Test Error', 400, UserErrorCode.VALIDATION_ERROR);

    expect(error.message).toBe('Test Error');
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe(UserErrorCode.VALIDATION_ERROR);
    expect(error.name).toBe('AppError');
    expect(error.isServerError).toBe(false);
    expect(error.referenceCode).toBeUndefined();
  });

  it('should create server error with reference code', () => {
    const error = new AppError(
      'Server Error', 
      500, 
      ServerErrorCode.INTERNAL_SERVER_ERROR,
      undefined,
      true, // isServerError
      1300 // Numeric reference code
    );

    expect(error.message).toBe('Server Error');
    expect(error.statusCode).toBe(500);
    expect(error.code).toBe(ServerErrorCode.INTERNAL_SERVER_ERROR);
    expect(error.isServerError).toBe(true);
    expect(error.referenceCode).toBeDefined();
    expect(error.referenceCode).toBe(1300); // Numeric reference code
  });

  it('should not have reference code for user errors', () => {
    const error = new AppError(
      'User Error',
      400,
      UserErrorCode.VALIDATION_ERROR,
      undefined,
      false // isServerError
    );

    expect(error.isServerError).toBe(false);
    expect(error.referenceCode).toBeUndefined();
  });
});
