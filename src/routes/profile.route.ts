import { Router } from 'express';
// Asumsi getMe ada di controllers/user.controller.ts
import { getMe } from '../controllers/user.controller.js'; 
import { authenticateToken } from '../middlewares/auth.middleware.js';

const profileRouter = Router();

// Route GET / (yang akan dipetakan ke /api/me)
// Middleware: Hanya perlu authenticateToken
profileRouter.get('/', authenticateToken, getMe); 

export default profileRouter;