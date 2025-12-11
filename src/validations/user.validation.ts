import Joi from 'joi';

const registerSchema = Joi.object({
    name: Joi.string().min(3).max(100).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(), // Minimal 6 karakter
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