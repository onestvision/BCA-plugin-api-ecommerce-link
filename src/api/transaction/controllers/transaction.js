'use strict';

/**
 * transaction controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::transaction.transaction', ({ strapi }) => ({
  async processPayment(ctx) {
    const { event, data } = ctx.request.body;
    try {
      if (event == "transaction.updated") {
        return await strapi.service('api::transaction.transaction').processPayment(data);
      }
      return ctx.badRequest()
    } catch (error) {
      console.log(error);
    }
  },
  async cashOnDelivery(ctx) {
    const headers = {
      sessionId: ctx.request.headers['x-session-id'],
      userPhone: ctx.request.headers['x-user-phone'],
      clientId: ctx.request.headers['x-client-id']
    };
    try {
      return await strapi.service('api::transaction.transaction').cashOnDelivery(ctx.request.body, headers);
    } catch (error) {
      console.log(error);
    }
  },
}
));
