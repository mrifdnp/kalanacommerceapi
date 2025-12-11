/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from 'express';
import { logger } from '../utils/logger.js';
import { prisma } from '../lib/prisma.js';
import { createUnitValidation } from '../validations/unit.validation.js';
import { ValidationResult } from 'joi';

// Asumsi UnitInput/ValidationResult sudah didefinisikan
interface UnitInput { name: string, outletId?: string, createdBy?: string; }

// --- CREATE UNIT (POST) ---
export const createUnit = async (req: Request, res: Response) => {
    const { error, value } = createUnitValidation(req.body) as ValidationResult<UnitInput>;

    if (error || !value) {
        logger.error({ validationError: error?.details[0] }, 'ERR: unit - create - Validation failed');
        return res.status(422).send({ status: false, statusCode: 422, message: error?.details[0]?.message, data: {} });
    }

    try {
        const newUnit = await prisma.unit.create({
            data: value,
        });

        logger.info({ unitId: newUnit.id }, 'Success create new unit');
        return res.status(201).send({ status: true, statusCode: 201, message: 'Create unit success', data: newUnit });

    } catch (e: any) {
        logger.error({ error: e.message, body: req.body }, 'ERR: unit - create - Database Error');
        return res.status(500).send({ status: false, statusCode: 500, message: 'Internal server error.', data: {} });
    }
};

// --- READ ALL UNITS (GET) ---
export const getUnits = async (req: Request, res: Response) => {
    try {
        const allUnits = await prisma.unit.findMany({
            where: { deletedAt: null },
            include: { outlet: { select: { name: true } } }
        });
        
        logger.info(`Found ${allUnits.length} units.`);
        return res.status(200).send({ status: true, statusCode: 200, message: 'Success get all units', data: allUnits });
    } catch (e: any) {
        logger.error({ error: e.message }, 'ERR: unit - getAll');
        return res.status(500).send({ status: false, statusCode: 500, message: 'Internal server error.' });
    }
};