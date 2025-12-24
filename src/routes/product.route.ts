import { Router } from 'express'

import { createProduct, getProduct, getProducts } from '../controllers/product.controller.js'
import { authenticateToken} from '../middlewares/auth.middleware.js'
import { uploadProduct } from '../lib/cloudinary.js'

export const ProductRouter: Router = Router()

ProductRouter.get('/', getProducts)
ProductRouter.get('/:id', getProduct)
ProductRouter.post('/', authenticateToken, uploadProduct.single('image'), createProduct);