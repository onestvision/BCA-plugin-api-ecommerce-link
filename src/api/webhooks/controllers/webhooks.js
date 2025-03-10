const { switchChat } = require("../services/switch-chat");

module.exports = {
  switchChats: async (ctx) => {
    try {
      const { origin } = ctx.request.params;
      let phoneNumber;
      let summary;
      let name;

      switch (origin) {
        case 'chatwoot':
          if (ctx.request.body.status !== 'resolved') {
            return 'The chat is not finished yet';
          }
          phoneNumber = ctx.request.body.contact_inbox.source_id;
          break;
        case 'chatbot':
          phoneNumber = ctx.request.body.phone_number;
          summary = ctx.request.body.summary;
          name = ctx.request.body.name;
          break;
        default:
          return ctx.badRequest(`${origin} is not a valid origin, try using chatbot or chatwoot`);
      }

      if (!phoneNumber) {
        return ctx.badRequest(400, "Phone number couldn't be obtained");
      }

      const switchResult = await switchChat(phoneNumber, origin, summary, name);

      return switchResult;
    } catch (error) {
      console.error(error);
      return ctx.badRequest(error.status || 500, error.message || 'Internal Server Error', error);
    }
  },
};
