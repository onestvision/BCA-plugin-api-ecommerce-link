'use strict';

/**
  payment controller
*/

module.exports = {
  async processPayment(ctx) {
    try {
      const { amount, email, token, reference } = ctx.request.body;

      if (!amount || !email || !token || !reference) {
        return ctx.badRequest('Faltan datos para procesar el pago');
      }
      const paymentService = await strapi.service('api::encoder.encoder').encrypt(dataString);

      const paymentResult = await paymentService.createPayment({ amount, email, token, reference });

      return ctx.send(paymentResult);
    } catch (error) {
      return ctx.internalServerError('No se pudo procesar el pago', error);
    }
  }
}