'use strict';

/**
 * order router
 */

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/orders/fromCart',
      handler: 'order.createOrder',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};