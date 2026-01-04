/* eslint-disable @typescript-eslint/no-explicit-any */
import { Response } from 'express';
import { logger } from '../utils/logger.js';
import { prisma } from '../lib/prisma.js';
import { addCartItemValidation, checkoutValidation } from '../validations/cart.validation.js';
import { AddCartItemInput } from '../interfaces/cart.interface.js';
import midtransClient from 'midtrans-client';
import { AuthRequest } from '../middlewares/auth.middleware.js';

// Asumsi ValidationResult dan JoiError didefinisikan atau diimpor
type JoiError = any;
type ValidationResult<T> = { error: JoiError | undefined; value: T | undefined; };

export const addItemToCart = async (req: AuthRequest, res: Response) => {
    const userId = req.userId;

    const { error, value } = addCartItemValidation(req.body) as ValidationResult<AddCartItemInput>;

    if (error || !value) {
        return res.status(422).send({ status: false, statusCode: 422, message: error?.details[0]?.message, data: {} });
    }

    // Ambil productVariantId dari value (Pastikan di Joi sudah diganti juga menjadi productVariantId)
    const { productVariantId, quantity } = value as any;

    if (!userId) {
        return res.status(401).send({ status: false, statusCode: 401, message: 'User not authenticated.' });
    }

    try {
        const cart = await prisma.cart.upsert({
            where: { userId: userId },
            update: {},
            create: { userId: userId },
            select: { id: true },
        });

        const cartId = cart.id;

        const cartItem = await prisma.cartItem.upsert({
            where: {
                cartId_productVariantId: {
                    cartId: cartId,
                    productVariantId: productVariantId,
                },
            },
            update: {
                quantity: { increment: quantity },
            },
            create: {
                cartId: cartId,
                productVariantId: productVariantId,
                quantity: quantity,
            },
            include: {
                variant: {
                    include: {
                        product: { select: { name: true } },
                        unit: { select: { name: true } }
                    }
                }
            }
        });

        logger.info({ userId, productVariantId, cartId }, `Item variant added/updated in cart.`);

        return res.status(200).send({
            status: true,
            statusCode: 200,
            message: 'Product variant added to cart successfully',
            data: cartItem,
        });

    } catch (e: any) {
        logger.error({ error: e.message, userId, productVariantId }, 'ERR: cart - addItem - Database Error');
        if (e.code === 'P2003') {
            return res.status(404).send({ status: false, statusCode: 404, message: 'Product variant not found.', data: {} });
        }
        return res.status(500).send({ status: false, statusCode: 500, message: 'Internal server error.', data: {} });
    }
};

export const getCart = async (req: AuthRequest, res: Response) => {
    const userId = req.userId;

    if (!userId) {
        return res.status(401).send({ status: false, statusCode: 401, message: 'User not authenticated.' });
    }

    try {
        const cart = await prisma.cart.findUnique({
            where: { userId: userId },
            include: {
                items: {
                    select: {
                        id: true,
                        quantity: true,
                        variant: {
                            select: {
                                id: true,
                                variantName: true,
                                price: true,
                                product: {
                                    select: {
                                        id: true,
                                        name: true,
                                        productCode: true,
                                        image: true,
                                    }
                                },
                                unit: { select: { name: true } }
                            }
                        }
                    },
                    orderBy: { createdAt: 'asc' }
                }
            }
        });

        const cartItems = cart?.items || [];

        logger.info({ userId, itemCount: cartItems.length }, 'Success retrieved cart items.');

        return res.status(200).send({
            status: true,
            statusCode: 200,
            message: 'Success retrieved cart items',
            data: {
                cartId: cart?.id,
                items: cartItems
            }
        });

    } catch (e: any) {
        logger.error({ error: e.message, userId }, 'ERR: cart - getCart - Database Error');
        return res.status(500).send({ status: false, statusCode: 500, message: 'Internal server error.', data: {} });
    }
};

export const updateCartItemQuantity = async (req: AuthRequest, res: Response) => {
    const userId = req.userId;
    const cartItemId = req.params.id;
    const { quantity } = req.body;

    if (!cartItemId) {
        return res.status(400).send({ status: false, statusCode: 400, message: 'Cart Item Id is missing.', data: {} });
    }

    if (typeof quantity !== 'number' || quantity < 1) {
        return res.status(422).send({ status: false, statusCode: 422, message: 'Quantity must be >= 1.' });
    }

    if (!userId) return res.status(401).send({ status: false, statusCode: 401, message: 'User not authenticated.' });

    try {
        const updatedItem = await prisma.cartItem.update({
            where: {
                id: cartItemId,
                cart: { userId: userId }
            },
            data: { quantity: quantity },
            include: {
                variant: {
                    include: { product: { select: { name: true } } }
                }
            }
        });

        return res.status(200).send({
            status: true,
            statusCode: 200,
            message: 'Quantity updated successfully',
            data: updatedItem,
        });

    } catch (e: any) {
        logger.error({ error: e.message, cartItemId }, 'ERR: cart - updateQuantity');
        return res.status(500).send({ status: false, statusCode: 500, message: 'Internal server error.' });
    }
};

