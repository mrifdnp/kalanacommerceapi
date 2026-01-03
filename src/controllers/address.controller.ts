import { PrismaClientKnownRequestError } from "@prisma/client/runtime/wasm-compiler-edge";
import { AddressUpdateInput, UserAddressInput } from "../interfaces/user.interface.js";
import { prisma } from "../lib/prisma.js";
import { AuthRequest } from "../middlewares/auth.middleware.js";
import { logger } from "../utils/logger.js";
import { createAddressValidation, updateAddressValidation } from "../validations/address.validation.js";
import { Response } from 'express';
import { ValidationError } from 'joi';

type ValidationResult<T> = { error: ValidationError | undefined; value: T | undefined; };


// --- 1. CREATE ADDRESS (POST /api/addresses) ---
export const createAddress = async (req: AuthRequest, res: Response) => {
    const userId = req.userId;
    const { error, value } = createAddressValidation(req.body) as ValidationResult<UserAddressInput>;

    if (!userId) {
        return res.status(401).send({ status: false, statusCode: 401, message: 'Unauthorized.' });
    }
    if (error || !value) {
        logger.error({ validationError: error?.details[0] }, 'ERR: address - create - Validation failed');
        return res.status(422).send({ status: false, statusCode: 422, message: error?.details[0]?.message, data: {} });
    }

    // Tambahkan userId dan createdBy
    const dataWithUser = {
        ...value,
        userId: userId,
        };

    try {
        const newAddress = await prisma.userAddress.create({
            data: dataWithUser,
        });

        logger.info({ addressId: newAddress.id, userId }, 'Success create new address');
        return res.status(201).send({ status: true, statusCode: 201, message: 'Create address success', data: newAddress });

    } catch (e) {
        const error = e as PrismaClientKnownRequestError;
        // Menangani error relasi (Foreign Key) jika ID wilayah tidak ditemukan
        if (error.code === 'P2003') {
             return res.status(404).send({ status: false, statusCode: 404, message: 'Referenced Geo ID (City/Province) not found.', data: {} });
        }
        logger.error({ error: error.message, userId, body: req.body }, 'ERR: address - create - Database Error');
        return res.status(500).send({ status: false, statusCode: 500, message: 'Internal server error.', data: {} });
    }
};

// --- 2. READ ALL ADDRESSES (GET /api/addresses) ---
export const getUserAddresses = async (req: AuthRequest, res: Response) => {
    const userId = req.userId;

    if (!userId) {
        return res.status(401).send({ status: false, statusCode: 401, message: 'Unauthorized.' });
    }

    try {
        const allAddresses = await prisma.userAddress.findMany({
            where: { userId: userId, deletedAt: null },
            orderBy: { isDefault: 'desc' } // Default address di atas
        });
        
        logger.info({ userId, count: allAddresses.length }, `Found ${allAddresses.length} user addresses.`);
        return res.status(200).send({ status: true, statusCode: 200, message: 'Success get all user addresses', data: allAddresses });
    } catch (e) {
        const error = e as PrismaClientKnownRequestError;

        logger.error({ error: error.message, userId }, 'ERR: address - getAll');
        return res.status(500).send({ status: false, statusCode: 500, message: 'Internal server error.' });
    }
};

// --- 3. READ ADDRESS BY ID (GET /api/addresses/:id) ---
export const getAddressById = async (req: AuthRequest, res: Response) => {
    const userId = req.userId;
    const { id } = req.params;

    if (!userId) {
        return res.status(401).send({ status: false, statusCode: 401, message: 'Unauthorized.' });
    }
    if (!id) {
        return res.status(400).send({ status: false, statusCode: 400, message: 'Address ID is required.', data: null });
    }

    try {
        const address = await prisma.userAddress.findFirst({
            where: { id: id, userId: userId, deletedAt: null }, // HARUS milik user ini
        });

        if (!address) {
            logger.warn({ addressId: id, userId }, 'Address not found, deleted, or does not belong to user.');
            return res.status(404).send({ 
                status: false, 
                statusCode: 404, 
                message: `Address with ID ${id} not found.`,
                data: null
            });
        }
        
        logger.info({ addressId: id, userId }, 'Success get single address.');
        return res.status(200).send({ status: true, statusCode: 200, message: 'Success get address by ID', data: address });

    } catch (e) {
                const error = e as PrismaClientKnownRequestError;

        if (error.code === 'P2023') { 
             return res.status(400).send({ status: false, statusCode: 400, message: 'Invalid ID format.' });
        }
        logger.error({ error: error.message, id, userId }, 'ERR: address - getById');
        return res.status(500).send({ status: false, statusCode: 500, message: 'Internal server error.' });
    }
};

