const axios = require('axios');
const { sendMessageChatwoot } = require('../../../utils/messageSender/sendMessageChatwoot');

async function switchChat(phoneNumber, origin, summary, name) {
  try {
    const orchestatorResponse = await changeChat(phoneNumber, origin);

    if (origin === 'chatbot') {
      const formattedPhoneNumber = phoneNumber.replace('+', '');
      await sendMessageChatwoot(formattedPhoneNumber, summary, name);
    }
    return orchestatorResponse;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`Request failed: ${error.response?.data}`);
    }
    throw error;
  }
};

async function changeChat(phoneNumber, chatType) {
  try {
    const urlBase = process.env.ORCHESTRATOR_URL;
    const onestBusinessId = process.env.ORCHESTRATOR_ONEST_BUSINESS_ID;
    const businessId = process.env.ORCHESTRATOR_BUSINESS_ID;
    const phoneId = process.env.ORCHESTRATOR_PHONE_ID;
    const sendToWebhookId =
      chatType === 'chatbot'
        ? process.env.ORCHESTRATOR_LIVECHAT_WEBHOOK
        : process.env.ORCHESTRATOR_CHATBOT_WEBHOOK
    const url = `${urlBase}/api/${onestBusinessId}/business/${businessId}/phone/${phoneId}/user/${phoneNumber}`;
    const body = {
      webhook_id: sendToWebhookId,
    };
    const { data } = await axios.put(url, body, {
      headers: {
        Authorization: 'Bearer ecommchat',
      },
    });
    if (!data.status) {
      throw new Error('Error changing chat type');
    }
    return data;
  } catch (error) {
    throw error;
  }
}

module.exports = {
  switchChat,
};