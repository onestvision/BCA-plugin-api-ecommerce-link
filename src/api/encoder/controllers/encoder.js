'use strict';

/**
 * encoder controller
 */

module.exports = {
  async encrypt(ctx) {
    try {      
      const dataString = JSON.stringify(ctx.request.body);
      
      const encoderData = await strapi.service('api::encoder.encoder').encrypt(dataString);
  
      ctx.send({
        message: 'Data encoded correctly',
        data: encoderData
      });
    } catch (err) {
      console.log(err);
      ctx.badRequest('Error getting external data', { error: err });
    }
  }
};