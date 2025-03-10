'use strict';

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/webhooks/switch-chat/:origin',
      handler: 'webhooks.switchChats',
      config: {
        auth: false,
        policies: [],
      },
    },
  ],
};