/* eslint-disable @typescript-eslint/no-explicit-any */
import { Response } from 'express';
import { logger } from '../utils/logger.js';
import { prisma } from '../lib/prisma.js';
import { addCartItemValidation } from '../validations/cart.validation.js';
import { AddCartItemInput } from '../interfaces/cart.interface.js';

// Asumsi ValidationResult dan JoiError didefinisikan atau diimpor
type JoiError = any; 
type ValidationResult<T> = { error: JoiError | undefined; value: T | undefined; };

export const addItemToCart = async (req: any, res: Response) => {
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

export const getCart = async (req:any, res: Response) => {
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

// --- UPDATE QUANTITY (PATCH /carts/items/:id) ---
export const updateCartItemQuantity = async (req: any, res: Response) => {
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

export const removeCartItem = async (req: any, res: Response) => {
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