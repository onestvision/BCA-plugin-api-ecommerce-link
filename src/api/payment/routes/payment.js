'use strict';

/*
  payment router
*/

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/payment',
      handler: 'payment.processPayment',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};