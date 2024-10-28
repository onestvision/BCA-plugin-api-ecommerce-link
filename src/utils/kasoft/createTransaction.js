const axios = require('axios');
const { splitFullName } = require('../formaters/name');
const { getToken } = require('./getToken');

async function createTransaction(company, transaction_id) {
  const url = `${process.env.KASOFT_URL}/${company}/transactions`
  if (transaction_id == null || transaction_id.trim() == "") {
    throw new Error("transaccion id must not be null");
  }

  try {
    const transaction = await strapi.entityService.findMany('api::transaction.transaction', {
      filters: { transaction_id: { $eq: transaction_id } },
      populate: '*',
    });

    if (transaction.length == 0) {
      throw new Error('Orden no encontrada.');
    }
    const order = await strapi.entityService.findOne('api::order.order', transaction[0].order.id, {
      populate: ['product_orders.products', 'shipping'],
    });
    if (order.length == 0) {
      throw new Error('Orden not founds.');
    }

    const transactionSelected = transaction[0]
    const { product_orders, shipping } = order
    const { firstName, lastName } = splitFullName(transactionSelected.payment.full_name)

    const products = product_orders[0].products.map(product => {
      const unit_price = product.unit_price
      const amount = product.amount
      const product_id = Number(product.product_id)
      const variation_id = product.variation_id == null ? null : product.variation_id
      return {
        id_variacion: variation_id,
        id_producto: product_id,
        cantidad: amount,
        precio_unitario: unit_price,
      }
    })

    if (product_orders.length == 0) {
      throw new Error('Your order is void')
    }

    const body = {
      id_transaction: transactionSelected.transaction_id,
      cliente: {
        id: transactionSelected.payment.identify_number,
        razon_social: transactionSelected.payment.razon_social,
        nombres: firstName,
        apellidos: lastName,
        celular: transactionSelected.payment.phone_number,
        email: transactionSelected.payment.email,
        direccion: shipping.address,
        codigo_ciudad: shipping.city,
        codigo_departamento: shipping.department,
        pais: shipping.country,
        tipo_identificacion: transactionSelected.payment.identification_type,
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
      fecha_transaccion: transactionSelected.transaction_date,
      indicador_pago: transactionSelected.payment_id,
      metodo_pago: transactionSelected.payment_method,
      estado_transaccion: transactionSelected.status,
      impuestos: transactionSelected.taxes,
      total_neto: transactionSelected.subtotal,
      currency: "COP",
      total: transactionSelected.total,
    }

    const token = await getToken("xeletiene")
    const response = await axios.post(url, body, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    console.log(response);
    
    if (!response.data.success) {
      throw Error(`Error generating a Kasoft transaction: ${response.data.error}`)
    }
  } catch (error) {
    console.log(error)
  }
}

module.exports = { createTransaction };