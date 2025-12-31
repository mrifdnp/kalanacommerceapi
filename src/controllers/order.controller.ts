import { Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { logger } from '../utils/logger.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';
// Import type dari Prisma Generated

export const getOrders = async (req: AuthRequest, res: Response): Promise<Response> => {
    const userId = req.userId;

    if (!userId) {
        return res.status(401).send({ 
            status: false, 
            statusCode: 401, 
            message: 'User not authenticated.' 
        });
    }

    try {
        // Menggunakan Prisma.OrderGetPayload untuk mendapatkan type include
        const orders = await prisma.order.findMany({
            where: { userId: userId },
            include: {
                outlet: { select: { name: true } },
                _count: { select: { items: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        return res.status(200).send({
            status: true,
            statusCode: 200,
            message: 'Berhasil mengambil riwayat pesanan',
            data: orders
        });
    } catch (e: unknown) {
        const error = e as Error;
        logger.error({ error: error.message, userId }, 'ERR: getOrders');
        return res.status(500).send({ 
            status: false, 
            statusCode: 500, 
            message: 'Internal server error.' 
        });
    }
};

// --- 2. GET ORDER DETAIL (SINGLE) ---
export const getOrderDetail = async (req: AuthRequest, res: Response): Promise<Response> => {
    const userId = req.userId;
    const orderId = req.params.id;

    if (!orderId) {
        return res.status(400).send({ status: false, message: 'Order ID is required.' });
    }

    try {
        const order = await prisma.order.findUnique({
            where: { 
                id: orderId,
                userId: userId 
            },
            include: {
                outlet: true,
                items: {
                    include: {
                        variant: {
                            include: {
                                product: { select: { name: true, image: true } },
                                unit: { select: { name: true } }
                            }
                        }
                    }
                }
            }
        });

        if (!order) {
            return res.status(404).send({ 
                status: false, 
                statusCode: 404, 
                message: 'Pesanan tidak ditemukan.' 
            });
        }

        return res.status(200).send({
            status: true,
            statusCode: 200,
            message: 'Berhasil mengambil detail pesanan',
            data: order
        });
    } catch (e: unknown) {
        const error = e as Error;
        logger.error({ error: error.message, orderId }, 'ERR: getOrderDetail');
        return res.status(500).send({ status: false, message: 'Internal server error.' });
    }
};