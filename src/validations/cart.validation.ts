import Joi from 'joi';

const addCartItemSchema = Joi.object({
    productVariantId: Joi.string().required().messages({
        'any.required': 'ID Varian Produk wajib diisi.'
    }),
    quantity: Joi.number().integer().min(1).required().messages({
        'number.min': 'Jumlah item minimal 1.',
        'any.required': 'Kuantitas wajib diisi.'
    }),
});

export const checkoutValidation = (payload: unknown) => {
    const schema = Joi.object({
        // Harus array, isinya UUID, minimal ada 1 item
        cartItemIds: Joi.array()
            .items(Joi.string().uuid().required())
            .min(1)
            .required()
            .messages({
                'array.base': 'cartItemIds harus berupa array.',
                'array.min': 'Pilih minimal satu item untuk checkout.',
                'any.required': 'Daftar item keranjang wajib dikirim.'
            }), 
        // Jika nanti mau nambahin diskon/voucher
        discountAmount: Joi.number().min(0).optional()
    });

    // abortEarly: false supaya semua error dimunculkan sekaligus kalau ada banyak yang salah
    return schema.validate(payload, { abortEarly: false });
};

export const addCartItemValidation = (payload: unknown) => {
    return addCartItemSchema.validate(payload, { abortEarly: false });
};
