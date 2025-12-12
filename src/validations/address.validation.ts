import Joi from 'joi';
import { AddressUpdateInput,UserAddressInput } from '../interfaces/user.interface.js';

const addressBaseSchema = {
    label: Joi.string().trim().max(50).required().messages({
        'any.required': 'Label alamat wajib diisi.',
        'string.max': 'Label alamat maksimal 50 karakter.'
    }),
    recipientName: Joi.string().trim().max(100).required().messages({
        'any.required': 'Nama penerima wajib diisi.'
    }),
    // Asumsi Anda memiliki validasi phone number yang sudah benar
    phoneNumber: Joi.string().trim().min(8).max(15).required(), 
    street: Joi.string().trim().max(255).required().messages({
        'any.required': 'Alamat jalan/detail wajib diisi.'
    }),
    postalCode: Joi.string().trim().min(5).max(10).required(),
    
    // Asumsi ID Wilayah menggunakan string
    provincesId: Joi.string().trim().required(), 
    citiesId: Joi.string().trim().required(),
    districtsId: Joi.string().trim().required(),

    // Koordinat GPS (Opsional)
    long: Joi.number().optional(),
    lat: Joi.number().optional(),
    isDefault: Joi.boolean().optional(),
};

export const createAddressValidation = (data: UserAddressInput) => {
    const schema = Joi.object({
        ...addressBaseSchema,
        });
    return schema.validate(data);
};

export const updateAddressValidation = (data: AddressUpdateInput) => {
    const schema = Joi.object(addressBaseSchema)
        .keys({
            // Semua field yang wajib di create, harus diubah menjadi opsional
            label: Joi.string().trim().max(50).optional(),
            recipientName: Joi.string().trim().max(100).optional(),
            phoneNumber: Joi.string().trim().min(8).max(15).optional(),
            street: Joi.string().trim().max(255).optional(),
            postalCode: Joi.string().trim().min(5).max(10).optional(),
            provincesId: Joi.string().trim().optional(),
            citiesId: Joi.string().trim().optional(),
            districtsId: Joi.string().trim().optional(),
            // long/lat/isDefault sudah optional dari awal
        })
        .min(1) // ⬅️ Wajib ada minimal 1 field untuk update
        .messages({
            'object.min': 'Harap berikan setidaknya satu field untuk diperbarui.'
        });
    return schema.validate(data);
};