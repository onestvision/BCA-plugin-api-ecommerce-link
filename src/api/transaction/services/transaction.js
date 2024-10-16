'use strict';
/**
 * transaction service
 */

// @ts-ignore
const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::transaction.transaction', ({ strapi }) => ({
  async processPayment(data) {
    try {
      let customer;
      
      const order = await strapi.entityService.findMany('api::order.order', {
        filters: {
          link: {
            $eq: data.transaction.payment_link_id,
          },
        },
        populate: 'user'
      });
      
      if (data.transaction.shipping_address) {
        customer = await strapi.entityService.create('api::customer.customer', {
          data: {
            full_name: data.transaction.customer_data.full_name,
            phone_number: order[0].user.phone_number,
            identify_number: order[0].user.username,
            address: `${data.transaction.shipping_address.address_line_1} ${data.transaction.shipping_address.address_line_2}`,
            department_code: data.transaction.shipping_address.region == 'departments["CO-DC"]' ? "Bogota D.C" : data.transaction.shipping_address.region,
            city_code: data.transaction.shipping_address.city,
            country: data.transaction.shipping_address.country,
            user: order[0].user.id,
            email: order[0].user.email
          },
        });
      }

      const taxes = 0;
      const subtotal = data.transaction.amount_in_cents / 100;
      const transactionStatus = data.transaction.status == "APPROVED" ? "completed" : data.transaction.status == "DECLINED" ? "failed" : "canceled"
      await strapi.entityService.create('api::transaction.transaction', {
        data: {
          transaction_id: `TR${Math.floor(100000 + Math.random() * 900000)}`,
          order: order[0].id,
          transaction_date: data.transaction.finalized_at,
          payment_id: data.transaction.id,
          payment_method: data.transaction.payment_method_type,
          status: transactionStatus,
          taxes: taxes,
          subtotal: subtotal,
          total: taxes + subtotal,
          customer: customer.id
        },
      });

      if (data.transaction.status == "APPROVED") {
        await strapi.entityService.update('api::order.order', order[0].id, {
          data: {
            status: "Completed"
          }
        });
      }
    } catch (error) {
      console.log(error);
    }
  }
}
));
