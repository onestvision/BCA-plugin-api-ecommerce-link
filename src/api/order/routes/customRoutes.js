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
    {
      method: 'POST',
      path: '/orders/cancel',
      handler: 'order.cancelOrder',
      config: {
        policies: [],
        middlewares: [],
      },
    }
  ],
};