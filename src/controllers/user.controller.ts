/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs'; 
import { logger } from '../utils/logger.js';
import { prisma } from '../lib/prisma.js';
import { loginValidation, registerValidation } from '../validations/user.validation.js';
import jwt from 'jsonwebtoken';
interface RegisterInput {
    name: string;
    email: string;
    password: string;
    phoneNumber: string;
}

interface LoginInput {
    email: string;
    password: string;
}

interface AuthRequest extends Request {
    userId?: string; 
}

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key'; 
const TOKEN_EXPIRES_IN = '1d';


export const registerUser = async (req: Request, res: Response) => {
    const { error, value } = registerValidation(req.body) as { error: any, value: RegisterInput };

    if (error || !value) {
        logger.error({ validationError: error?.details[0] }, 'ERR: user - register - Input validation failed');
        return res.status(422).send({
            status: false,
            statusCode: 422,
            message: error?.details[0]?.message,
            data: {}
        });
    }

    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(value.password, salt);

 
        const newUser = await prisma.user.create({
            data: {
                name: value.name,
                email: value.email,
                password: hashedPassword,
                phoneNumber: value.phoneNumber,
            },
            select: {
                id: true,
                name: true,
                email: true,
                phoneNumber: true,
                createdAt: true,
            } 
        });

        logger.info({ userId: newUser.id }, 'Success register new user');
        return res.status(201).send({
            status: true,
            statusCode: 201,
            message: 'User registration success',
            data: newUser
        });

    } catch (e: any) {
        logger.error({ error: e.message, code: e.code, body: req.body }, 'ERR: user - register - Database Error');
        
        if (e.code === 'P2002') { 
            const target = e.meta?.target;
            let message = 'Email is already registered.';

            if (Array.isArray(target)) {
                if (target.includes('email')) {
                    message = 'Email is already registered.';
                } else if (target.includes('phone_number')) {
                    message = 'Phone number is already registered.';
                }
            } else if (target === 'phone_number') {
                message = 'Phone number is already registered.';
            }
            return res.status(409).send({
                status: false,
                statusCode: 409,
                message,
                data: {}
            });
        }
        return res.status(500).send({ status: false, statusCode: 500, message: 'Internal server error.', data: {} });
    }
};

export const loginUser = async (req: Request, res: Response) => {
    const { error, value } = loginValidation(req.body) as { error: any, value: LoginInput };

    if (error || !value) {
        logger.error({ validationError: error?.details[0] }, 'ERR: user - login - Input validation failed');
        return res.status(422).send({
            status: false,
            statusCode: 422,
            message: 'Email and password are required.', 
            data: {}
        });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email: value.email },
        });

        if (!user) {
            return res.status(401).send({ status: false, statusCode: 401, message: 'Invalid credentials.', data: {} });
        }

        const isPasswordValid = await bcrypt.compare(value.password, user.password);

        if (!isPasswordValid) {
            return res.status(401).send({ status: false, statusCode: 401, message: 'Invalid credentials.', data: {} });
        }

        // 3. Buat Payload JWT (data yang akan disimpan di token)
        const tokenPayload = { 
            id: user.id, 
            email: user.email,
            name: user.name,
       
        };

        // 4. Buat Token
        const token = jwt.sign(
            tokenPayload,
            JWT_SECRET,
            { expiresIn: TOKEN_EXPIRES_IN }
        );

        // 5. Respon Sukses
        logger.info({ userId: user.id }, 'User logged in successfully');
        return res.status(200).send({
            status: true,
            statusCode: 200,
            message: 'Login successful',
            data: {
                token: token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    // Jangan kembalikan password yang di-hash
                }
            }
        });

    } catch (e: any) {
        logger.error({ error: e.message, body: req.body }, 'ERR: user - login - General Error');
        return res.status(500).send({ status: false, statusCode: 500, message: 'Internal server error.', data: {} });
    }
};

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