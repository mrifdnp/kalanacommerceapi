import express from 'express';
import { createUnit, getUnitById, getUnits } from '../controllers/unit.controller.js'; 
import { authenticateToken } from '../middlewares/auth.middleware.js';

const unitRouter = express.Router();

unitRouter.post('/', authenticateToken, createUnit);
unitRouter.get('/', getUnits);
unitRouter.get('/:id', getUnitById)

export { unitRouter };