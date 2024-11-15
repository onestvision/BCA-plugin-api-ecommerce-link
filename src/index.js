'use strict'

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
        const { model, result } = event
        
        await strapi.entityService.update(model.uid, result.id, {
          data: { publishedAt: new Date() },
        })
        
        if (model.uid == "api::order.order") {
          const order_id = `OC${result.id}`
          
          await strapi.entityService.update(model.uid, result.id, {
            data: { order_id: order_id },
          })
        }
        if (model.uid == "api::transaction.transaction") {
          const transaction_id = `TRC${result.id}`
          await strapi.entityService.update(model.uid, result.id, {
            data: { transaction_id: transaction_id },
          })
        }
      }
    })
  },
}
