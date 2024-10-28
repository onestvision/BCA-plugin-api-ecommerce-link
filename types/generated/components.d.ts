import type { Schema, Attribute } from '@strapi/strapi';

export interface ShippingDetailsShippingDetails extends Schema.Component {
  collectionName: 'components_shipping_details_shipping_details';
  info: {
    displayName: 'shipping_details';
    description: '';
  };
  attributes: {
    ubl: Attribute.Integer & Attribute.DefaultTo<0>;
    height: Attribute.Decimal;
    length: Attribute.Decimal;
    weight: Attribute.Decimal;
    units: Attribute.Integer & Attribute.DefaultTo<1>;
    width: Attribute.Decimal;
  };
}

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
      'shipping-details.shipping-details': ShippingDetailsShippingDetails;
      'product.products': ProductProducts;
    }
  }
}