// --- 4. UPDATE ADDRESS (PUT/PATCH /api/addresses/:id) ---
export const updateAddress = async (req: AuthRequest, res: Response) => {
    const userId = req.userId;
    const { id } = req.params;
    
    const { error, value } = updateAddressValidation(req.body) as ValidationResult<AddressUpdateInput>;

    if (!userId) {
        return res.status(401).send({ status: false, statusCode: 401, message: 'Unauthorized.' });
    }
    if (!id) {
        return res.status(400).send({ status: false, statusCode: 400, message: 'Address ID is required.', data: null });
    }
    if (error || !value) {
        logger.error({ validationError: error?.details[0] }, 'ERR: address - update - Validation failed');
        return res.status(422).send({ status: false, statusCode: 422, message: error?.details[0]?.message, data: {} });
    }
    if (Object.keys(value).length === 0) {
        return res.status(400).send({ status: false, statusCode: 400, message: 'No data provided for update.', data: {} });
    }
    
    // Tambahkan updatedBy ke data
    const updateData = { ...value, updatedBy: userId };

    try {
        const updatedAddress = await prisma.userAddress.update({
            // Kriteria harus mencakup ID dan userId untuk keamanan!
            where: { id: id, userId: userId, deletedAt: null }, 
            data: updateData,
        });

        logger.info({ addressId: updatedAddress.id, userId }, 'Success update address');
        return res.status(200).send({ status: true, statusCode: 200, message: 'Update address success', data: updatedAddress });

    } catch (e) {
                const error = e as PrismaClientKnownRequestError;

        if (error.code === 'P2025') {
            // Error jika Address tidak ditemukan atau tidak milik user (P2025: Record to update not found)
            return res.status(404).send({ status: false, statusCode: 404, message: `Address with ID ${id} not found or does not belong to user.`, data: {} });
        }
        if (error.code === 'P2003') {
             return res.status(404).send({ status: false, statusCode: 404, message: 'Referenced Geo ID not found.', data: {} });
        }
        logger.error({ error: error.message, id, userId, body: req.body }, 'ERR: address - update - Database Error');
        return res.status(500).send({ status: false, statusCode: 500, message: 'Internal server error.', data: {} });
    }
};

// --- 5. DELETE ADDRESS (SOFT DELETE) (DELETE /api/addresses/:id) ---
export const deleteAddress = async (req: AuthRequest, res: Response) => {
    const userId = req.userId;
    const { id } = req.params;
    
    if (!userId) {
        return res.status(401).send({ status: false, statusCode: 401, message: 'Unauthorized.' });
    }
    if (!id) {
        return res.status(400).send({ status: false, statusCode: 400, message: 'Address ID is required.', data: null });
    }

    try {
        const deletedAddress = await prisma.userAddress.update({
            // Kriteria harus mencakup ID dan userId untuk keamanan!
            where: { id: id, userId: userId, deletedAt: null },
            data: { 
                deletedAt: new Date(),
                updatedAt: new Date(),
                // updatedBy: userId, // Jika Anda memiliki field updatedBy
            },
        });

        logger.info({ addressId: deletedAddress.id, userId }, 'Success delete (soft) address');
        return res.status(200).send({ status: true, statusCode: 200, message: 'Delete address success', data: { id: deletedAddress.id } });

    } catch (e) {
                const error = e as PrismaClientKnownRequestError;

        if (error.code === 'P2025') {
            return res.status(404).send({ status: false, statusCode: 404, message: `Address with ID ${id} not found, deleted, or does not belong to user.`, data: {} });
        }
        logger.error({ error: error.message, id, userId }, 'ERR: address - delete');
        return res.status(500).send({ status: false, statusCode: 500, message: 'Internal server error.' });
    }
};