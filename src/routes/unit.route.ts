import express from 'express';
import { createUnit, getUnits } from '../controllers/unit.controller.js'; 
import { verifyToken } from '../middlewares/auth.middleware.js';

const unitRouter = express.Router();

unitRouter.post('/', verifyToken, createUnit);
unitRouter.get('/', getUnits);

export { unitRouter };