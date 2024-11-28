'use strict';
const { closeLiveChat } = require("../../../utils/webhooks/closeLiveChat")
/**
 * encoder controller
 */

module.exports = {
  async closeChat(ctx) {
    try {     
      const phoneNumber = ctx.request.body.visitor.username 
      
      const closeChat = closeLiveChat(phoneNumber);
  
      ctx.send({
        message: 'LiveChat closed correctly',
        data: closeChat
      });
    } catch (err) {
      console.error(err);
      ctx.badRequest('Error getting external data', { error: err });
    }
  }
};