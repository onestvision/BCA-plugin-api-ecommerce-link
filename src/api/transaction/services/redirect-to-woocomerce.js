const axios = require("axios");

module.exports = async function redirectToWoocomerce(body) {
  const checkout_url = process.env.WOOCOMMERCE_CHECKOUT_LINK;

  if (!checkout_url) {
    console.error("WOOCOMMERCE_CHECKOUT_LINK is not defined in environment variables.");
    throw new Error("Missing WooCommerce checkout URL.");
  }

  try {
    const response = await axios.post(checkout_url, body);
    return response.data;
  } catch (error) {
    console.error("Error sending request to WooCommerce:", error.response?.data || error.message);
    throw new Error("Failed to process WooCommerce checkout.");
  }
}