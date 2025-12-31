import { Router } from 'express';
// Asumsi getMe ada di controllers/user.controller.ts
import { getMe, updateProfile, updateProfilePhoto } from '../controllers/user.controller.js'; 
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { uploadCloudinary } from '../lib/cloudinary.js';

const profileRouter = Router();

// Route GET / (yang akan dipetakan ke /api/me)
// Middleware: Hanya perlu authenticateToken
profileRouter.get('/', authenticateToken, getMe); 
profileRouter.put('/update', authenticateToken,updateProfile)
profileRouter.put('/update-photo', authenticateToken, uploadCloudinary.single('image'), updateProfilePhoto);

export default profileRouter;