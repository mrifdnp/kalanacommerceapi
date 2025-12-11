import Joi from 'joi';
import { CheckoutInput } from '../interfaces/order.interface.js'; // Asumsi ini ada atau Anda sesuaikan

const checkoutSchema = Joi.object<CheckoutInput>({
    paymentMethod: Joi.string().max(50).required(),
    discountAmount: Joi.number().integer().min(0).default(0).optional(),
    
    // Daftar ID CartItem yang dipilih (Wajib ada dan minimal 1)
    cartItemIds: Joi.array().items(Joi.string().uuid()).min(1).required().messages({
        'array.min': 'Must select at least one item to checkout.'
    })
});

export const checkoutValidation = (payload: unknown) => {
    return checkoutSchema.validate(payload, { abortEarly: false });
};