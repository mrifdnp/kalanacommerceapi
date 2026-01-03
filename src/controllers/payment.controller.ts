/* eslint-disable @typescript-eslint/no-explicit-any */
import { Response, Request } from 'express';
import { prisma } from '../lib/prisma.js';
import { logger } from '../utils/logger.js';
import 'dotenv/config';

export const midtransWebhook = async (req: Request, res: Response) => {
    res.setHeader('bypass-tunnel-reminder', 'true');
    const { order_id: orderCode, transaction_status: transactionStatus, fraud_status: fraudStatus } = req.body;

    logger.info({ orderCode, transactionStatus }, "Menerima Notifikasi Midtrans");

    try {
        // 1. Cari order di awal untuk validasi
        const order = await prisma.order.findUnique({
            where: { orderCode },
            select: { id: true, status: true }
        });

        if (!order) return res.status(404).json({ message: "Order tidak ditemukan" });
        
        // Kalau sudah PAID, langsung kasih OK ke Midtrans supaya tidak kirim ulang
        if (order.status === "PAID") return res.status(200).send('OK');

        // 2. Handle status BERHASIL (settlement/capture)
        if (transactionStatus === 'settlement' || (transactionStatus === 'capture' && fraudStatus === 'accept')) {
            
            await prisma.$transaction(async (tx) => {
                // Update Status Order ke PAID
                await tx.order.update({
                    where: { orderCode },
                    data: { status: "PAID" }
                });

                // Ambil Item & Detail Produk
                const orderItems = await tx.orderItem.findMany({
                    where: { orderId: order.id },
                    include: {
                        variant: { select: { productId: true, qtyMultiplier: true } }
                    }
                });

                // Potong Stok Induk di tabel Product
                for (const item of orderItems) {
                    const totalReduce = item.quantity * item.variant.qtyMultiplier;
                    await tx.product.update({
                        where: { id: item.variant.productId },
                        data: { qty: { decrement: totalReduce } }
                    });
                }
            });

            logger.info({ orderCode }, "Status PAID & Stok Berhasil Dikurangi");

        } 
        // 3. Handle status GAGAL/EXPIRED
        else if (['cancel', 'deny', 'expire'].includes(transactionStatus)) {
            await prisma.order.update({
                where: { orderCode },
                data: { status: "CANCELLED" }
            });
            logger.info({ orderCode }, "Order dicancel/expired");
        }
        // 4. Handle status PENDING
        else if (transactionStatus === 'pending') {
            await prisma.order.update({
                where: { orderCode },
                data: { status: "PENDING" }
            });
        }

        return res.status(200).send('OK');

    } catch (e: any) {
        logger.error({ error: e.message, orderCode }, "ERR: Webhook Midtrans");
        return res.status(500).send("Internal Server Error");
    }
};