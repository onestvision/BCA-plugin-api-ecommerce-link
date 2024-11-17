const axios = require('axios');
const { splitFullName } = require('../formaters/name');
const { getToken } = require('./getToken');

async function createTransaction(company, transaction_id) {
  const url = `${process.env.KASOFT_URL}/${company}/transactions`
  if (transaction_id == null || transaction_id == 0) {
    throw new Error("transaccion id must not be null");
  }

  try {
    const transaction = await strapi.entityService.findOne('api::transaction.transaction', transaction_id,{
      populate: '*',
    });
    if (transaction == null) {
      throw new Error('Orden no encontrada.');
    }
    const order = await strapi.entityService.findOne('api::order.order', transaction.order.id, {
      populate: ['product_orders.products', 'shipping'],
    });
    if (order.length == 0) {
      throw new Error('Orden not founds.');
    }

    const { product_orders, shipping } = order
    const { firstName, lastName } = splitFullName(transaction.payment.full_name)

    const products = product_orders[0].products.map(product => {
      const unit_price = product.unit_price
      const amount = product.amount
      const product_id = Number(product.product_id)
      const variation_id = product.variation_id == null ? null : product.variation_id
      return {
        Id_variacion: variation_id,
        Id_producto: product_id,
        Cantidad: amount,
        Precio_unitario: unit_price,
      }
    })

    if (product_orders.length == 0) {
      throw new Error('Your order is void')
    }

    const department = shipping.city.toLowerCase() === "bogota" && shipping.department.toLowerCase() === "cundinamarca" ? "Bogota D.C" : shipping.department

    const body = {
      id_transaction: transaction.transaction_id,
      cliente: {
        id: transaction.payment.identify_number,
        razon_social: transaction.payment.razon_social,
        nombres: firstName,
        apellidos: lastName,
        celular: transaction.payment.phone_number,
        email: transaction.payment.email,
        direccion: shipping.address_line_2 ? `${shipping.address_line_1} - ${shipping.address_line_2}` : shipping.address_line_1,
        codigo_ciudad: shipping.city,
        codigo_departamento: department,
        pais: shipping.country,
        tipo_identificacion: transaction.payment.identification_type,
      },
      order: {
        id: order.order_id,
        transportadora: order.logistics_provider,
        guia: order.tracking_code,
        estado_orden: order.status,
        cupon: order.coupon,
        discount: order.discount,
        subtotal: order.subtotal,
        total: order.total,
      },
      products: products,
      fecha_transaccion: transaction.transaction_date,
      indicador_pago: transaction.payment_id,
      metodo_pago: transaction.payment_method,
      estado_transaccion: transaction.status,
      impuestos: transaction.taxes,
      total_neto: transaction.subtotal,
      currency: "COP",
      total: transaction.total,
    }

    const token = await getToken("xeletiene")
    const response = await axios.post(url, body, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    
    if (!response.data.success) {
      throw Error(`Error generating a Kasoft transaction: ${response.data.error}`)
    }
    return response.data
  } catch (error) {
    console.error(error)
  }
}

module.exports = { createTransaction };