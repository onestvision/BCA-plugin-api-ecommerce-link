const axios = require('axios')

async function createTransaction(transaction_id) {
  
  if (transaction_id == null || transaction_id.trim()=="") {
    throw new Error("transaccion id must not be null");
  }

  const transaction = await strapi.entityService.findMany('api::transaction.transaction', {
    filters: { transaction_id: { $eq: transaction_id } },
    populate: 'user',
  });

  if (transaction.length == 0) {
    throw new Error('Orden no encontrada.');
  }
  try {
    console.log(transaction[0])
  } catch (error) {
    console.log(error)
  }
}

module.exports = { createTransaction };