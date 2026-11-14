import rateLimit from 'express-rate-limit';

// Global rate limiter for all APIs
const globalRateLimiter = rateLimit({
    max: Number(process.env.RATE_LIMIT_MAX || 10000),
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again after 15 minutes'
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    skipSuccessfulRequests: true,
    skipFailedRequests: false,
    // Let express-rate-limit handle IP detection automatically
    // It will use req.ip by default
    handler: (req, res, next, options) => {
        res.status(options.statusCode || 429).json(options.message);
    }
});

// More strict rate limiter for authentication endpoints
const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 requests per windowMs for auth endpoints
    message: {
        success: false,
        message: 'Too many authentication attempts, please try again after 15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Rate limiter for public APIs (more generous)
const publicRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 1000, // Limit each IP to 1000 requests per hour
    message: {
        success: false,
        message: 'Too many requests, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false
});

export { globalRateLimiter, authRateLimiter, publicRateLimiter };
