import express from 'express';
import { createOutlet, getOutletById, getOutlets } from '../controllers/outlet.controller.js'; 
import { verifyToken } from '../middlewares/auth.middleware.js';

const outletRouter = express.Router();

outletRouter.post('/', verifyToken, createOutlet);
outletRouter.get('/', getOutlets);
outletRouter.get('/:id', getOutletById);

export { outletRouter };