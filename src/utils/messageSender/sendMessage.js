const axios = require('axios')

async function sendWhatsAppMessage(bussiness, message, phoneNumber) {
  const url = process.env.GATEWAY_URL

  if (message.trim() == "") {
    throw new Error("The message must not be empty")
  }

  if (phoneNumber.trim() == "") {
    throw new Error("There must be at least one destination number")
  }

  try {
    await axios.post(`${url}/WhatsApp/SendMessage`, {
      bussiness: bussiness,
      message: message.trim(),
      phoneNumbers: [phoneNumber.trim()]
    })
  } catch (error) {
    console.log(error)
  }
}

module.exports = { sendWhatsAppMessage };