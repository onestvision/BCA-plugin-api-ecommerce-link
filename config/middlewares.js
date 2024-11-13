module.exports = ({ env }) => [
  'strapi::logger',
  'strapi::errors',
  'strapi::security',
  {
    name: 'strapi::cors',
    config: {
      origin: '*', // Permitir solicitudes desde cualquier dominio
      headers: [
        'Content-Type',
        'Authorization',
        'x-user-phone', // Añade aquí tus headers personalizados
        'x-client-id',
        'x-session-id',
      ],
    },
  },
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
  {
    name: 'global::logs-middleware',
  },
];