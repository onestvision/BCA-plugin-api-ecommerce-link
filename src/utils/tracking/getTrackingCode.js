const axios = require("axios");

async function getTrackingCode(order, headers = null, cashOnDelivery = false, payment_method = "efectivo") {
  const token = process.env.TRACKING_API_TOKEN
  const url = `${process.env.TRACKING_URL}/coordinadora/generate-guide`
  const { shipping } = order

  headers = {
    ...headers,
    Authorization: `Bearer ${token}`,
  };
  try {
    const body = {
      "nit": "901864903",
      "id_client": "50616",
      "recipient": {
        "nit": "",
        "div": "1",
        "full_name": shipping.full_name,
        "address": (shipping.address_line_2 && shipping.address_line_2 != "") ? `${shipping.address_line_1} ${shipping.address_line_2}` : shipping.address_line_1,
        "city": await getCoordinadoraCode(shipping.city, shipping.department, headers),
        "phone": shipping.phone_number,
        "email": shipping.email
      },
      "shipping_info": {
        "declared_value": order.total,
        "content": order.description,
        "reference": order.order_id,
        "observations": ""
      },
      "shipping_details": order.shipping_details,
      "cashOnDelivery": cashOnDelivery,
      "cashOnDeliveryPaymentMethod": payment_method
    }

    const response = await axios.post(url, body, { headers })

    if (response.data["status"] === true) {
      strapi.entityService.create('api::user-activity.user-activity', {
        data: {
          user_phone: shipping.phone_number,
          session_id: "",
          activity_type: "generate_guide",
          app: "chatbot",
          activity_date: Date.now(),
          activity_data: response.data.data
        },
      })
      return response.data.data.codigo_remision
    }
    return `Error generating waybill: ${response.data.error}`
  } catch (error) {
    throw new Error(`Error generating waybill: ${error.message}`);
  }
}

async function getCoordinadoraCode(city, department, headers) {
  const url = `${process.env.TRACKING_URL}/city-code/getCoordinadoraCityCode`
  try {
    const response = await axios.post(url, {
      city: city,
      department: department
    }, { headers })

    if (response.data.error == null) {
      return response.data.data.dane_code
    } else {
      throw new Error(`Error retrieving the Dane codes: ${response.data.error}`);
    }
  } catch (error) {
    throw new Error(`Error retrieving the Dane codes: ${error.message}`);
  }
}

module.exports = { getTrackingCode };