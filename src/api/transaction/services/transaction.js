'use strict';
const { createCoreService } = require('@strapi/strapi').factories;
const { createTransaction } = require('../../../utils/kasoft/createTransaction');
const { sendWhatsAppMessage } = require("../../../utils/messageSender/sendMessage");

module.exports = createCoreService('api::transaction.transaction', ({ strapi }) => ({
  async processPayment(data) {
    try {
      const { transaction } = data;

      const { payment_link_id, shipping_address, customer_data, amount_in_cents, status, finalized_at, id, payment_method_type } = transaction;

      const order = await strapi.entityService.findMany('api::order.order', {
        filters: { link: { $eq: payment_link_id } },
        populate: 'user',
      });

      if (order.length == 0) {
        throw new Error('Orden no encontrada.');
      }
      
      const user = order[0].user;
      
      let customer;
      if (shipping_address) {
        customer= await strapi.entityService.findMany('api::customer.customer', {
          filters: { identify_number: { $eq: customer_data.customer_references[0].value.trim() } },
        })
        
        if (customer.length == 0) {
          const { full_name } = customer_data;
          const address = `${shipping_address.address_line_1} ${shipping_address.address_line_2}`;
          const department_code = shipping_address.region === 'departments["CO-DC"]' ? 'Bogota D.C' : shipping_address.region;
          
          customer = await strapi.entityService.create('api::customer.customer', {
            data: {
              full_name,
              phone_number: customer_data.phone_number.replace("+", ""),
              identify_number: customer_data.customer_references[0].value.trim(),
              identification_type: customer_data.customer_references[1].value ? "NIT" : "CC",
              address,
              razon_social: customer_data.customer_references[1].value ? customer_data.customer_references[1].value : full_name,
              department_code,
              city_code: shipping_address.city,
              country: shipping_address.country,
              user: user.id,
              email: user.email,
            },
          });
        } else {
          customer = customer[0]
        }
      }

      const taxes = 0;
      const subtotal = amount_in_cents / 100;
      const total = taxes + subtotal;
      const transactionStatus = status === "APPROVED" ? "completed" : status === "DECLINED" ? "failed" : "canceled";
      const transaction_id = `TR${Math.floor(100000 + Math.random() * 900000)}${order[0].id}`
      const newTransaction = await strapi.entityService.create('api::transaction.transaction', {
        data: {
          transaction_id: transaction_id,
          order: order[0].id,
          transaction_date: finalized_at,
          payment_id: id,
          payment_method: payment_method_type,
          status: transactionStatus,
          taxes,
          subtotal,
          total,
          customer: customer?.id || null,
        },
      });

      const message = status === "APPROVED" 
                      ? `¡Tu pago ha sido procesado con éxito para la orden ${order[0].order_id}! 🎊 El comprobante de tu transacción es ${transaction_id}. ¡Gracias por elegirnos! 🌟` 
                      : "Ha ocurrido un error con tu pago. 😔 Te pedimos que lo intentes de nuevo en unos minutos. Si persiste el problema, no dudes en contactarnos. ¡Gracias por tu paciencia!"

      await sendWhatsAppMessage("Xeletiene",message, user.phone_number)

      
      if (status === "APPROVED") {
        await strapi.entityService.update('api::order.order', order[0].id, {
          data: { status: "Completed" },
        });
        //await createTransaction(transaction_id);
      }
      return newTransaction
    } catch (error) {
      console.error('Errores de validación:', error.details?.errors);
      throw error;
    }
  }
}));
