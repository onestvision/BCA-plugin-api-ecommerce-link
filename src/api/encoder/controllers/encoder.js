'use strict';
const { encrypt } = require("../../../utils/encoder/encrypt.js")
/**
 * encoder controller
 */

module.exports = {
  async encrypt(ctx) {
    try {
      
      const completeBody = {
        ...ctx.request.body,
        generateDate: Date.now(),
        tokenDuration: process.env.TOKEN_DURATION
      };

      const bodyString = JSON.stringify(completeBody);
      
      const encoderData = encrypt(bodyString);
  
      ctx.send({
        message: 'Data encoded correctly',
        data: encoderData
      });
    } catch (err) {
      console.error(err);
      ctx.badRequest('Error getting external data', { error: err });
    }
  }
};