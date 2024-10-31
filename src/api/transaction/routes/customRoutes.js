module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/transactions/payment',
      handler: 'transaction.processPayment',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/transactions/cashOnDelivery',
      handler: 'transaction.cashOnDelivery',
      config: {
        policies: [],
        middlewares: [],
      },
    }
  ],
};