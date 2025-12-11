/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from 'express';
import { logger } from '../utils/logger.js';
import { prisma } from '../lib/prisma.js';
import { addCartItemValidation } from '../validations/cart.validation.js';
import { AddCartItemInput } from '../interfaces/cart.interface.js';

// Asumsi ValidationResult dan JoiError didefinisikan atau diimpor
type JoiError = any; 
type ValidationResult<T> = { error: JoiError | undefined; value: T | undefined; };

// ⚠️ Perluasan Tipe Request untuk mendapatkan userId dari JWT
// Kita perlu membuat middleware JWT melampirkan data user ke req.user
interface AuthenticatedRequest extends Request {
    user?: { id: string; email: string; name: string }; 
}

// --- ADD ITEM TO CART (POST /carts/items) ---
export const addItemToCart = async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id; // ⬅️ Ambil userId dari payload JWT

    // 1. Validasi Input Body
    const { error, value } = addCartItemValidation(req.body) as ValidationResult<AddCartItemInput>;

    if (error || !value) {
        return res.status(422).send({ status: false, statusCode: 422, message: error?.details[0]?.message, data: {} });
    }
    
    const { productId, quantity } = value;

    if (!userId) {
        // Ini seharusnya ditangani oleh middleware JWT, tapi ini adalah cek safety
        return res.status(401).send({ status: false, statusCode: 401, message: 'User not authenticated.' });
    }

    try {
        // --- 2. Cari atau Buat Keranjang Utama (Cart) ---
        // Jika Cart belum ada untuk user ini, buatlah.
        const cart = await prisma.cart.upsert({
            where: { userId: userId },
            update: {}, // Tidak perlu update Cart jika sudah ada
            create: { userId: userId },
            select: { id: true }, // Hanya perlu ID Cart
        });
        
        const cartId = cart.id;

        // --- 3. Tambahkan atau Update Item di CartItem (UPSERT) ---
        const cartItem = await prisma.cartItem.upsert({
            where: {
                // Kunci unik gabungan
                cartId_productId: {
                    cartId: cartId,
                    productId: productId,
                },
            },
            update: {
                quantity: { increment: quantity }, // Jika sudah ada, tambahkan kuantitas
            },
            create: {
                cartId: cartId,
                productId: productId,
                quantity: quantity,
            },
            include: { product: { select: { name: true, price: true } } }
        });

        logger.info({ userId, productId, cartId }, `Item added/updated in cart.`);
        
        return res.status(200).send({
            status: true,
            statusCode: 200,
            message: 'Product added to cart successfully',
            data: cartItem,
        });

    } catch (e: any) {
        logger.error({ error: e.message, userId, productId }, 'ERR: cart - addItem - Database Error');
        
        // P2003: Foreign Key Constraint (Product ID atau Cart ID salah)
        if (e.code === 'P2003') { 
            return res.status(404).send({ status: false, statusCode: 404, message: 'Product not found.', data: {} });
        }
        return res.status(500).send({ status: false, statusCode: 500, message: 'Internal server error.', data: {} });
    }
};

export const getCart = async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
        return res.status(401).send({ status: false, statusCode: 401, message: 'User not authenticated.' });
    }

    try {
        const cart = await prisma.cart.findUnique({
            where: { userId: userId },
            // Mengambil semua item, termasuk detail produk
            include: {
                items: {
                    select: {
                        id: true,
                        quantity: true,
                        product: {
                            select: {
                                id: true,
                                name: true,
                                price: true, // Asumsi ini adalah price_1
                                productCode: true,
                                image: true,
                                unit: { select: { name: true } }
                            }
                        }
                    },
                    orderBy: {
                        createdAt: 'asc' // Urutkan berdasarkan waktu penambahan
                    }
                }
            }
        });

        // Jika cart belum pernah dibuat (null), kembalikan array kosong
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

export const updateCartItemQuantity = async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    const cartItemId = req.params.id; // ID dari CartItem
    const { quantity } = req.body; // Kuantitas baru

    if (!cartItemId) {
        return res.status(400).send({ 
            status: false, 
            statusCode: 400, 
            message: 'Cart Id is missing from the request path.', 
            data: {} 
        });
    }
    // ⚠️ TODO: Buat validasi Joi untuk memastikan 'quantity' adalah integer >= 1
    if (typeof quantity !== 'number' || quantity < 1) {
        return res.status(422).send({ status: false, statusCode: 422, message: 'Quantity must be a number greater than or equal to 1.' });
    }

    if (!userId) { return res.status(401).send({ status: false, statusCode: 401, message: 'User not authenticated.' }); }

    try {
        // 1. Cari CartItem dan verifikasi kepemilikan (melalui Cart)
        const updatedItem = await prisma.cartItem.update({
            where: {
                id: cartItemId,
                // Tambahkan validasi kepemilikan: CartItem harus dimiliki oleh Cart yang terikat dengan User ini
                cart: {
                    userId: userId
                }
            },
            data: {
                quantity: quantity, // Set kuantitas baru
            },
            include: { product: { select: { name: true } } }
        });

        logger.info({ userId, cartItemId }, `Updated cart item quantity to ${quantity}`);
        return res.status(200).send({
            status: true,
            statusCode: 200,
            message: 'Cart item quantity updated successfully',
            data: updatedItem,
        });

    } catch (e: any) {
        logger.error({ error: e.message, cartItemId }, 'ERR: cart - updateQuantity - Database Error');
        if (e.code === 'P2025') {
            return res.status(404).send({ status: false, statusCode: 404, message: 'Cart item not found or does not belong to user.', data: {} });
        }
        return res.status(500).send({ status: false, statusCode: 500, message: 'Internal server error.', data: {} });
    }
};

export const removeCartItem = async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
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