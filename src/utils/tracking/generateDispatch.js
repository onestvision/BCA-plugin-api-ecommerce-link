const axios = require("axios");

async function generateDistpatch(tracking_code) {
  const url = `${process.env.TRACKING_URL}/coordinadora/generate-dispatch`
  try {
    const body = {
      "user": "xeletiene.ws",
      "password": "3f9f3d445cb9d2b4c7aeaf2a841bcd1502abfc78258e6df3027aa7bb9a19c41a",
      "tracking_codes": [
        tracking_code
      ]
    }
    const response = await axios.post(url, body)
    if (response.data.error != null) {
      throw new Error(`Error generating waybill: ${response.data.error}`);
    }
  } catch (error) {
    throw new Error(`Error generating waybill: ${error.message}`);
  }
}