export const removeCartItem = async (req: AuthRequest, res: Response) => {
    const userId = req.userId;
    const cartItemId = req.params.id;

    if (!userId) { return res.status(401).send({ status: false, statusCode: 401, message: 'User not authenticated.' }); }
    if (!cartItemId) {
        return res.status(400).send({
            status: false,
            statusCode: 400,
            message: 'Cart Id is missing from the request path.',
            data: {}
        });
    }
    try {
        // 1. Hapus CartItem berdasarkan ID dan verifikasi kepemilikan
        const deletedItem = await prisma.cartItem.delete({
            where: {
                id: cartItemId,
                // Verifikasi kepemilikan sebelum menghapus
                cart: {
                    userId: userId
                }
            }
        });

        logger.info({ userId, cartItemId }, `Cart item removed successfully.`);
        return res.status(200).send({
            status: true,
            statusCode: 200,
            message: 'Cart item removed successfully',
            data: { id: deletedItem.id },
        });

    } catch (e: any) {
        logger.error({ error: e.message, cartItemId }, 'ERR: cart - removeItem - Database Error');
        if (e.code === 'P2025') {
            return res.status(404).send({ status: false, statusCode: 404, message: 'Cart item not found or does not belong to user.', data: {} });
        }
        return res.status(500).send({ status: false, statusCode: 500, message: 'Internal server error.', data: {} });
    }
};

const snap = new midtransClient.Snap({
    isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
    serverKey: process.env.MIDTRANS_SERVER_KEY
});

