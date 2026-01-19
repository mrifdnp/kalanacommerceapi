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

    // 2. Validasi userId WAJIB dicek di sini sebelum masuk try-catch
    // Ini yang akan menghilangkan error "string | undefined" di TypeScript
    if (!userId) {
        return res.status(401).send({ 
            status: false, 
            statusCode: 401, 
            message: 'User not authenticated.' 
        });
    }

    try {
        const order = await prisma.order.findFirst({
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
export const updateOrderStatus = async (req: AuthRequest, res: Response): Promise<Response> => {
    // Ambil orderId dari body
    const { orderId, status } = req.body;

    if (!orderId || !status) {
        return res.status(400).send({ 
            status: false, 
            message: 'Order ID dan Status wajib diisi.' 
        });
    }

    try {
        // TARGET: prisma.order (Bukan orderItem lagi)
        const updatedOrder = await prisma.order.update({
            where: { id: orderId },
            data: { 
                statusPickup: status // Pastikan kolom ini sudah dipindah ke model Order di schema.prisma
            }
        });

        return res.status(200).send({
            status: true,
            statusCode: 200,
            message: `Berhasil update status pesanan ${updatedOrder.orderCode} menjadi ${status}`,
            data: updatedOrder
        });

    } catch (e: unknown) {
        const error = e as Error;
        logger.error({ error: error.message, orderId }, 'ERR: updateOrderStatus');
        
        // Handle jika ID salah atau tidak ditemukan
        return res.status(500).send({ 
            status: false, 
            message: 'Internal server error atau ID Order tidak ditemukan.' 
        });
    }
};