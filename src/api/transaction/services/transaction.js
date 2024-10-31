'use strict';
const { createCoreService } = require('@strapi/strapi').factories;
const { valueToString } = require('../../../utils/formaters/valueToString');
const { createTransaction } = require('../../../utils/kasoft/createTransaction');
const { updateTransaction } = require('../../../utils/kasoft/updateTransaction');
const { sendWhatsAppInteractive } = require('../../../utils/messageSender/sendInteractive');
const { sendWhatsAppMessage } = require("../../../utils/messageSender/sendMessage");
const { generateDistpatch } = require('../../../utils/tracking/generateDispatch');
const { generateLabel } = require('../../../utils/tracking/generateLabel');
const { getTrackingCode } = require('../../../utils/tracking/getTrackingCode');

module.exports = createCoreService('api::transaction.transaction', ({ strapi }) => ({
  async processPayment(data) {
    try {
      let newTrans = false; 
      const { transaction } = data;
      const { payment_link_id, customer_email, customer_data, amount_in_cents, status, finalized_at, id, payment_method_type } = transaction;
      const order = await strapi.entityService.findMany('api::order.order', {
        filters: { link: { $eq: payment_link_id } },
        populate: ['user.customer', 'shipping', 'shipping_details'],
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

      const trans = await strapi.entityService.findMany('api::transaction.transaction', {
        filters: { identify_number: { $eq: customer_data.customer_references[0].value.trim() } },
      })

      let newTransaction;
      let transaction_id;
      const taxes = 0;
      const subtotal = amount_in_cents / 100;
      const total = taxes + subtotal;
      const transaction_status = status === "APPROVED" ? "completed" : "failed";

      if (trans.length == 0) {
        newTrans = true
        transaction_id = `TR${Math.floor(100000 + Math.random() * 900000)}${order[0].id}`
        newTransaction = await strapi.entityService.create('api::transaction.transaction', {
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
            payment: payment.id
          },
        });
      } else {
        newTrans = false
        transaction_id = trans[0].transaction_id
        newTransaction = await strapi.entityService.update('api::transaction.transaction', trans[0].id, {
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
            payment: payment.id
          },
        });
      }

      const taxesMessage = taxes > 0 ? `\nImpuestos: $${taxes}` : ""

      if (status === "APPROVED") {
        const tracking_code = await getTrackingCode(order[0])

        await strapi.entityService.update('api::order.order', order[0].id, {
          data: {
            status: "completed",
            logistics_provider: "COORDINADORA",
            tracking_code: tracking_code
          },
        });
        
        newTrans ? await createTransaction("xeletiene", transaction_id) : await updateTransaction("xeletiene", transaction_id, transaction_status);
        
        const shippingValueMessage = order[0].shipping_value > 0 ? `$${valueToString(order[0].shipping_value)}` : "GRATIS"

        const descriptionMessage = order[0].description
          .split('\n')
          .filter(line => line.trim() !== '')
          .map(line => `📌${line}`)
          .join('\n');

        const message = `🎊 *¡${user.name}, Gracias por tu compra!* 🎊\nMe alegra informarte que tu pago ha sido procesado con éxito. El número de comprobante de tu transacción es *${transaction_id}*.\n\n📦Aquí tienes los detalles de tu pedido:\n${descriptionMessage}\n\nSubtotal: $${valueToString(subtotal)}\nEnvio: ${shippingValueMessage}${taxesMessage}\n*Total: $${valueToString(total)}*\n\n🚚Tu pedido fue enviado a travez de *COORDINADORA*.📦\nYo te mantendré al tanto de las novedades de tu envio 📲 pero siempre puedes rastrearlo con el número de guia: *${tracking_code}* 🔎\n\n😊Si tienes alguna pregunta o necesitas asistencia, no dudes en contactarme. ¡Estoy aquí para ayudarte!\n\n🌟 *¡${user.name} espero que disfrutes tu compra!* 🌟`

        await sendWhatsAppMessage("Xeletiene", message, user.phone_number)
        await generateLabel(tracking_code)
        await generateDistpatch(tracking_code)

      } else {
        await strapi.entityService.update('api::order.order', order[0].id, {
          data: {
            status: "completed",
            logistics_provider: "Transaction failed",
            tracking_code: "Transaction failed"
          },
        });
        newTrans ? await createTransaction("xeletiene", transaction_id) : await updateTransaction("xeletiene", transaction_id, transaction_status);

        const message = `😕 Parece que hubo un problema al procesar tu pago. Puedes intentarlo de nuevo presionando *"Reintentar compra"*.📲 Si el problema continúa, aquí estamos para ayudarte.\n🙏 ¡Gracias por tu comprensión y paciencia!`
        await sendWhatsAppInteractive("Xeletiene", message, user.phone_number, ["🔄Reintentar compra"])
      }

      return newTransaction
    } catch (error) {
      console.error('We have problems creating a new transaction', error.details?.errors);
      throw error;
    }
  }
}));
