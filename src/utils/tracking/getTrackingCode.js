const axios = require("axios");

async function getTrackingCode(order) {
  const url = `${process.env.TRACKING_URL}/coordinadora/generate-waybill`
  const { shipping } = order
  
  const department = shipping.city.toLowerCase() === "bogota" ? "cundinamarca" : shipping.department

  try {
    const body = {
      "nit": "901277226",
      "id_client": "50616",
      "recipient": {
        "nit": "",
        "div": "1",
        "full_name": shipping.full_name,
        "address": (shipping.address_line_2 && shipping.address_line_2 != "") ? `${shipping.address_line_1} ${shipping.address_line_2}` : shipping.address_line_1,
        "city": await getCoordinadoraCode(shipping.city, department),
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
      "user": "xeletiene.ws",
      "password": "3f9f3d445cb9d2b4c7aeaf2a841bcd1502abfc78258e6df3027aa7bb9a19c41a"
    }    

    const response = await axios.post(url, body)    
    if (response.data.error == null) {
      return response.data.data.codigo_remision
    } else {
      throw new Error(`Error generating waybill: ${response.data.error}`);
    }
  } catch (error) {
    throw new Error(`Error generating waybill: ${error.message}`);
  }
}

async function getCoordinadoraCode(city, department) {
  const url = `${process.env.TRACKING_URL}/city-code/getCoordinadoraCityCode`
  try {
    const response = await axios.post(url, {
      city: city,
      department: department
    })
    
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