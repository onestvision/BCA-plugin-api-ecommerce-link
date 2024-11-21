const axios = require('axios');
const { getToken } = require('./getToken');

async function updateOrder(company, order_id, status, guide, transporter) {
  const url = `${process.env.KASOFT_URL}/${company}/orders/transporter-info`

  if (order_id == null || order_id.trim() == "") {
    throw new Error("transaccion id must not be null");
  }
  if (status == null || status.trim() == "") {
    throw new Error("status must not be null");
  }

  try {
    const token = await getToken("xeletiene")
    await axios.put(url, {
      order_id: order_id,
      status: status,
      guide: guide,
      transporter: transporter
    }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
  } catch (error) {
    console.error(error)
  }
}

module.exports = { updateOrder };