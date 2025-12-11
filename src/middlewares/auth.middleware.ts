/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger.js';

interface JwtPayload {
    id: string;
    email: string;
    name: string;
}

const JWT_SECRET = process.env.JWT_SECRET ?? 'fallback_secret_key';

/**
 * Middleware untuk memverifikasi token JWT.
 */
export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
    if (!JWT_SECRET) {
        logger.error('FATAL: JWT_SECRET environment variable is not set!');
        return res.status(500).send({
            status: false,
            statusCode: 500,
            message: 'Server configuration error: JWT secret is missing.',
        });
    }

    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
        logger.warn({ ip: req.ip }, 'ERR: Auth - Token missing or invalid format');
        return res.status(401).send({
            status: false,
            statusCode: 401,
            message: 'Access denied. Token is missing or improperly formatted.',
            data: {},
        });
    }

    // after startsWith('Bearer '), token guaranteed exists
    const token = authHeader.split(' ')[1]!; // <-- Non-null assertion FIX

    try {
        // TS now knows JWT_SECRET is always string
        const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

        (req as any).user = decoded;

        logger.info({ userId: decoded.id }, 'Auth success');
        next();
    } catch (ex: unknown) {
        const errorMessage = ex instanceof Error ? ex.message : 'Unknown verification error';

        logger.error(
            { error: errorMessage, token_start: token.substring(0, 10) },
            'ERR: Auth - Invalid token'
        );

        return res.status(403).send({
            status: false,
            statusCode: 403,
            message: 'Invalid or expired token.',
            data: {},
        });
    }
};
