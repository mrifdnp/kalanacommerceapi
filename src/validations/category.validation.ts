import Joi from 'joi';

const createCategorySchema = Joi.object({
    name: Joi.string().min(3).max(100).required(),
    createdBy: Joi.string().uuid().optional(),
});

export const createCategoryValidation = (payload: unknown) => {
    return createCategorySchema.validate(payload, { abortEarly: false });
};