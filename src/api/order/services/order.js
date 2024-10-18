const { createCoreService } = require('@strapi/strapi').factories;
const { sendWhatsAppMessage } = require("../../../utils/messageSender/sendMessage");

module.exports = createCoreService('api::order.order', ({ strapi }) => ({
  async createOrder(user, products, coupon, discount, subtotal, total) {
    try {
      console.log(subtotal);
      
      let orderDescription = "";
      let orderId = ""
      let order = await strapi.entityService.findMany('api::order.order', {
        filters: {
          user: { $eq: user.id },
          status: { $eq: 'processing' }
        }
      })

      // If the order not exist create a new order if exist select the order created previously
      if (order.length == 0) {
        orderId = `OR${Math.floor(100000 + Math.random() * 900000)}`;
        order = await strapi.entityService.create('api::order.order', {
          data: {
            user: user.id,
            coupon: coupon,
            discount: discount,
            subtotal: subtotal,
            total: total,
          },
        });
      } else {
        order = order[0]
        orderId = order.order_id.substring(0, 8);
        if (order.status == "processing") {
          await strapi.entityService.update('api::order.order', order.id, {
            data: {
              user: user.id,
              coupon: coupon,
              discount: discount,
              subtotal: subtotal,
              total: total,
              product_orders: []
            },
          });
        }
      }

      const processProduct = async (product) => {
        let variation, prod;

        if (product.variation_id) {
          variation = await strapi.entityService.findMany('api::variation.variation', {
            filter: { sku: { eq: product.variation_id } },
            populate: 'product',
          });
          variation = variation[0]

          prod = variation?.product;
        } else if (product.product_id) {
          prod = await strapi.entityService.findOne('api::product.product', product.product_id);
        }

        await strapi.entityService.create('api::product-order.product-order', {
          data: {
            order: order.id,
            amount: product.amount,
            unit_price: product.unit_price,
            subtotal: product.amount * product.unit_price,
            variation: variation?.id || null,
            product: prod?.id || null,
          },
        });

        return variation ? `${variation.name} x ${product.amount}\n` : `${prod?.name} x ${product.amount}\n`;
      };

      const productDescriptions = await Promise.all(products.map(processProduct));
      orderDescription = productDescriptions.join('');

      const updatedOrder = await strapi.entityService.update('api::order.order', order.id, {
        data: {
          description: orderDescription,
          order_id: `${orderId}${order.id}`,
        },
        populate: 'product_orders',
      });

      const message = `🎉 *Hemos recibido tu orden con éxito.* 🎉\nTu número de orden es *${orderId}${order.id}*.\n\nLos productos de tu orden son:\n${orderDescription}\nSi deseas continuar con la compra, por favor responde a este mensaje con las palabras *Continuar Compra*.\n\n¡Gracias por tu preferencia! 😊`

      await sendWhatsAppMessage("Xeletiene", message, user.phone_number)

      return updatedOrder;
    } catch (error) {
      throw new Error('Error processing order: ' + error.message);
    }
  }
}));