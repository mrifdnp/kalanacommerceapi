import Joi from 'joi';

const addCartItemSchema = Joi.object({
    productId: Joi.string().uuid().required().messages({
        'string.guid': 'Format ID Produk tidak valid.',
        'any.required': 'ID Produk wajib diisi.'
    }),
    quantity: Joi.number().integer().min(1).required().messages({
        'number.min': 'Jumlah item minimal 1.',
        'any.required': 'Kuantitas wajib diisi.'
    }),
});

export const addCartItemValidation = (payload: unknown) => {
    return addCartItemSchema.validate(payload, { abortEarly: false });
};