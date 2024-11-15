const axios = require('axios')

async function sendWhatsAppInteractive(bussiness, message, phoneNumber, buttons) {
  const url = `${process.env.GATEWAY_URL}/WhatsApp/SendInteractive`

  if (message.trim() == "") {
    throw new Error("The message must not be empty")
  }

  if (buttons.length == 0) {
    throw new Error("There must be at least one button")
  }

  if (phoneNumber.trim() == "") {
    throw new Error("There must be at least one destination number")
  }

  try {
    await axios.post(url, {
      bussiness: bussiness,
      body: message.trim(),
      phoneNumbers: [phoneNumber.trim()],
      buttons: buttons
    })
  } catch (error) {
    console.error(error)
  }
}

module.exports = { sendWhatsAppInteractive };