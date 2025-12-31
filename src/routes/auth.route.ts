
import express from 'express';
import { authLimiter } from '../middlewares/rateLimiter.js';
import { forgotPassword, loginUser, registerUser, resetPassword } from '../controllers/auth.controller.js';

const authRouter = express.Router();

authRouter.post('/register', authLimiter, registerUser); 
authRouter.post('/login', authLimiter, loginUser);
authRouter.post('/forgot-password', authLimiter, forgotPassword);
authRouter.post('/reset-password', authLimiter, resetPassword);
export { authRouter };