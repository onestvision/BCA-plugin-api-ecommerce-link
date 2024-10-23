const { createCoreService } = require('@strapi/strapi').factories;
const axios = require('axios');
const { sendWhatsAppMessage } = require("../../../utils/messageSender/sendMessage");
const { getToken } = require('../../../utils/kasoft/getToken');
const { sendWhatsAppInteractive } = require('../../../utils/messageSender/sendInteractive');

module.exports = createCoreService('api::order.order', ({ strapi }) => ({
  async createOrder(user, products, coupon, discount, subtotal, total) {
    try {
      let orderDescription = "";
      let orderId = ""
      let newOrder = true

      let order = await strapi.entityService.findMany('api::order.order', {
        filters: {
          user: { $eq: user.id },
          status: { $eq: 'processing' }
        }
      })

      if (order.length == 0) {
        orderId = `OR${Math.floor(100000 + Math.random() * 900000)}`;
        newOrder = true
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
        newOrder = false
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
      const productsOfOrder = []

      const processProduct = (product) => {
        const product_info = {
          product_name: product.product_name,
          variation_description: product.variation_description,
          variation_id: product.variation_id,
          product_id: product.product_id,
          amount: product.amount,
          unit_price: product.unit_price,
        }
        productsOfOrder.push(product_info)

        return product.variation_id
          ? `${product.product_name} ${product.variation_description} - $${product.unit_price} x ${product.amount}\n`
          : `${product.product_name} - $${product.unit_price} x ${product.amount}\n`;
      };

      const productDescriptions = products.map(processProduct);

      const product_orders = await strapi.entityService.findMany('api::product-order.product-order', {
        populate: '*',
        filters: {
          order: {
            id: { $eq: order.id }
          }
        }
      })

      if (product_orders.length == 0) {
        await strapi.entityService.create('api::product-order.product-order', {
          data: {
            order: order.id,
            products: productsOfOrder
          },
        });
      } else {
        await strapi.entityService.update('api::product-order.product-order', product_orders[0].id, {
          data: {
            order: order.id,
            products: productsOfOrder
          },
        });
      }

      orderDescription = productDescriptions.join('');

      const updatedOrder = await strapi.entityService.update('api::order.order', order.id, {
        data: {
          description: orderDescription,
          order_id: `${orderId}${order.id}`,
        },
        populate: 'product_orders',
      });

      const statusMessage = newOrder ? "recibido" : "modificado"
      const discountMessage = discount > 0 ? `Descuento: $${discount}\n` : ""

      const message = `
      🎉 *Hemos ${statusMessage} tu orden con éxito.* 🎉\nTu número de orden es *${orderId}${order.id}*.\n\nLos productos de tu orden son:\n${orderDescription}\nSubtotal: $${subtotal}\n${discountMessage}*Total: $${total}*\n\nSi deseas finalizar la compra, presiona el boton *Finalizar Compra*.\n\n¡Gracias por tu preferencia! 😊`

      await sendWhatsAppInteractive("Xeletiene", message, user.phone_number, ["🛒Finalizar compra"])

      return updatedOrder;
    } catch (error) {
      throw new Error('Error processing order: ' + error.message);
    }
  },
  async cancelOrder(order_id, company) {
    let response;
    const url = `${process.env.KASOFT_URL}/${company}/transactions/status`
    const order = await strapi.entityService.findOne('api::order.order', order_id, {
      populate: "transactions"
    });

    if (order.status == "completed") {
      throw new Error("An order completed can't be modified")
    }

    try {
      if (order.transactions.length == 0) {
        response = await strapi.entityService.delete('api::order.order', order_id);
      } else {
        const token = await getToken(company)
        response = await axios.put(url, {
          transaction_id: order.transactions[0].transaction_id,
          status: "canceled"
        }, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
      }
      return response
    } catch (error) {
      return error
    }
  }
}));