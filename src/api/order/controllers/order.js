'use strict';

/**
 * order controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::order.order',({ strapi }) => ({
  async createOrder(ctx) {
    try {
      const { phone_number, products } = ctx.request.body;

      if (phone_number !== null && phone_number !== undefined && phone_number.trim().length > 0) {
        return ctx.badRequest('The "phone_number" field must be a non-null field.');
      }

      if (!products || !Array.isArray(products) || products.length === 0) {
        return ctx.badRequest('The "products" field must be a non-empty list.');
      }
      
      const user = await strapi.entityService.findMany('plugin::users-permissions.user', {
        filters: {
          phone_number: {
            $eq: phone_number.trim(),
          },
        },
      });
  
      if (user.length === 0) {
        return ctx.badRequest(`The user with phone number ${phone_number} not found.`);
      } 
      
      const newOrder = await strapi.service('api::order.order').createOrder(phone_number[0].id, products);
      
      return newOrder;
    } catch (error) {
      ctx.throw(500, error);
    }
  },
}));;
