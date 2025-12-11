// file: src/interfaces/product.interface.ts

export interface ProductInput {
    outletId: string;
    categoryId: string;
    unitId: string;

    productCode: string;
    name: string;
    description?: string;
    image?: string;
    tags?: string;


    qty: number;
    cogs: number;
    price: number;
    discountNominal?: number;
    discountPercent?: number;

    isPublished?: boolean;
    moq?: number;
    isMaterial?: boolean;
    materialCategoryId?: string;
    expiryDate?: Date;
    batch?: string;
    sku?: string;
    
    createdBy?: string;
}

export type ProductUpdateInput = Partial<ProductInput>;