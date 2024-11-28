const axios = require("axios");

async function closeLiveChat(phone_number) {
  const urlBase = process.env.ORCHESTADOR_URL
  const onest_business_id = process.env.ORCHESTADOR_ONEST_BUSINESS_ID
  const business_id = process.env.ORCHESTADOR_BUSINESS_ID
  const phone_id = process.env.ORCHESTADOR_PHONE_ID
  const webhook_id = process.env.ORCHESTADOR_WEBHOOK_ID
  const url = `${urlBase}/api/${onest_business_id}/business/${business_id}/phone/${phone_id}/user/${phone_number}`
  try {
    const body = {
      "webhook_id": webhook_id
    }
    const response = await axios.put(url, body,{
      headers:{
        Authorization: "Bearer xeletiene"
      }
    })
    if (!response.data.status) {
      throw new Error(`Error closing livechat: ${response.data.error}`);
    }
    return response
  } catch (error) {
    throw new Error(`Error closing livechat: ${error.message}`);
  }
}
module.exports = { closeLiveChat };