/* eslint-disable @typescript-eslint/no-explicit-any */
// file: src/controllers/product.controller.ts

import { Request, Response } from 'express';
import { logger } from '../utils/logger.js';
import { prisma } from '../lib/prisma.js';
import { createProductValidation, updateProductValidation } from '../validations/product.validation.js';
import { ProductInput, ProductUpdateInput } from '../interfaces/product.interface.js'; 

// Tipe untuk hasil validasi (Diambil dari validation.ts)
type JoiError = any; 
type ValidationResult<T> = { error: JoiError | undefined; value: T | undefined; };

// --- 1. CREATE PRODUCT (POST) ---
export const createProduct = async (req: Request, res: Response) => {
    const { error, value } = createProductValidation(req.body) as ValidationResult<ProductInput>;

    if (error || !value) {
        logger.error({ validationError: error?.details[0] }, 'ERR: product - create - Input validation failed');
        return res.status(422).send({
            status: false,
            statusCode: 422,
            message: error?.details[0]?.message,
            data: {}
        });
    }

    try {
        const newProduct = await prisma.product.create({
            data: value,
        });

        logger.info({ productId: newProduct.id }, 'Success add new product');
        return res.status(201).send({
            status: true,
            statusCode: 201,
            message: 'Add product success',
            data: newProduct
        });

    } catch (e: any) {
        logger.error({ error: e.message, code: e.code, body: req.body }, 'ERR: product - create - Database Error');
        if (e.code === 'P2002') { 
            return res.status(409).send({ status: false, statusCode: 409, message: 'Product code already exists.', data: {} });
        }
        return res.status(500).send({ status: false, statusCode: 500, message: 'Internal server error.', data: {} });
    }
};

// --- 2. READ ALL PRODUCTS (GET /) ---
export const getProducts = async (req: Request, res: Response) => {
    try {
        const allProducts = await prisma.product.findMany({
            where: { deletedAt: null },
            include: { outlet: true, category: true, unit: true },
        });

        logger.info(`Success get all product data. Found ${allProducts.length} items.`);
        return res.status(200).send({ status: true, statusCode: 200, message: 'Success get all product data', data: allProducts });
    } catch (e: any) {
        logger.error({ error: e.message }, 'ERR: product - getProducts - Database Error');
        return res.status(500).send({ status: false, statusCode: 500, message: 'Internal server error.', data: {} });
    }
};

// --- 3. READ SINGLE PRODUCT (GET /:id) ---
export const getProduct = async (req: Request, res: Response) => {
const { id } = req.params;
    if (!id) {
        return res.status(400).send({ 
            status: false, 
            statusCode: 400, 
            message: 'Product ID is missing from the request path.', 
            data: {} 
        });
    }

    try {
       const product = await prisma.product.findFirst({ // ⬅️ UBAH KE findFirst
            where: { 
                id: id, 
                deletedAt: null 
            },
            include: { outlet: true, category: true, unit: true },
        });

        if (!product) {
            logger.info({ productId: id }, 'ERR: product - getProduct - Data not found');
            return res.status(404).send({ status: false, statusCode: 404, message: 'Product not found.', data: {} });
        }

        logger.info({ productId: id }, 'Success get product data');
        return res.status(200).send({ status: true, statusCode: 200, message: 'Success get product data', data: product });
    } catch (e: any) {
        logger.error({ error: e.message, params: req.params }, 'ERR: product - getProduct - Database Error');
        return res.status(500).send({ status: false, statusCode: 500, message: 'Internal server error.', data: {} });
    }
};

// --- 4. UPDATE PRODUCT (PATCH /:id) ---
export const updateProduct = async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
        return res.status(400).send({ 
            status: false, 
            statusCode: 400, 
            message: 'Product ID is missing from the request path.', 
            data: {} 
        });
    }
    const { error, value } = updateProductValidation(req.body) as ValidationResult<ProductUpdateInput>;

    if (error || !value) {
        logger.error({ validationError: error?.details[0] }, 'ERR: product - update - Input validation failed');
        return res.status(422).send({ status: false, statusCode: 422, message: error?.details[0]?.message, data: {} });
    }
    
    if (Object.keys(value).length === 0) {
        return res.status(400).send({ status: false, statusCode: 400, message: 'No fields provided for update.', data: {} });
    }

    try {
        const updatedProduct = await prisma.product.update({
            where: { id, deletedAt: null },
            data: value,
        });

        logger.info({ productId: updatedProduct.id }, 'Success update product');
        return res.status(200).send({ status: true, statusCode: 200, message: 'Update product success', data: updatedProduct });

    } catch (e: any) {
        logger.error({ error: e.message, id: id, body: req.body }, 'ERR: product - update - Database Error');
        if (e.code === 'P2025') { 
             return res.status(404).send({ status: false, statusCode: 404, message: 'Product not found for update.', data: {} });
        }
        return res.status(500).send({ status: false, statusCode: 500, message: 'Internal server error.', data: {} });
    }
};

// --- 5. DELETE PRODUCT (Soft Delete) (DELETE /:id) ---
export const deleteProduct = async (req: Request, res: Response) => {
    const { id } = req.params;
if (!id) {
        return res.status(400).send({ 
            status: false, 
            statusCode: 400, 
            message: 'Product ID is missing from the request path.', 
            data: {} 
        });
    }
    try {
        const deletedProduct = await prisma.product.update({
            where: { id, deletedAt: null },
            data: { deletedAt: new Date() },
        });

        logger.info({ productId: deletedProduct.id }, 'Success delete product (soft)');
        return res.status(200).send({ status: true, statusCode: 200, message: 'Delete product success (soft delete)', data: { id: deletedProduct.id } });

    } catch (e: any) {
        logger.error({ error: e.message, id: id }, 'ERR: product - delete - Database Error');
        if (e.code === 'P2025') { 
             return res.status(404).send({ status: false, statusCode: 404, message: 'Product not found for deletion.', data: {} });
        }
        return res.status(500).send({ status: false, statusCode: 500, message: 'Internal server error.', data: {} });
    }
};