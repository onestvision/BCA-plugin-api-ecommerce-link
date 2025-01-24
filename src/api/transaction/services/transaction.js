'use strict';
const { createCoreService } = require('@strapi/strapi').factories;
const { setLocalDateTime } = require('../../../utils/formaters/setLocalDateTime');
const { valueToString } = require('../../../utils/formaters/valueToString');
const { createTransaction } = require('../../../utils/kasoft/createTransaction');
const { updateOrder } = require('../../../utils/kasoft/updateOrder');
const { updateTransaction } = require('../../../utils/kasoft/updateTransaction');
const { sendWhatsAppInteractive } = require('../../../utils/messageSender/sendInteractive');
const { sendWhatsAppMessage } = require("../../../utils/messageSender/sendMessage");
const { sendWhatsAppSimpleTemplate } = require('../../../utils/messageSender/sendTemplate');
const { generateDistpatch } = require('../../../utils/tracking/generateDispatch');
const { generateLabel } = require('../../../utils/tracking/generateLabel');
const { getTrackingCode } = require('../../../utils/tracking/getTrackingCode');

const xeletiene_business = process.env.GATEWAY_BUSSINESS
const xeletiene_business_NIT = "901864903"
const xeletiene_contact_number = "573002319650"

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
        sendWhatsAppSimpleTemplate(xeletiene_business, "no_order_error_v2", {
          phone: xeletiene_contact_number,
          parameters: [id, finalized_at, customer_data.full_name]
        })
        throw new Error('Order not found.');
      }

      const user = order[0].user;
      if (user.email.includes("@correo.com")) {
        await strapi.entityService.update('plugin::users-permissions.user', user.id, {
          data: {
            username: customer_data.customer_references[0].value.trim(),
            email: customer_email
          }
        });
      }

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
        filters: { payment_id: { $contains: id.trim() } },
      })

      let newTransaction;
      let transaction_id;
      const taxes = 0;
      const subtotal = amount_in_cents / 100;
      const total = taxes + subtotal;
      const transaction_status = status === "APPROVED" ? "completed" : "failed";

      if (trans.length == 0) {
        newTrans = true
        newTransaction = await strapi.entityService.create('api::transaction.transaction', {
          data: {
            order: order[0].id,
            transaction_date: finalized_at,
            payment_id: `${id}-${Math.floor(10 + Math.random() * 90)}`,
            payment_method: payment_method_type,
            status: transaction_status,
            taxes,
            subtotal,
            total,
            user: user.id || null,
            payment: payment.id
          },
        });
        transaction_id = newTransaction.id
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
        await strapi.entityService.update('api::order.order', order[0].id, {
          data: {
            status: "pending",
            logistics_provider: "Generating tracking code..",
            tracking_code: "Generating tracking code.."
          },
        });

        const saveTransaction = newTrans ? await createTransaction("xeletiene", transaction_id) : await updateTransaction("xeletiene", transaction_id, transaction_status);

        const shippingValueMessage = order[0].shipping_value > 0 ? `$${valueToString(order[0].shipping_value)}` : "GRATIS"

        let address = order[0].shipping.address_line_1

        if (order[0].shipping.address_line_2) {
          address += ` ${order[0].shipping.address_line_2}`
        }

        address += `, ${order[0].shipping.city}, ${order[0].shipping.department}`

        const descriptionMessage = order[0].description
          .split('\n')
          .filter(line => line.trim() !== '')
          .map(line => `📌${line}`)
          .join('\n');

        if (saveTransaction["success"]) {
          const tracking_code = await getTrackingCode(order[0]);
          await strapi.entityService.update('api::order.order', order[0].id, {
            data: {
              status: "completed",
              logistics_provider: "COORDINADORA",
              tracking_code: tracking_code
            },
          });

          await updateOrder("xeletiene", order[0].order_id, "completed", tracking_code, "COORDINADORA")

          const message = `🎊 *¡${user.name}, Gracias por tu compra!* 🎊\nMe alegra informarte que tu pago ha sido procesado con éxito. El número de comprobante de tu transacción es *TRC${newTransaction.id}*.\n\n📦Aquí tienes los detalles de tu pedido:\n${descriptionMessage}\n\nSubtotal: $${valueToString(subtotal)}\nEnvio: ${shippingValueMessage}${taxesMessage}\n*Total: $${valueToString(total)}*\n\n📍Dirección de Entrega:${address}\n\n🚚Tu pedido fue enviado a travez de *COORDINADORA*.📦\nYo te mantendré al tanto de las novedades de tu envio 📲 pero siempre puedes rastrearlo con el número de guia: *${tracking_code}* 🔎\n\n😊Si tienes alguna pregunta o necesitas asistencia, no dudes en contactarme. ¡Estoy aquí para ayudarte!\n\n🌟 *¡${user.name} espero que disfrutes tu compra!* 🌟`

          await sendWhatsAppMessage(xeletiene_business, message, user.phone_number)

          //await generateLabel(xeletiene_business_NIT, tracking_code)
        } 

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
        await sendWhatsAppInteractive(xeletiene_business, message, user.phone_number, ["🔄Reintentar compra"])
      }

      return newTransaction
    } catch (error) {
      console.error('We have problems creating a new transaction');
      throw error;
    }
  },

  async cashOnDelivery(data, headers) {
    try {
      const { phone_number, identify_number, identification_type, full_name, razon_social, email, payment_method } = data;
      validateData(data);

      const order = await strapi.entityService.findMany('api::order.order', {
        filters: {
          user: {
            phone_number: { $eq: phone_number }
          },
          status: { $eq: "payment_pending" }
        },
        populate: ['shipping', 'shipping_details', "user"],
      });

      if (order.length === 0) {
        throw new Error('Order not found with status "payment_pending".');
      }

      if (order[0].user.email.includes("@correo.com")) {
        await strapi.entityService.update('plugin::users-permissions.user', order[0].user.id, {
          data: {
            username: identify_number,
            email: email
          }
        });
      }

      let payment = await strapi.entityService.findMany('api::payment.payment', {
        filters: { identify_number: { $eq: identify_number } },
      });

      if (payment.length === 0) {
        payment = await strapi.entityService.create('api::payment.payment', {
          data: {
            full_name: full_name,
            phone_number: phone_number.replace("+", ""),
            identify_number: identify_number,
            identification_type: identification_type,
            razon_social: razon_social || full_name,
            user: order[0].user.id,
            email: email,
          },
        });
      } else {
        payment = payment[0];
      }

      const taxes = 0;
      const total = taxes + order[0].total;
      const newTransaction = await strapi.entityService.create('api::transaction.transaction', {
        data: {
          order: order[0].id,
          transaction_date: setLocalDateTime(),
          payment_id: `${Math.floor(100000 + Math.random() * 900000)}${order[0].id}`,
          payment_method: "PAGO CONTRAENTREGA",
          status: "completed",
          taxes: taxes,
          subtotal: order[0].total,
          total: total,
          user: order[0].user.id,
          payment: payment.id
        },
      });
      await strapi.entityService.update('api::order.order', order[0].id, {
        data: {
          status: "pending",
          logistics_provider: "Generating tracking code..",
          tracking_code: "Generating tracking code.."
        },
      });

      const saveTransaction = await createTransaction("xeletiene", newTransaction.id);
      if (saveTransaction["success"]) {
        const tracking_code = await getTrackingCode(order[0], headers, true, payment_method);
        await strapi.entityService.update('api::order.order', order[0].id, {
          data: {
            status: "completed",
            logistics_provider: "COORDINADORA",
            tracking_code: tracking_code
          },
        });
        await updateOrder("xeletiene", order[0].order_id, "completed", tracking_code, "COORDINADORA")

        await generateLabel(xeletiene_business_NIT, tracking_code)

      }

      return newTransaction;
    } catch (error) {
      console.error("Error in cashOnDelivery:", error);
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
