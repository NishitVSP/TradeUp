import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
    }),
  ],
});

let errorLogCount = 0;
const MAX_ERROR_LOGS = 2;

/**
 * Logs a message and error up to MAX_ERROR_LOGS times globally.
 * @param msg - Custom error message
 * @param error - Error object or value to be logged
 */
export function logErrorMaxTwoTimes(msg: string, error: unknown): void {
  if (errorLogCount >= MAX_ERROR_LOGS) return;

  logger.error(msg, error);
  errorLogCount++;
}
