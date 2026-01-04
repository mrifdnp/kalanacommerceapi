import express from 'express';
import { authenticateToken } from '../middlewares/auth.middleware.js'; 
import { addItemToCart, buyNowCheckout, checkout, getCart, removeCartItem, updateCartItemQuantity } from '../controllers/cart.controller.js'; 

const cartRouter = express.Router();

cartRouter.post('/items', authenticateToken, addItemToCart); 

cartRouter.get('/', authenticateToken, getCart); 

cartRouter.patch('/items/:id', authenticateToken, updateCartItemQuantity); 


cartRouter.delete('/items/:id', authenticateToken, removeCartItem);

cartRouter.post('/checkout', authenticateToken, checkout);

cartRouter.post('/checkout/direct', authenticateToken, buyNowCheckout);

export { cartRouter };