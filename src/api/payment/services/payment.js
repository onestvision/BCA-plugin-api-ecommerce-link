'use strict';
const axios = require('axios');

/*
 payment service
*/

module.exports = {
  async createPayment(data) {
    try {
      const response = await axios.post(
        `${process.env.WOMPI_URL}/transaction`,
        {
          amount_in_cents: data.amount * 100,
          currency: 'COP',
          customer_email: data.email,
          payment_method: {
            type: 'CARD',
            token: data.token,
          },
          reference: data.reference,
          redirect_url: 'https://www.google.com/',
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.WOMPI_PRIVATE_KEY}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      throw new Error('Error al procesar el pago con Wompi');
    }
  },  
};
