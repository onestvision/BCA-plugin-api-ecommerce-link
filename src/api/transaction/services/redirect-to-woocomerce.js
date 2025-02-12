const axios = require("axios");

module.exports = async function redirectToWoocomerce(body) {
  try {
    const checkout_url = process.env.WOOCOMERCE_CHECKOUT_LINK
    await axios.post(checkout_url,{ body })
  } catch (error) {
    console.log(error)
  }
}