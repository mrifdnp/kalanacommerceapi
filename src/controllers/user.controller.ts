/* eslint-disable @typescript-eslint/no-explicit-any */
import { Response } from 'express';
import { logger } from '../utils/logger.js';
import { prisma } from '../lib/prisma.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { updateProfileValidation } from '../validations/user.validation.js';



export const getMe = async (req: AuthRequest, res: Response) => {
    const userId = req.userId;

    if (!userId) {
        return res.status(401).send({ status: false, statusCode: 401, message: 'Unauthorized.' });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId, deletedAt: null }, 

            select: {
                id: true,
                name: true,
                email: true,
                phoneNumber: true,
                balance: true, 
                image: true,
                createdAt: true,
                updatedAt: true,

                addresses: {
                    where: {
                        isDefault: true,
                    },
                    take: 1 
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
    const { error, value } = updateProfileValidation(req.body);

    if (error) {
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