
// file: src/routes/user.route.ts

import express from 'express';
import { loginUser, registerUser } from '../controllers/user.controller.js'; 
import { authLimiter } from '../middlewares/rateLimiter.js';
import { forgotPassword, resetPassword } from '../controllers/auth.controller.js';

const authRouter = express.Router();

// Route untuk pendaftaran (Register)
authRouter.post('/register', authLimiter, registerUser); // ⬅️ DITAMBAHKAN DI SINI
authRouter.post('/login', authLimiter, loginUser);
authRouter.post('/forgot-password', authLimiter, forgotPassword);
authRouter.post('/reset-password', authLimiter, resetPassword);
export { authRouter };