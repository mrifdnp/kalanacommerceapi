export interface CheckoutInput {
    paymentMethod: string;
    discountAmount: number;
    cartItemIds: string[];
}