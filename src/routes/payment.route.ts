import { Router } from 'express';
import { midtransWebhook } from '../controllers/payment.controller.js';

const paymentRouter = Router();

// Endpoint ini HARUS publik (Tanpa authenticateToken)
paymentRouter.post('/webhook', midtransWebhook);

export default paymentRouter;