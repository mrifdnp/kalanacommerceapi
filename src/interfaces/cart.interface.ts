export interface AddCartItemInput {
    productId: string;
    quantity: number;
    // userId tidak diperlukan di payload karena diambil dari JWT
}