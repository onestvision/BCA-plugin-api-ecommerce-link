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
    }
  ],
};