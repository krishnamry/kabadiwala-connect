"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const zod_1 = require("zod");
const errorHandler = (err, req, res, next) => {
    console.error('API Error:', err);
    if (err instanceof zod_1.ZodError) {
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
exports.errorHandler = errorHandler;
