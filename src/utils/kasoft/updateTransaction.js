const axios = require('axios');
const { getToken } = require('./getToken');

async function updateTransaction(company, transaction_id, status) {
  const url = `${process.env.KASOFT_URL}/${company}/transactions/status`

  if (transaction_id == null || transaction_id.trim() == "") {
    throw new Error("transaccion id must not be null");
  }
  if (status == null || status.trim() == "") {
    throw new Error("status must not be null");
  }

  try {
    const token = await getToken("xeletiene")
    await axios.put(url, {
      TransactionId: transaction_id,
      Status: status
    }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
  } catch (error) {
    console.log(error)
  }
}

module.exports = { updateTransaction };