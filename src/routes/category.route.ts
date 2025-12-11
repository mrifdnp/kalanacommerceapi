import express from 'express';
import { createCategory, getCategories } from '../controllers/category.controller.js'; 

const categoryRouter = express.Router();

categoryRouter.post('/',  createCategory);
categoryRouter.get('/', getCategories);

export { categoryRouter };