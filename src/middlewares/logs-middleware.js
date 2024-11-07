const logsMiddleware = (config, { strapi }) => {
    return async (ctx, next) => {
      // La ruta debe comenzar con /api/ para ser registrada
      if (!ctx.url.startsWith('/api/')) {
        return await next();
      }
      // Capturar información de la solicitud (request)
      const requestType = ctx.method;
      const requestUrl = ctx.url;
      const requestHeaders = ctx.request.headers;
      const requestBody = ctx.request.body;
      const receiveDate = new Date();
      // Extraer la información de los headers
      const phoneNumber = requestHeaders['x-user-phone'] || null;
      const clientId = requestHeaders['x-client-id'] || null;
      // Ejecutar el siguiente middleware o controlador
      await next();
      // Capturar información de la respuesta (response)
      const responseStatus = ctx.status;
      const responseBody = ctx.body;
      const createDate = new Date();
  
      // Guardar el log en la base de datos de Strapi
      try {
        await strapi.entityService.create('api::log.log', {
          data: {
            RequestType: requestType,
            RequestUrl: requestUrl,
            ResponseStatus: responseStatus.toString(),
            CreateDate: createDate,
            ReceiveDate: receiveDate,
            RequestHeader: requestHeaders,
            RequestBody: requestBody,
            ResponseBody: responseBody,
            phone_number: phoneNumber,
            client_id: clientId,
          },
        });
      } catch (error) {
        console.error('Error al guardar el log:', error);
      }
    };
  };

module.exports = logsMiddleware;
  