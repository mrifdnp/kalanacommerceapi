
// file: src/routes/user.route.ts

import express from 'express';
import { loginUser, registerUser } from '../controllers/user.controller.js'; 

const authRouter = express.Router();

// Route untuk pendaftaran (Register)
authRouter.post('/register', registerUser);
// Tambahkan userRouter.post('/login', loginUser); jika sudah siap

authRouter.post('/login', loginUser);

export { authRouter };