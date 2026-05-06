/**
 * Logger Configuration
 * 
 * Centralized logging system using Winston
 * Logs are saved to files and console
 */

import winston from 'winston';
import path from 'path';

// Log directory
const LOG_DIR = process.env.LOG_DIR || 'logs';

// Custom format for logs
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    // Add metadata if exists
    if (Object.keys(meta).length > 0) {
      log += `\n${JSON.stringify(meta, null, 2)}`;
    }
    
    return log;
  })
);

// Create logger instance
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    // Console transport (for development)
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        logFormat
      )
    }),
    
    // File transport - All logs
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'combined.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    }),
    
    // File transport - Error logs only
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'error.log'),
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    }),
    
    // File transport - Server errors with reference codes
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'server-errors.log'),
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 10, // Keep more server error logs
    }),
  ],
});

/**
 * Log server error with reference code
 * This creates a structured log entry that can be searched by reference code
 */
export function logServerError(
  referenceCode: number,
  errorCode: string,
  message: string,
  details?: Record<string, unknown>,
  stack?: string
) {
  const logEntry = {
    referenceCode,
    errorCode,
    message,
    timestamp: new Date().toISOString(),
    details,
    stack,
  };

  // Log to console with formatting
  console.error('='.repeat(80));
  console.error(`🔴 SERVER ERROR - Reference Code: ${referenceCode}`);
  console.error('='.repeat(80));
  console.error(`Code: ${errorCode}`);
  console.error(`Message: ${message}`);
  if (details) {
    console.error(`Details:`, JSON.stringify(details, null, 2));
  }
  if (stack) {
    console.error(`Stack:`, stack);
  }
  console.error('='.repeat(80));

  // Log to file with structured format
  logger.error('SERVER_ERROR', logEntry);
}

/**
 * Log user error (for analytics/monitoring)
 */
export function logUserError(
  errorCode: string,
  message: string,
  statusCode: number,
  details?: Record<string, unknown>
) {
  logger.warn('USER_ERROR', {
    errorCode,
    message,
    statusCode,
    timestamp: new Date().toISOString(),
    details,
  });
}

/**
 * Log info message
 */
export function logInfo(message: string, meta?: Record<string, unknown>) {
  logger.info(message, meta);
}

/**
 * Log warning message
 */
export function logWarning(message: string, meta?: Record<string, unknown>) {
  logger.warn(message, meta);
}

/**
 * Log debug message
 */
export function logDebug(message: string, meta?: Record<string, unknown>) {
  logger.debug(message, meta);
}

// Export logger instance for direct use
export default logger;
