/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from 'express';
import { logger } from '../utils/logger.js';
import { prisma } from '../lib/prisma.js';
import { createCategoryValidation } from '../validations/category.validation.js';

// Asumsi CategoryInput/ValidationResult sudah didefinisikan
type JoiError = any;
interface CategoryInput { name: string, createdBy?: string; }
type ValidationResult<T> = { error: JoiError | undefined; value: T | undefined; };

// --- CREATE CATEGORY (POST) ---
export const createCategory = async (req: Request, res: Response) => {
    const { error, value } = createCategoryValidation(req.body) as ValidationResult<CategoryInput>;

    if (error || !value) {
        logger.error({ validationError: error?.details[0] }, 'ERR: category - create - Validation failed');
        return res.status(422).send({ status: false, statusCode: 422, message: error?.details[0]?.message, data: {} });
    }

    try {
        const newCategory = await prisma.category.create({
            data: value,
        });

        logger.info({ categoryId: newCategory.id }, 'Success create new category');
        return res.status(201).send({ status: true, statusCode: 201, message: 'Create category success', data: newCategory });

    } catch (e: any) {
        logger.error({ error: e.message, body: req.body }, 'ERR: category - create - Database Error');
        return res.status(500).send({ status: false, statusCode: 500, message: 'Internal server error.', data: {} });
    }
};

// --- READ ALL CATEGORIES (GET) ---
export const getCategories = async (req: Request, res: Response) => {
    try {
        const allCategories = await prisma.category.findMany({
            where: { deletedAt: null },
        });

        logger.info(`Found ${allCategories.length} categories.`);
        return res.status(200).send({ status: true, statusCode: 200, message: 'Success get all categories', data: allCategories });
    } catch (e: any) {
        logger.error({ error: e.message }, 'ERR: category - getAll');
        return res.status(500).send({ status: false, statusCode: 500, message: 'Internal server error.' });
    }
};

export const getCategoryById = async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
        return res.status(400).send({ status: false, statusCode: 400, message: 'Category ID is required.', data: null });
    }
    try {
        const category = await prisma.category.findUnique({
            where: { id: id, deletedAt: null },
            // Anda bisa menyertakan relasi products di sini jika diperlukan: include: { products: true }
        });

        if (!category) {
            logger.warn({ categoryId: id }, 'Category not found or deleted.');
            return res.status(404).send({
                status: false,
                statusCode: 404,
                message: `Category with ID ${id} not found.`,
                data: null
            });
        }

        logger.info({ categoryId: id }, 'Success get single category.');
        return res.status(200).send({ status: true, statusCode: 200, message: 'Success get category by ID', data: category });

    } catch (e: any) {
        // Menangani error jika ID bukan format UUID yang valid
        if (e.code === 'P2023') {
            return res.status(400).send({ status: false, statusCode: 400, message: 'Invalid ID format.' });
        }
        logger.error({ error: e.message, id }, 'ERR: category - getById');
        return res.status(500).send({ status: false, statusCode: 500, message: 'Internal server error.' });
    }
};