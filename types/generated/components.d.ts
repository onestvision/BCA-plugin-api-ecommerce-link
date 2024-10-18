import type { Schema, Attribute } from '@strapi/strapi';

export interface ProductProducts extends Schema.Component {
  collectionName: 'components_product_products';
  info: {
    displayName: 'products';
    icon: 'shoppingCart';
    description: '';
  };
  attributes: {
    product_name: Attribute.String;
    variation_description: Attribute.String;
    variation_id: Attribute.String;
    unit_price: Attribute.Decimal;
    product_id: Attribute.BigInteger;
    amount: Attribute.Integer;
  };
}

declare module '@strapi/types' {
  export module Shared {
    export interface Components {
      'product.products': ProductProducts;
    }
  }
}
