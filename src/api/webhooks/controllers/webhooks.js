'use strict';
const { closeLiveChat } = require("../../../utils/webhooks/closeLiveChat")
/**
 * encoder controller
 */

module.exports = {
  async closeChat(ctx) {
    try {     
      if(ctx.request.body.status !== "resolved"){
        ctx.send({
          message: 'LiveChat only will be closed if the status is resolved',
          data: null
        });
      }
      
      const phoneNumber = ctx.request.body.contact_inbox.source_id 
      
      const closeChat = await closeLiveChat(phoneNumber);
  
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