/* eslint-disable @typescript-eslint/no-explicit-any */
import { Response, Request } from 'express';
import { prisma } from '../lib/prisma.js';
import { logger } from '../utils/logger.js';
import 'dotenv/config';

export const midtransWebhook = async (req: Request, res: Response) => {
    res.setHeader('bypass-tunnel-reminder', 'true');
    const statusResponse = req.body;

    const orderCode = statusResponse.order_id;
    const transactionStatus = statusResponse.transaction_status;
    const fraudStatus = statusResponse.fraud_status;

    logger.info({ orderCode, transactionStatus }, "Menerima Notifikasi Midtrans");

    try {
        // Cari order berdasarkan orderCode
        const order = await prisma.order.findUnique({
            where: { orderCode: orderCode }
        });

        if (!order) {
            return res.status(404).json({ message: "Order tidak ditemukan" });
        }

        // LOGIC UPDATE STATUS
        if (transactionStatus === 'settlement' || transactionStatus === 'capture') {
            if (fraudStatus === 'accept' || !fraudStatus) {
                // Berhasil Bayar
                await prisma.order.update({
                    where: { orderCode: orderCode },
                    data: { status: "PAID" }
                });
                logger.info({ orderCode }, "Status Order diperbarui ke PAID");
            }
        } else if (transactionStatus === 'cancel' || transactionStatus === 'deny' || transactionStatus === 'expire') {
            // Gagal / Expired
            await prisma.order.update({
                where: { orderCode: orderCode },
                data: { status: "CANCELLED" }
            });
            logger.info({ orderCode }, "Status Order diperbarui ke CANCELLED");
        } else if (transactionStatus === 'pending') {
            await prisma.order.update({
                where: { orderCode: orderCode },
                data: { status: "PENDING" }
            });
        }

        // Midtrans butuh respon 200 OK supaya berhenti kirim notifikasi
        return res.status(200).send('OK');
    } catch (e: any) {
        logger.error({ error: e.message, orderCode }, "ERR: Webhook Midtrans");
        return res.status(500).send("Internal Server Error");
    }
};