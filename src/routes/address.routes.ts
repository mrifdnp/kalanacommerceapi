import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { createAddress, deleteAddress, getAddressById, getUserAddresses, updateAddress } from '../controllers/address.controller.js';
// ⚠️ Anda harus membuat controller ini selanjutnya
// Middleware JWT

export const addressRouter: Router = Router();

// Semua rute di sini dilindungi oleh JWT
addressRouter.use(authenticateToken); // Mengaplikasikan middleware ke semua route di router ini

addressRouter.get('/', getUserAddresses); 
addressRouter.get('/:id', getAddressById); 
addressRouter.post('/', createAddress);
addressRouter.put('/:id', updateAddress); // Gunakan PUT/PATCH sesuai preferensi Anda
addressRouter.delete('/:id', deleteAddress);