const axios = require('axios')

async function createTransaction(company,transaction_id, status) {
  const url = `${process.env.KASOFT_URL}/${company}/transactions/status`
  
  if (transaction_id == null || transaction_id.trim()=="") {
    throw new Error("transaccion id must not be null");
  }
  if (status == null || status.trim()=="") {
    throw new Error("status must not be null");
  }

  try {
   await axios.put(url, {
      transaction_id: transaction_id,
      status: status
    })
  } catch (error) {
    console.log(error)
  }
}

module.exports = { createTransaction };