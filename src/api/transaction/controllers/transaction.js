'use strict';
const { redirectToWoocomerce } = require("../services/redirect-to-woocomerce.js");

/**
 * transaction controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::transaction.transaction', ({ strapi }) => ({
  async processPayment(ctx) {
    const { event, data } = ctx.request.body;
    try {
      if (event == "transaction.updated") {
        if (data.transaction.redirect_url.startsWith("https://api.whatsapp.com")) {
          console.log("redirecting to Ecomchat")
          //return await strapi.service('api::transaction.transaction').processPayment(data);
        } else if (data.transaction.redirect_url.startsWith("https://xeletiene.com")) {
          console.log("redirecting to Woocommerce")
          //return await redirectToWoocomerce(ctx.request.body);
        }
      }
      return ctx.badRequest()
    } catch (error) {
      console.error(error);
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
      console.error(error);
    }
  },
}
));
