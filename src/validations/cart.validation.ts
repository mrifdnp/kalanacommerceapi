import Joi from 'joi';

const addCartItemSchema = Joi.object({
    productId: Joi.string().uuid().required(),
    quantity: Joi.number().integer().min(1).required(), // Kuantitas minimal 1
});

export const addCartItemValidation = (payload: unknown) => {
    return addCartItemSchema.validate(payload, { abortEarly: false });
};