'use strict';

/**
 * encoder router
 */

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/webhook/close-live-chat',
      handler: 'webhooks.closeChat',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};