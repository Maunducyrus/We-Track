import winston from 'winston';
import path from 'path';

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'securetrack-backend' },
  transports: [
    // Write all logs with importance level of `error` or less to `error.log`
    new winston.transports.File({ 
      filename: path.join(logsDir, 'error.log'), 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    
    // Write all logs with importance level of `info` or less to `combined.log`
    new winston.transports.File({ 
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),

    // Security audit log for sensitive operations
    new winston.transports.File({
      filename: path.join(logsDir, 'security.log'),
      level: 'warn',
      maxsize: 5242880, // 5MB
      maxFiles: 10
    })
  ]
});

// If we're not in production, log to the console as well
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Security audit logging
export const auditLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(logsDir, 'audit.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 20
    })
  ]
});

// Helper functions for different log types
export const logInfo = (message: string, meta?: any) => {
  logger.info(message, meta);
};

export const logError = (message: string, error?: Error, meta?: any) => {
  logger.error(message, { error: error?.stack, ...meta });
};

export const logWarn = (message: string, meta?: any) => {
  logger.warn(message, meta);
};

export const logDebug = (message: string, meta?: any) => {
  logger.debug(message, meta);
};

// Security audit logging
export const logSecurityEvent = (event: string, userId?: string, details?: any) => {
  auditLogger.info('Security Event', {
    event,
    userId,
    timestamp: new Date().toISOString(),
    ip: details?.ip,
    userAgent: details?.userAgent,
    details
  });
};

// Authentication logging
export const logAuth = (action: string, userId?: string, success: boolean = true, details?: any) => {
  const level = success ? 'info' : 'warn';
  auditLogger.log(level, 'Authentication Event', {
    action,
    userId,
    success,
    timestamp: new Date().toISOString(),
    ...details
  });
};

// Mobile tracking logging (highly sensitive)
export const logMobileTracking = (action: string, officerId: string, mobileNumber: string, requestType: string, success: boolean, details?: any) => {
  auditLogger.warn('Mobile Tracking Event', {
    action,
    officerId,
    mobileNumber: mobileNumber.replace(/(\+254)(\d{3})(\d{6})/, '$1$2****'), // Mask part of number
    requestType,
    success,
    timestamp: new Date().toISOString(),
    ...details
  });
};

export default logger;