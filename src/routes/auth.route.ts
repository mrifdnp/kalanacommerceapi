
// file: src/routes/user.route.ts

import express from 'express';
import { loginUser, registerUser, updateProfilePhoto } from '../controllers/user.controller.js'; 
import { authLimiter } from '../middlewares/rateLimiter.js';
import { forgotPassword, resetPassword } from '../controllers/auth.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { uploadCloudinary } from '../lib/cloudinary.js';

const authRouter = express.Router();

// Route untuk pendaftaran (Register)
authRouter.post('/register', authLimiter, registerUser); // ⬅️ DITAMBAHKAN DI SINI
authRouter.post('/login', authLimiter, loginUser);
authRouter.post('/forgot-password', authLimiter, forgotPassword);
authRouter.post('/reset-password', authLimiter, resetPassword);
authRouter.put('/update-photo', authenticateToken, uploadCloudinary.single('image'), updateProfilePhoto);
export { authRouter };