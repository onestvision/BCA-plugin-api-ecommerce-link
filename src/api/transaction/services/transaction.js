'use strict';
const { createCoreService } = require('@strapi/strapi').factories;
const { createTransaction } = require('../../../utils/kasoft/createTransaction');
const { sendWhatsAppInteractive } = require('../../../utils/messageSender/sendInteractive');
const { sendWhatsAppMessage } = require("../../../utils/messageSender/sendMessage");

module.exports = createCoreService('api::transaction.transaction', ({ strapi }) => ({
  async processPayment(data) {
    try {
      const { transaction } = data;
      const { payment_link_id, customer_email, customer_data, amount_in_cents, status, finalized_at, id, payment_method_type } = transaction;
      console.log(transaction);

      const order = await strapi.entityService.findMany('api::order.order', {
        filters: { link: { $eq: payment_link_id } },
        populate: ['user.customer', 'user.shipping'],
      });


      if (order.length == 0) {
        throw new Error('Order not found.');
      }

      const user = order[0].user;

      let payment;
      payment = await strapi.entityService.findMany('api::payment.payment', {
        filters: { identify_number: { $eq: customer_data.customer_references[0].value.trim() } },
      })

      if (payment.length == 0) {
        const { full_name } = customer_data;

        payment = await strapi.entityService.create('api::payment.payment', {
          data: {
            full_name,
            phone_number: customer_data.phone_number.replace("+", ""),
            identify_number: customer_data.customer_references[0].value.trim(),
            identification_type: customer_data.customer_references[1].value ? "NIT" : "CC",
            razon_social: customer_data.customer_references[1].value ? customer_data.customer_references[1].value : full_name,
            user: user.id,
            email: customer_email,
          },
        });
      } else {
        payment = payment[0]
      }

      const taxes = 0;
      const subtotal = amount_in_cents / 100;
      const total = taxes + subtotal;
      const transaction_status = status === "APPROVED" ? "completed" : "failed";
      const transaction_id = `TR${Math.floor(100000 + Math.random() * 900000)}${order[0].id}`
      const newTransaction = await strapi.entityService.create('api::transaction.transaction', {
        data: {
          transaction_id: transaction_id,
          order: order[0].id,
          transaction_date: finalized_at,
          payment_id: id,
          payment_method: payment_method_type,
          status: transaction_status,
          taxes,
          subtotal,
          total,
          user: user.id || null,
          payment:payment.id
        },
      });
      const taxesMessage = taxes > 0 ? `Impuestos: $${taxes}\n` : ""

      if (status === "APPROVED") {
        const message = `🎊 *¡${user.name}, Gracias por tu compra!* 🎊\nMe alegra informarte que tu pago ha sido procesado con éxito. El número de comprobante de tu transacción es*${transaction_id}*.\n\nAquí tienes los detalles de tu pedido:\n${order[0].description}\nSubtotal: $${subtotal}\n${taxesMessage}*Total: $${total}*\n\n😊Si tienes alguna pregunta o necesitas asistencia, no dudes en contactarme. ¡Estoy aquí para ayudarte!\n\n🌟 ¡Gracias por confiar en nosotros! ¡Esperamos que disfrutes tu compra! 🌟`

        await sendWhatsAppMessage("Xeletiene", message, user.phone_number)
        await strapi.entityService.update('api::order.order', order[0].id, {
          data: { status: "completed" },
        });
      } else {
        const message = "Ha ocurrido un error con tu pago. 😔\nSi quieres intentarlo de nuevo presiona *reintentar compra*.\nSi persiste el problema, no dudes en contactarnos.\n¡Gracias por tu paciencia!"
        await sendWhatsAppInteractive("Xeletiene", message, user.phone_number, ["🔄Reintentar compra"])
      }

      await createTransaction("xeletiene", transaction_id);

      return newTransaction
    } catch (error) {
      console.error('We have problems creating a new transaction', error.details?.errors);
      throw error;
    }
  }
}));
