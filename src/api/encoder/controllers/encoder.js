'use strict';

/**
 * encoder controller
 */

module.exports = {
  // Endpoint personalizado
  async encrypt(ctx) {
    try {
      const { clientID, phoneNumbers } = ctx.request.body;
  
      // Validar que los datos estén presentes
      if (!clientID || !phoneNumbers) {
        return ctx.badRequest('Faltan datos: clientID o phoneNumber');
      }
  
      const dataJson = {
        clientID: clientID,
        phoneNumbers: phoneNumbers
      };
  
      
      const dataString = JSON.stringify(dataJson);
      console.log('Datos a cifrar:', dataString);
      
      const encoderData = await strapi.service('api::encoder.encoder').encrypt(dataString);
  
      ctx.send({
        message: 'Datos codificados correctamente',
        data: encoderData
      });
    } catch (err) {
      console.log(err);
      ctx.badRequest('Error al obtener datos externos', { error: err });
    }
  }
};