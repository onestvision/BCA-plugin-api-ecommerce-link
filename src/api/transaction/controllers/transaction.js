'use strict';

/**
 * transaction controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::transaction.transaction', ({ strapi }) => ({
  async processPayment(ctx) {
    const { event, data } = ctx.request.body;

    if (event == "transaction.updated") {
      await strapi.service('api::transaction.transaction').processPayment(data);
    }
  }
}
));
