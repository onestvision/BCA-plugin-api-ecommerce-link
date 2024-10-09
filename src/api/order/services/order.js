const { filter } = require('../../../../config/middlewares');

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::order.order', ({strapi})=>({
  async createOrder(userId, products) {
    try {  
      const orderId = `OR${Math.floor(100000 + Math.random() * 900000)}`;
      let orderDescription = "";
      let order = await strapi.entityService.create('api::order.order', {
        data: {
          order_id: orderId,
          user: userId
        },
      });      

      for (const product of products) {
        let variation, prod;
        try {
          if (product.variation_id && product.variation_id > 0) {
            variation = await strapi.entityService.findOne('api::variation.variation', product.variation_id, {
              populate: 'product',
            });
            prod = variation.product;
          } else if (product.product_id) {
            prod = await strapi.entityService.findOne('api::product.product', product.product_id);
          }          
  
          await strapi.entityService.create('api::product-order.product-order', {
            data: {
              order: order.id,
              amount: product.amount,
              unit_price: product.unit_price,
              subtotal: product.amount * product.unit_price,
              variation: variation ? variation.id : null,
              product: prod ? prod.id : null, 
            },
          });
          const description = variation ? `${variation.name} x ${product.amount} \n` : `${prod.name} x ${product.amount} \n`
          orderDescription += description;
        } catch (err) {
          console.error('Error al crear el producto de la orden:', err);
        }
      }
      order = await strapi.entityService.update('api::order.order', order.id,{
        data: {
          description: orderDescription,
        },
        populate: 'product_orders'
      });
  
      return order;
    } catch (error) {
      throw new Error('Error al crear la orden: ' + error.message);
    }
  },
}));