'use strict';

/**
 * order controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::order.order',({ strapi }) => ({
  async createOrder(ctx) {
    try {
      const { phone_number, products, discount, coupon, total } = ctx.request.body;
      
      if (!phone_number || phone_number.trim().length === 0){
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
      
      const newOrder = await strapi.service('api::order.order').createOrder(user[0].id, products, discount, coupon, total);
      
      return newOrder;
    } catch (error) {
      ctx.throw(500, error);
    }
  },
}));;
