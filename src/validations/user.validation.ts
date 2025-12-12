import Joi from 'joi';

const registerSchema = Joi.object({
    name: Joi.string().min(3).max(100).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(), 
    phoneNumber: Joi.string()
        .trim()
        .pattern(/^[0-9]+$/) // Hanya angka
        .min(10)
        .max(15)
        .required()
        .messages({
            'string.empty': 'Nomor telepon wajib diisi.',
            'string.min': 'Nomor telepon minimal 10 digit.',
            'string.max': 'Nomor telepon maksimal 15 digit.',
            'string.pattern.base': 'Nomor telepon harus berupa angka.',
            'any.required': 'Nomor telepon wajib diisi.',
        }),
});

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
});

export const registerValidation = (payload: unknown) => {
    return registerSchema.validate(payload, { abortEarly: false });
};
export const loginValidation = (payload: unknown) => {
    return loginSchema.validate(payload, { abortEarly: false });
};