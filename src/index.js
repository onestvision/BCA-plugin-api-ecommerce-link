'use strict';

module.exports = {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/*{ strapi }*/) { },

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  async bootstrap({ strapi }) {
    strapi.db.lifecycles.subscribe({
      async afterCreate(event) {
        const { model, result } = event;
        
        await strapi.entityService.update(model.uid, result.id, {
          data: { publishedAt: new Date() },
        });
      }
    })
  },
};
