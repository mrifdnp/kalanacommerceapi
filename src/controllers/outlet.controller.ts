// file: src/controllers/outlet.controller.ts
/* eslint-disable @typescript-eslint/no-explicit-any */

import { Request, Response } from 'express';
import { logger } from '../utils/logger.js';
import { prisma } from '../lib/prisma.js'; 
// Asumsi Anda sudah punya OutletValidation (Joi) dan OutletInput (Interface)

export const createOutlet = async (req: Request, res: Response) => {
    // ⚠️ TODO: Tambahkan validasi Joi di sini
    const { name, userId } = req.body; 

    try {
        const newOutlet = await prisma.outlet.create({
            data: { name, userId } // Asumsi data valid
        });

        logger.info({ outletId: newOutlet.id }, 'Success create new outlet');
        return res.status(201).send({ 
            status: true, 
            statusCode: 201, 
            message: 'Create outlet success', 
            data: newOutlet 
        });

    } catch (e: any) {
        logger.error({ error: e.message }, 'ERR: outlet - create');
        return res.status(500).send({ status: false, statusCode: 500, message: 'Internal server error.' });
    }
};

export const getOutlets = async (req: Request, res: Response) => {
    try {
        const allOutlets = await prisma.outlet.findMany({
            where: { deletedAt: null },
            include: { user: { select: { name: true } } }
        });
        
        logger.info(`Found ${allOutlets.length} outlets.`);
        return res.status(200).send({ 
            status: true, 
            statusCode: 200, 
            message: 'Success get all outlets', 
            data: allOutlets 
        });
    } catch (e: any) {
        logger.error({ error: e.message }, 'ERR: outlet - getAll');
        return res.status(500).send({ status: false, statusCode: 500, message: 'Internal server error.' });
    }
};

export const getOutletById = async (req: Request, res: Response) => {
    // Ambil ID dari URL parameter
    const { id } = req.params;

    if (!id) {
        return res.status(400).send({ status: false, statusCode: 400, message: 'Outlet ID is required.' });
    }

    try {
        const outlet = await prisma.outlet.findUnique({
            where: { id: id, deletedAt: null }, // Mencari berdasarkan ID dan memastikan tidak terhapus
            include: { 
                user: { select: { name: true, email: true } }, // Menyertakan informasi User
                units: true, // Menyertakan Unit yang dimiliki Outlet ini
                // products: true // Bisa ditambahkan jika diperlukan
            }
        });

        if (!outlet) {
            logger.warn({ outletId: id }, 'Outlet not found or deleted.');
            return res.status(404).send({ 
                status: false, 
                statusCode: 404, 
                message: `Outlet with ID ${id} not found.`,
                data: null
            });
        }
        
        logger.info({ outletId: id }, 'Success get single outlet.');
        return res.status(200).send({ 
            status: true, 
            statusCode: 200, 
            message: 'Success get outlet by ID', 
            data: outlet 
        });

    } catch (e: any) {
        // Pengecekan error UUID yang tidak valid (jika database PostgreSQL)
        if (e.code === 'P2023') { 
             return res.status(400).send({ status: false, statusCode: 400, message: 'Invalid ID format.' });
        }
        logger.error({ error: e.message, id }, 'ERR: outlet - getById');
        return res.status(500).send({ status: false, statusCode: 500, message: 'Internal server error.' });
    }
};