export const checkout = async (req: any, res: Response) => {
    const userId = req.userId;

    // VALIDASI INPUT (Menggunakan Joi yang kita buat tadi)
    const { error: validationError, value } = checkoutValidation(req.body);
    if (validationError) {
        return res.status(422).send({ status: false, statusCode: 422, message: validationError.details?.[0]?.message });
    }

    // Pakai value dari Joi agar 'paymentMethod' dianggap terpakai
    const { cartItemIds } = value;

    try {
        const result = await prisma.$transaction(async (tx) => {
            const cartItems = await tx.cartItem.findMany({
                where: { id: { in: cartItemIds }, cart: { userId: userId } },
                include: {
                    variant: { include: { product: true } },
                    cart: { include: { user: true } }
                }
            });

            if (cartItems.length === 0) throw new Error("Item tidak ditemukan.");

            // 1. Grouping Item per Outlet
            const groupedByOutlet: Record<string, typeof cartItems> = {};
            cartItems.forEach(item => {
                const oid = item.variant.product.outletId!;
                if (!groupedByOutlet[oid]) groupedByOutlet[oid] = [];
                groupedByOutlet[oid].push(item);
            });

            // 2. Hitung TOTAL GABUNGAN untuk Midtrans
            const totalGabungan = cartItems.reduce((acc, item) => acc + (Number(item.variant.price) * item.quantity), 0);
            const paymentGroupId = `PAY-${Date.now()}`;
            
            const customerName = cartItems[0]?.cart?.user?.name || 'Customer';
            const customerEmail = cartItems[0]?.cart?.user?.email || '';

            // 3. Buat SATU Transaksi Midtrans untuk semua outlet
            const parameter = {
                transaction_details: {
                    order_id: paymentGroupId, // Ini yang dikirim ke Midtrans
                    gross_amount: totalGabungan
                },
                customer_details: {
                    first_name: customerName,
                    email: customerEmail,
                },
                enabled_payments: ["gopay", "shopeepay", "qris"],
                
            };

            const midtransTx = await snap.createTransaction(parameter);

            const finalOrders = [];

            // 4. Simpan Invoice Terpisah per Outlet (Menggunakan satu Token yang sama)
            for (const [outletId, items] of Object.entries(groupedByOutlet)) {
                const totalPerOutlet = items.reduce((acc, item) => acc + (Number(item.variant.price) * item.quantity), 0);
                const orderCode = `INV-${outletId.substring(0, 3).toUpperCase()}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
                
                const newOrder = await tx.order.create({
                    data: {
                        userId,
                        outletId,
                        orderCode, // Invoice unik per outlet
                        paymentGroupId, // Pengikat agar Webhook bisa update barengan
                        totalAmount: totalPerOutlet,
                        netAmount: totalPerOutlet,
                        paymentMethod: "MIDTRANS_QRIS",
                        snapToken: midtransTx.token,
                        snapRedirectUrl: midtransTx.redirect_url,
                        items: {
                            create: items.map(item => ({
                                productVariantId: item.productVariantId,
                                quantity: item.quantity,
                                priceAtPurchase: item.variant.price,
                                subtotal: Number(item.variant.price) * item.quantity
                            }))
                        }
                    }
                });
                finalOrders.push(newOrder);
            }

            // 5. Bersihkan Keranjang
            await tx.cartItem.deleteMany({ where: { id: { in: cartItemIds } } });

            return finalOrders;
        });

        return res.status(201).json({
            status: true,
            message: "Pesanan berhasil dibuat.",
            data: result
        });

    } catch (e: any) {
        logger.error({ error: e.message, userId }, 'ERR: checkout');
        return res.status(500).json({ status: false, message: e.message });
    }
};

export const buyNowCheckout = async (req: AuthRequest, res: Response) => {
    const userId = req.userId;
    const { items } = req.body;

    if (!userId) {
        return res.status(401).send({
            status: false,
            statusCode: 401,
            message: 'Unauthorized'
        });
    }

    if (!Array.isArray(items) || items.length === 0) {
        return res.status(422).send({
            status: false,
            statusCode: 422,
            message: 'Items tidak boleh kosong'
        });
    }

    try {
        const result = await prisma.$transaction(async (tx) => {

            // 1. Ambil semua variant
            const variantIds = items.map(i => i.productVariantId);

            const variants = await tx.productVariant.findMany({
                where: { id: { in: variantIds } },
                include: { product: true }
            });

            if (variants.length === 0) {
                throw new Error('Produk tidak ditemukan');
            }

            const user = await tx.user.findUnique({ where: { id: userId } });

            // 2. Gabungkan data item + variant
            const enrichedItems = items.map(item => {
                const variant = variants.find(v => v.id === item.productVariantId);
                if (!variant) throw new Error('Variant tidak valid');

                return {
                    variant,
                    quantity: item.quantity
                };
            });

            // 3. Group per outlet
            const groupedByOutlet: Record<string, typeof enrichedItems> = {};
            enrichedItems.forEach(item => {
                const outletId = item.variant.product.outletId!;
                if (!groupedByOutlet[outletId]) groupedByOutlet[outletId] = [];
                groupedByOutlet[outletId].push(item);
            });

            // 4. Hitung total gabungan
            const totalGabungan = enrichedItems.reduce(
                (acc, item) => acc + (Number(item.variant.price) * item.quantity),
                0
            );

            const paymentGroupId = `BUY-NOW-${Date.now()}`;

            // 5. Midtrans Transaction
            const midtransTx = await snap.createTransaction({
                transaction_details: {
                    order_id: paymentGroupId,
                    gross_amount: totalGabungan
                },
                customer_details: {
                    first_name: user?.name || 'Customer',
                    email: user?.email || ''
                },
                enabled_payments: ['gopay', 'shopeepay', 'qris']
            });

            const orders = [];

            // 6. Simpan Order per Outlet
            for (const [outletId, outletItems] of Object.entries(groupedByOutlet)) {

                const totalPerOutlet = outletItems.reduce(
                    (acc, item) => acc + (Number(item.variant.price) * item.quantity),
                    0
                );

                const orderCode = `INV-BN-${outletId.substring(0, 3).toUpperCase()}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

                const order = await tx.order.create({
                    data: {
                        userId,
                        outletId,
                        orderCode,
                        paymentGroupId,
                        totalAmount: totalPerOutlet,
                        netAmount: totalPerOutlet,
                        paymentMethod: 'MIDTRANS_QRIS',
                        snapToken: midtransTx.token,
                        snapRedirectUrl: midtransTx.redirect_url,
                        items: {
                            create: outletItems.map(item => ({
                                productVariantId: item.variant.id,
                                quantity: item.quantity,
                                priceAtPurchase: item.variant.price,
                                subtotal: Number(item.variant.price) * item.quantity
                            }))
                        }
                    }
                });

                orders.push(order);
            }

            return orders;
        });

        return res.status(201).json({
            status: true,
            message: 'Buy Now checkout berhasil',
            data: result
        });

    } catch (e: any) {
        logger.error({ error: e.message, userId }, 'ERR: buy-now-checkout-multi');
        return res.status(500).json({
            status: false,
            message: e.message
        });
    }
};
