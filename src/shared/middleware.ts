import { Request, Response, NextFunction } from 'express';

import { AppError } from './error';
import { logServerError } from './logger';

/**
 * SECURITY: Safe error response that NEVER leaks sensitive information
 * - NO stack traces
 * - NO SQL queries
 * - NO internal paths
 * - NO database errors
 */
const sendSafeErrorResponse = (
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  referenceCode?: number,
  details?: Record<string, unknown>
) => {
  const response: Record<string, unknown> = {
    error: message,
    code,
    statusCode,
  };

  // Only include reference code for server errors (for support tracking)
  if (referenceCode !== undefined) {
    response.referenceCode = referenceCode;
  }

  // SECURITY: Only include safe details (no SQL, no stack traces, no internal info)
  if (details) {
    // Filter out sensitive keys (case-insensitive)
    const safeDetails: Record<string, unknown> = {};
    const sensitiveKeys = ['stack', 'sql', 'query', 'sqlmessage', 'sqlstate', 'errno', 'code'];
    
    for (const [key, value] of Object.entries(details)) {
      if (!sensitiveKeys.includes(key.toLowerCase())) {
        safeDetails[key] = value;
      }
    }
    
    if (Object.keys(safeDetails).length > 0) {
      response.details = safeDetails;
    }
  }

  res.status(statusCode).json(response);
};

/**
 * Error handling middleware
 * SECURITY: Catches all errors and returns safe, standardized responses
 * NEVER leaks: SQL queries, stack traces, internal paths, database errors
 */
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Handle our custom AppError
  if (err instanceof AppError) {
    // Log server errors (with full details for debugging)
    if (err.isServerError) {
      err.logError();
    }
    
    // Send safe response (filtered details, no sensitive info)
    sendSafeErrorResponse(
      res,
      err.statusCode,
      err.code,
      err.message,
      err.referenceCode,
      err.details
    );
    return;
  }

  // SECURITY: Handle unexpected errors (database errors, etc.)
  // Log full error details internally for debugging
  const referenceCode = 1300; // UNEXPECTED_ERROR
  logServerError(
    referenceCode,
    'UNEXPECTED_ERROR',
    'An unexpected error occurred',
    {
      errorName: err.name,
      errorMessage: err.message,
      // DO NOT log SQL or sensitive info to response, only to internal logs
    },
    err.stack
  );

  // SECURITY: Send generic message to client (NO details, NO stack trace, NO SQL)
  sendSafeErrorResponse(
    res,
    500,
    'INTERNAL_SERVER_ERROR',
    `Terjadi kesalahan internal. Silakan hubungi support dengan kode error: ${referenceCode}`,
    referenceCode
  );
};
