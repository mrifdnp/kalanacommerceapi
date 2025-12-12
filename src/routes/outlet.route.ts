import express from 'express';
import { createOutlet, getOutletById, getOutlets } from '../controllers/outlet.controller.js'; 
import { authenticateToken } from '../middlewares/auth.middleware.js';

const outletRouter = express.Router();

outletRouter.post('/', authenticateToken, createOutlet);
outletRouter.get('/', getOutlets);
outletRouter.get('/:id', getOutletById);

export { outletRouter };