const axios = require("axios");

async function closeLiveChat(phone_number) {
  const {
    ORCHESTADOR_URL: urlBase,
    ORCHESTADOR_ONEST_BUSINESS_ID: onest_business_id,
    ORCHESTADOR_BUSINESS_ID: business_id,
    ORCHESTADOR_PHONE_ID: phone_id,
    ORCHESTADOR_WEBHOOK_ID: webhook_id,
  } = process.env;

  if (!urlBase || !onest_business_id || !business_id || !phone_id || !webhook_id) {
    throw new Error("Missing required environment variables");
  }

  const url = `${urlBase}/api/${onest_business_id}/business/${business_id}/phone/${phone_id}/user/${phone_number}`;

  try {
    const response = await axios.put(
      url,
      { webhook_id },
      { headers: { Authorization: "Bearer xeletiene" } }
    );
    

    if (!response.data?.status) {
      throw new Error(`Error closing livechat: ${response.data?.message || "Unknown error"}`);
    }

    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message;
    throw new Error(`Error closing livechat: ${errorMessage}`);
  }
}
module.exports = { closeLiveChat };