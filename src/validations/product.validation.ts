// file: src/validations/product.validation.ts

import Joi from 'joi';
import { ProductInput, ProductUpdateInput } from '../interfaces/product.interface.js'; // Menggunakan interface untuk referensi

// Skema Dasar untuk CREATE
const createProductSchema = Joi.object<ProductInput>({
    // Foreign Keys
    outletId: Joi.string().uuid().required(),
    categoryId: Joi.string().uuid().required(),
    unitId: Joi.string().uuid().required(),
    
    // Data Master & Kode
    productCode: Joi.string().max(50).required(),
    name: Joi.string().min(3).max(255).required(),
    cogs: Joi.number().integer().min(0).required(),
    price: Joi.number().integer().min(1).required(),
    
    // Stok dan Harga Opsional
    qty: Joi.number().integer().min(0).default(0), 
    description: Joi.string().allow(null, '').optional(),
    image: Joi.string().uri().allow(null, '').optional(),
    tags: Joi.string().allow(null, '').optional(),
    discountNominal: Joi.number().integer().min(0).optional(),
    discountPercent: Joi.number().precision(2).min(0).max(100).optional(), 
    
    // Logistik & Audit
    isPublished: Joi.boolean().default(true),
    moq: Joi.number().integer().min(1).optional(),
    isMaterial: Joi.boolean().default(false),
    materialCategoryId: Joi.string().uuid().optional(),
    expiryDate: Joi.date().iso().optional(),
    batch: Joi.string().max(50).optional(),
    sku: Joi.string().max(100).optional(),
    createdBy: Joi.string().uuid().optional(), 
});

// Skema untuk memperbarui produk (Semua opsional)
export const updateProductSchema = createProductSchema.fork(
    Object.keys(createProductSchema.describe().keys), 
    (field) => field.optional()
).min(1).messages({ 'object.min': 'Must provide at least one field to update.' });


// Tipe untuk hasil validasi
type JoiError = unknown; 
type ValidationResult<T> = { 
    error: JoiError | undefined;
    value: T | undefined;
};

// Fungsi Validasi
export const createProductValidation = (payload: unknown): ValidationResult<ProductInput> => {
    return createProductSchema.validate(payload, { abortEarly: false }) as ValidationResult<ProductInput>; 
}

export const updateProductValidation = (payload: unknown): ValidationResult<ProductUpdateInput> => {
    return updateProductSchema.validate(payload, { abortEarly: false }) as ValidationResult<ProductUpdateInput>;
}