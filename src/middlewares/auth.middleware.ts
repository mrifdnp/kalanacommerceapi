import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger.js';

interface JwtPayload {
    id: string; 
    email: string;
    name: string;
}
export interface AuthRequest extends Request {
    userId?: string; 
    userPayload?: JwtPayload; // Opsional: untuk menyimpan seluruh payload
}


const JWT_SECRET = process.env.JWT_SECRET ?? 'fallback_secret_key';

/**
 * Middleware untuk memverifikasi token JWT.
 */
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
    // Cast req ke tipe yang diperluas untuk kemudahan penggunaan
    const authReq = req as AuthRequest;

    if (!JWT_SECRET) {
        logger.error('FATAL: JWT_SECRET environment variable is not set!');
        return res.status(500).send({
            status: false,
            statusCode: 500,
            message: 'Server configuration error: JWT secret is missing.',
        });
    }

    const authHeader = authReq.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
        logger.warn({ ip: authReq.ip }, 'ERR: Auth - Token missing or invalid format');
        return res.status(401).send({
            status: false,
            statusCode: 401,
            message: 'Access denied. Token is missing or improperly formatted.',
            data: {},
        });
    }

    // Mengambil token: logic Anda sudah benar
    const token = authHeader.split(' ')[1]!; 

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

        // ⬅️ LANGKAH KRUSIAL: Menyimpan ID dan Payload ke objek Request
        authReq.userId = decoded.id; 
        authReq.userPayload = decoded; 

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