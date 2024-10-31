const axios = require("axios");

async function generateDistpatch(nit, tracking_code) {
  const url = `${process.env.TRACKING_URL}/coordinadora/generate-dispatch`
  try {
    const body = {
      "nit": nit,
      "tracking_codes": [
        tracking_code
      ]
    }
    const response = await axios.post(url, body)
    if (response.data.error != null) {
      throw new Error(`Error generating distpatch: ${response.data.error}`);
    }
  } catch (error) {
    throw new Error(`Error generating distpatch: ${error.message}`);
  }
}
module.exports = { generateDistpatch };