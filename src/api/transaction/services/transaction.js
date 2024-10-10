'use strict';
/**
 * transaction service
 */

// @ts-ignore
const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::transaction.transaction', ({ strapi }) => ({
  async processPayment(data) {
    try {
      console.log(data.transaction.payment_link_id);
      
      const order = await strapi.entityService.findMany('api::order.order', {
        filters: {
          link: {
            $eq: data.transaction.payment_link_id,
          },
        },
      });
      console.log(order[0]);

      const taxes = 0;
      const subtotal = data.transaction.amount_in_cents / 100;
      const transactionStatus = data.transaction.status == "APPROVED" ? "Completed" : data.transaction.status == "DECLINED" ? "Failed" : "Canceled"

      await strapi.entityService.create('api::transaction.transaction', {
        data: {
          transaction_id: data.transaction.id,
          order: order[0].id,
          transaction_date: data.transaction.finalized_at,
          payment_method: data.transaction.payment_method_type,
          status: transactionStatus,
          taxes: taxes,
          subtotal: subtotal,
          total: taxes + subtotal
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
