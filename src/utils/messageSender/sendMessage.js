const axios = require('axios')

async function sendWhatsAppMessage(bussiness, message, phoneNumber) {
  const url = `${process.env.GATEWAY_URL}/WhatsApp/SendMessage`

  if (message.trim() == "") {
    throw new Error("The message must not be empty")
  }

  if (phoneNumber.trim() == "") {
    throw new Error("There must be at least one destination number")
  }

  try {
    await axios.post(url, {
      bussiness: bussiness,
      message: message.trim(),
      phoneNumbers: [phoneNumber.trim()]
    })
  } catch (error) {
    console.error(error)
  }
}

module.exports = { sendWhatsAppMessage };