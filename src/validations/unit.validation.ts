import Joi from 'joi';

const createUnitSchema = Joi.object({
    name: Joi.string().min(1).max(50).required(),
    outletId: Joi.string().uuid().optional(), // Opsional
    createdBy: Joi.string().uuid().optional(),
});

export const createUnitValidation = (payload: unknown) => {
    return createUnitSchema.validate(payload, { abortEarly: false });
};
