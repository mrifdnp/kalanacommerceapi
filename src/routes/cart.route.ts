import express from 'express';
import { verifyToken } from '../middlewares/auth.middleware.js'; 
import { addItemToCart, getCart, removeCartItem, updateCartItemQuantity } from '../controllers/cart.controller.js'; 

const cartRouter = express.Router();

cartRouter.post('/items', verifyToken, addItemToCart); 

cartRouter.get('/', verifyToken, getCart); 

cartRouter.patch('/items/:id', verifyToken, updateCartItemQuantity); 


cartRouter.delete('/items/:id', verifyToken, removeCartItem);


export { cartRouter };