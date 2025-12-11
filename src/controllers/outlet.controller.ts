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