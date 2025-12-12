import express from 'express';
import { createCategory, getCategories, getCategoryById } from '../controllers/category.controller.js'; 

const categoryRouter = express.Router();

categoryRouter.post('/',  createCategory);
categoryRouter.get('/', getCategories);
categoryRouter.get('/:id',getCategoryById)

export { categoryRouter };