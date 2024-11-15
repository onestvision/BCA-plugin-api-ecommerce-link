const axios = require('axios')

async function sendWhatsAppSimpleTemplate(bussiness, template, user) {
  const url = `${process.env.GATEWAY_URL}/WhatsApp/SendTemplate`

  if (template.trim() == "") {
    throw new Error("The template must not be empty")
  }

  if (user == null || user == undefined) {
    throw new Error("There must be at least one destination number")
  }

  try {
    await axios.post(url, {
      bussiness: bussiness,
      templateName: template.trim(),
      users: [user]
    })
  } catch (error) {
    console.error(error)
  }
}

module.exports = { sendWhatsAppSimpleTemplate };