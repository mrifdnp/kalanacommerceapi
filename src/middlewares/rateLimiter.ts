
import rateLimit from "express-rate-limit";


export const authLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 menit
    max: 100, // Maksimal 5 request per IP dalam 5 menit
    message: {
        status: false,
        statusCode: 429,
        message: 'Too many requests. Please try again after 5 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});