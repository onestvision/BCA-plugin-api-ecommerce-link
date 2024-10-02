'use strict';

/**
 * encoder router
 */

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/encrypt',
      handler: 'encoder.encrypt',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};