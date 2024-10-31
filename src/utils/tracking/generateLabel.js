const axios = require("axios");

async function generateLabel(nit, tracking_code) {
  const url = `${process.env.TRACKING_URL}/coordinadora/generate-label`
  try {
    const body = {
      "nit": nit,
      "tracking_codes": [
        tracking_code
      ]
    }
    const response = await axios.post(url, body)
    if (response.data.error != null) {
      throw new Error(`Error generating label: ${response.data.error}`);
    }
  } catch (error) {
    throw new Error(`Error generating label: ${error.message}`);
  }
}
module.exports = { generateLabel };