const { createCoreService } = require('@strapi/strapi').factories;
const { sendWhatsAppMessage } = require("../../../utils/messageSender/sendMessage");

module.exports = createCoreService('api::order.order', ({ strapi }) => ({
  async createOrder(user, products, discount, coupon, total) {
    try {
      const orderId = `OR${Math.floor(100000 + Math.random() * 900000)}`;
      let orderDescription = "";

      const order = await strapi.entityService.create('api::order.order', {
        data: {
          user: user.id,
          discount,
          coupon,
          total,
        },
      });

      const processProduct = async (product) => {
        let variation, prod;

        if (product.variation_id) {
          variation = await strapi.entityService.findOne('api::variation.variation', product.variation_id, {
            populate: 'product',
          });
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

      const message = `Hemos recibido tu orden con éxito. 🎉 Tu número de orden es ${orderId}${order.id}. Si deseas continuar con la compra, por favor responde a este mensaje con las palabras *Continuar Compra*. ¡Gracias por tu preferencia! 😊`

      await sendWhatsAppMessage("Xeletiene", message, user.phone_number)

      return updatedOrder;
    } catch (error) {
      throw new Error('Error al crear la orden: ' + error.message);
    }
  }
}));