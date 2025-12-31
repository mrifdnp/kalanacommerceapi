/* eslint-disable @typescript-eslint/no-explicit-any */
import { Response } from 'express';
import { logger } from '../utils/logger.js';
import { prisma } from '../lib/prisma.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { updateProfileValidation } from '../validations/user.validation.js';



export const getMe = async (req: AuthRequest, res: Response) => {
    // 1. Ambil userId yang dilampirkan oleh authenticateToken (dari payload JWT)
    const userId = req.userId;

    // Safety check (seharusnya tidak tercapai jika middleware sudah bekerja)
    if (!userId) {
        return res.status(401).send({ status: false, statusCode: 401, message: 'Unauthorized.' });
    }

    try {
        // 2. Query ke database menggunakan userId
        const user = await prisma.user.findUnique({
            where: { id: userId, deletedAt: null }, // Mencari user yang aktif (belum soft delete)

            // 3. BEST PRACTICE: Gunakan 'select' eksplisit untuk Keamanan dan Efisiensi Payload
            select: {
                id: true,
                name: true,
                email: true,
                phoneNumber: true,
                balance: true, // Field Saldo (jika sudah di-migrate)
                image: true,
                createdAt: true,
                updatedAt: true,

                // Opsional: Hanya ambil Alamat Default (efisiensi data)
                addresses: {
                    where: {
                        isDefault: true,
                        // Jika Anda punya deletedAt di UserAddress: deletedAt: null 
                    },
                    take: 1 // Hanya ambil 1 (yang default)
                },
            }
        });

        if (!user) {
            logger.warn({ userId }, 'User not found in DB for /me endpoint.');
            return res.status(404).send({ status: false, statusCode: 404, message: 'User profile not found.' });
        }

        logger.info({ userId }, 'Success getting user profile (/me).');
        return res.status(200).send({
            status: true,
            statusCode: 200,
            message: 'Success get user profile',
            data: user
        });

    } catch (e: any) {
        logger.error({ error: e.message, userId }, 'ERR: user - getMe');
        return res.status(500).send({ status: false, statusCode: 500, message: 'Internal server error.' });
    }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
    // 1. Validasi Input
    const { error, value } = updateProfileValidation(req.body);

    if (error) {
        // Ambil pesan error pertama dengan fallback message
        const errorMessage = error.details?.[0]?.message || 'Input tidak valid';
        
        logger.error({ validationError: error.details }, 'ERR: user - updateProfile - Validation failed');
        
        return res.status(422).send({
            status: false,
            statusCode: 422,
            message: errorMessage,
            data: {}
        });
    }

    const userId = req.userId;
    if (!userId) return res.status(401).send({ status: false, message: 'Unauthorized' });

    try {
        // 2. Update dengan teknik spread untuk menghindari 'undefined'
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                ...(value.name && { name: value.name }),
                ...(value.email && { email: value.email }),
                ...(value.phoneNumber && { phoneNumber: value.phoneNumber }),
            },
            select: {
                id: true,
                name: true,
                email: true,
                phoneNumber: true,
                image: true
            }
        });

        return res.status(200).send({
            status: true,
            statusCode: 200,
            message: 'Profil berhasil diperbarui',
            data: updatedUser
        });

    } catch (e: any) {
        // Handle unique constraint pnpm prisma
        if (e.code === 'P2002') {
            return res.status(409).send({
                status: false,
                statusCode: 409,
                message: 'Email atau Nomor Telepon sudah terdaftar',
                data: {}
            });
        }
        return res.status(500).send({ status: false, message: 'Internal server error' });
    }
};

export const updateProfilePhoto = async (req: AuthRequest, res: Response) => {
    const userId = req.userId;


    if (!userId) {
        return res.status(401).send({ status: false, statusCode: 401, message: 'Unauthorized.' });
    }

    try {
        if (!req.file) {
            return res.status(400).send({ status: false, message: 'Tidak ada foto yang diupload' });
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                image: req.file.path 
            },
            select: {
                id: true,
                name: true,
                image: true
            }
        });

        return res.status(200).send({
            status: true,
            statusCode: 200,
            message: 'Foto profil berhasil diperbarui',
            data: updatedUser
        });

    } catch (e: any) {
        return res.status(500).send({ status: false, message: 'Gagal update foto profil: ' + e.message });
    }
};