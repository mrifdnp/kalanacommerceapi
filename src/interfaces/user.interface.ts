export interface UserAddressInput {
    label: string;
    recipientName: string;
    phoneNumber: string;
    street: string;
    postalCode: string;
    provincesId: string;
    citiesId: string;
    districtsId: string;
    long?: number; // Opsional
    lat?: number; // Opsional
    isDefault?: boolean; // Opsional
    createdBy?: string; // Diisi oleh server dari token
}

export interface AddressUpdateInput {
    label?: string;
    recipientName?: string;
    phoneNumber?: string;
    street?: string;
    postalCode?: string;
    provincesId?: string;
    citiesId?: string;
    districtsId?: string;
    long?: number;
    lat?: number;
    isDefault?: boolean;
    // updatedBy (userId) akan diisi oleh server
}
export interface UpdateProfileInput {
    name?: string;
    email?: string;
    phoneNumber?: string;
}