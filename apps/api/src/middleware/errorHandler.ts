import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('API Error:', err);

  if (err instanceof ZodError) {
    const errorDetails = err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
    return res.status(400).json({
      success: false,
      error: `Validation error: ${errorDetails}`
    });
  }

  const statusCode = err.status || err.statusCode || 500;
  const isProd = process.env.NODE_ENV === 'production';
  // Avoid leaking database internal errors or stack traces to clients in production
  const message = (statusCode >= 500 && isProd)
    ? 'An internal server error occurred. Please try again later.'
    : (err.message || 'Error processing request');

  return res.status(statusCode).json({
    success: false,
    error: message
  });
};
