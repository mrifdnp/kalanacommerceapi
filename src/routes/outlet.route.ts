import express from 'express';
import { createOutlet, getOutlets } from '../controllers/outlet.controller.js'; 
import { verifyToken } from '../middlewares/auth.middleware.js';

const outletRouter = express.Router();

outletRouter.post('/', verifyToken, createOutlet);
outletRouter.get('/', getOutlets);

export { outletRouter };