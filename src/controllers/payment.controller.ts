/* eslint-disable @typescript-eslint/no-explicit-any */
import { Response, Request } from 'express';
import { prisma } from '../lib/prisma.js';
import { logger } from '../utils/logger.js';
import 'dotenv/config';

export const midtransWebhook = async (req: Request, res: Response) => {
    res.setHeader('bypass-tunnel-reminder', 'true');
    const { order_id: paymentGroupId, transaction_status: transactionStatus, fraud_status: fraudStatus } = req.body;

    logger.info({ paymentGroupId, transactionStatus }, "Menerima Notifikasi Midtrans");

    try {
        // 1. Cari order di awal untuk validasi
        const orders = await prisma.order.findMany({
            where: { paymentGroupId: paymentGroupId},
            include: { 
                items: {
                    include: { variant: { select: { productId: true, qtyMultiplier: true } } }
                }
            }
        });

       if (orders.length === 0) return res.status(404).json({ message: "Grup order tidak ditemukan" });
        
        // Kalau sudah PAID, langsung kasih OK ke Midtrans supaya tidak kirim ulang
        if (orders[0]?.status === "PAID") return res.status(200).send('OK');

        // 2. Handle status BERHASIL (settlement/capture)
        if (transactionStatus === 'settlement' || (transactionStatus === 'capture' && fraudStatus === 'accept')) {
            
            await prisma.$transaction(async (tx) => {
                // Update Status Order ke PAID
                await tx.order.updateMany({
                    where: { paymentGroupId: paymentGroupId },
                    data: { status: "PAID" }
                });

                for (const order of orders) {
                    for (const item of order.items) {
                        const totalReduce = item.quantity * item.variant.qtyMultiplier;
                        await tx.product.update({
                            where: { id: item.variant.productId },
                            data: { qty: { decrement: totalReduce } }
                        });
                    }
                }
            });

            logger.info({ paymentGroupId }, "Status PAID & Stok Berhasil Dikurangi");

        } 
        // 3. Handle status GAGAL/EXPIRED
        else if (['cancel', 'deny', 'expire'].includes(transactionStatus)) {
            await prisma.order.updateMany({
                where: { paymentGroupId: paymentGroupId },
                data: { status: "CANCELLED" }
            });
        }
        // 4. Handle status PENDING
        else if (transactionStatus === 'pending') {
            await prisma.order.updateMany({
                where: { paymentGroupId: paymentGroupId },
                data: { status: "PENDING" }
            });
        }

        return res.status(200).send('OK');

    } catch (e: any) {
        logger.error({ error: e.message, paymentGroupId }, "ERR: Webhook Midtrans");
        return res.status(500).send("Internal Server Error");
    }
};