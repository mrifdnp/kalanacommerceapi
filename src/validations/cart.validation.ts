import Joi from 'joi';

const addCartItemSchema = Joi.object({
    productVariantId: Joi.string().uuid().required().messages({
        'string.guid': 'Format ID Varian Produk tidak valid.',
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

        // Harus string, contoh: "MIDTRANS_QRIS" atau "GOPAY"
        paymentMethod: Joi.string()
            .required()
            .messages({
                'string.empty': 'Metode pembayaran tidak boleh kosong.',
                'any.required': 'Metode pembayaran wajib dipilih.'
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
