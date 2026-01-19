// file: src/routes/order.route.ts
import express from 'express';
import { getOrderDetail, getOrders, renderPickupPage, updateOrderStatus } from '../controllers/order.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';


const orderRouter = express.Router();


orderRouter.get('/',authenticateToken, getOrders);
orderRouter.get('/:id', authenticateToken, getOrderDetail);
orderRouter.patch('/item/status', authenticateToken, updateOrderStatus);
orderRouter.post('/admin/pickup/update', updateOrderStatus);
orderRouter.get('/admin/pickup', renderPickupPage);
export { orderRouter };