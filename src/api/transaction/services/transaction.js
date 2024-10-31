'use strict';
const { createCoreService } = require('@strapi/strapi').factories;
const { setLocalDateTime } = require('../../../utils/formaters/setLocalDateTime');
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
        populate: ['shipping', 'shipping_details', 'user'],
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

        console.log(tracking_code);
        

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
        await generateLabel("901277226",tracking_code)
        //await generateDistpatch("901277226",tracking_code)

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
  },

  async cashOnDelivery(data) {
    try {
      const { phone_number, identify_number, identification_type, full_name, razon_social, email, payment_method } = data
      validateData(data);

      const order = await strapi.entityService.findMany('api::order.order', {
        filters: {
          user: {
            phone_number: { $eq: phone_number }
          },
          status: { $neq: "completed" }
        },
        populate: ['shipping', 'shipping_details', "user"],
      });

      if (order.length == 0) {
        throw new Error('Order not found.');
      }

      let payment;
      payment = await strapi.entityService.findMany('api::payment.payment', {
        filters: { identify_number: { $eq: identify_number } },
      })

      if (payment.length == 0) {
        payment = await strapi.entityService.create('api::payment.payment', {
          data: {
            full_name: full_name,
            phone_number: phone_number.replace("+", ""),
            identify_number: identify_number,
            identification_type: identification_type,
            razon_social: razon_social ? razon_social : full_name,
            user: order[0].user.id,
            email: email,
          },
        });
      } else {
        payment = payment[0]
      }

      const transaction_id = `TR${Math.floor(100000 + Math.random() * 900000)}${order[0].id}`
      const taxes = 0;
      const total = taxes + order[0].total;
      const newTransaction = await strapi.entityService.create('api::transaction.transaction', {
        data: {
          transaction_id: transaction_id,
          order: order[0].id,
          transaction_date: setLocalDateTime(),
          payment_id: transaction_id.replace("TR",""),
          payment_method: "PAGO CONTRAENTREGA",
          status: "completed",
          taxes: taxes,
          subtotal: order[0].total,
          total: total,
          user: order[0].user.id,
          payment: payment.id
        },
      })

      const tracking_code = await getTrackingCode(order[0], true, payment_method)

      await strapi.entityService.update('api::order.order', order[0].id, {
        data: {
          status: "completed",
          logistics_provider: "COORDINADORA",
          tracking_code: tracking_code
        },
      });

      await createTransaction("xeletiene", transaction_id)
      return newTransaction
    } catch (error) {
      console.error('We have problems creating a new transaction', error.details?.errors);
      throw error;
    }
  }
}));


function isValidString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function validateData(data) {
  const { phone_number, identify_number, identification_type, full_name, email } = data;

  if (!isValidString(phone_number)) {
      throw new Error("the phone number is not valid");
  }
  if (!isValidString(identify_number)) {
      throw new Error("the identify number is not valid");
  }
  if (!isValidString(identification_type)) {
      throw new Error("the identification type is not valid");
  }
  if (!isValidString(full_name)) {
      throw new Error("the full name is not valid");
  }
  if (!isValidString(email)) {
      throw new Error("the email is not valid");
  }
}