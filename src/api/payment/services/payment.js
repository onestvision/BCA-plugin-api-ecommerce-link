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
          amount_in_cents: data.amount * 100, // La cantidad debe estar en centavos
          currency: 'COP',
          customer_email: data.email,
          payment_method: {
            type: 'CARD',
            token: data.token, // Token generado en el frontend con la tarjeta
          },
          reference: data.reference,
          redirect_url: 'https://tu-sitio.com/confirmacion-pago', // URL de confirmación de pago
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.WOMPI_PRIVATE_KEY}`, // Tu Private Key
          },
        }
      );
      return response.data;
    } catch (error) {
      throw new Error('Error al procesar el pago con Wompi', error);
    }
  },  
};
