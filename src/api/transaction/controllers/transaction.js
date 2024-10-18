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
  }
}
));
