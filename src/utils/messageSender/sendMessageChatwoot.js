const axios = require("axios")
const { generateRandomCode } = require("../formaters/generateRandomCode")

async function sendMessageChatwoot(phoneNumber, message, name) {
  try {
    const url = process.env.CHATWOOT_WEBHOOK_URL;
    console.log(url);
    const match = url.match(/57\d{10}/);
    const receiverNumber = match ? match[0] : null;
    if (!receiverNumber) {
      throw new Error("Error fetching receiver number from webhook");
    }
    const body = {
      object: "whatsapp_business_account",
      entry: [
        {
          id: process.env.WHATSAPP_BUSINESS_ID,
          changes: [
            {
              field: "messages",
              value: {
                messaging_product: "whatsapp",
                metadata: {
                  display_phone_number: receiverNumber,
                  phone_number_id: process.env.WHATSAPP_PHONE_ID,
                },
                contacts: [
                  {
                    profile: {
                      name: name,
                    },
                    wa_id: `${phoneNumber}`,
                  },
                ],
                messages: [
                  {
                    from: `${phoneNumber}`,
                    id: generateRandomCode(receiverNumber),
                    timestamp: new Date().getTime(),
                    text: { body: message },
                    type: "text",
                  },
                ],
              },
            },
          ],
        },
      ],
    }
    const response = await axios.post(url, body, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    console.log(response)

  } catch (error) {
    throw error;
  }
}

module.exports = {
  sendMessageChatwoot,
}