import { Router } from 'express'

import { createProduct, getProduct, getProducts } from '../controllers/product.controller.js'
import { verifyToken } from '../middlewares/auth.middleware.js'

export const ProductRouter: Router = Router()

ProductRouter.get('/', getProducts)
ProductRouter.get('/:id', getProduct)
ProductRouter.post('/', verifyToken, createProduct);