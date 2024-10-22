const axios = require('axios');
const { splitFullName } = require('../formaters/name');
const { getToken } = require('./getToken');

async function createTransaction(company, transaction_id) {
  const url = `${process.env.KASOFT_URL}/${company}/transactions`
  if (transaction_id == null || transaction_id.trim() == "") {
    throw new Error("transaccion id must not be null");
  }

  const transaction = await strapi.entityService.findMany('api::transaction.transaction', {
    filters: { transaction_id: { $eq: transaction_id } },
    populate: '*',
  });

  if (transaction.length == 0) {
    throw new Error('Orden no encontrada.');
  }
  const order = await strapi.entityService.findOne('api::order.order', transaction[0].order.id, {
    populate: 'product_orders.products',
  });
  if (order.length == 0) {
    throw new Error('Orden not founds.');
  }

  const transactionSelected = transaction[0]
  const { product_orders } = order
  const { firstName, lastName } = splitFullName(transactionSelected.customer.full_name)

  const products = product_orders[0].products.map( product => {
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
      id: transactionSelected.customer.identify_number,
      razon_social: transactionSelected.customer.razon_social,
      nombres: firstName,
      apellidos: lastName,
      celular: transactionSelected.customer.phone_number,
      email: transactionSelected.customer.email,
      direccion: transactionSelected.customer.address,
      codigo_ciudad: transactionSelected.customer.city_code,
      codigo_departamento: transactionSelected.customer.department_code,
      pais: transactionSelected.customer.country,
      tipo_identificacion: transactionSelected.customer.identification_type,
    },
    order: {
      id: order.order_id,
      transportadora: "COORDINADORA",
      guia: "Numero de Guia Pendiente",
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

  try {
    const token = await getToken("xeletiene")
    await axios.post(url, body,{
      headers:{
        Authorization: `Bearer ${token}`
      }
    })
  } catch (error) {
    console.log(error)
  }
}

module.exports = { createTransaction };