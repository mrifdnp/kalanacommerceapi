
// file: src/routes/user.route.ts

import express from 'express';
import { loginUser, registerUser } from '../controllers/user.controller.js'; 
import { authLimiter } from '../middlewares/rateLimiter.js';

const authRouter = express.Router();

// Route untuk pendaftaran (Register)
authRouter.post('/register', authLimiter, registerUser); // ⬅️ DITAMBAHKAN DI SINI
authRouter.post('/login', authLimiter, loginUser);

export { authRouter };