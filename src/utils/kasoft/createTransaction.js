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
      Id_transaction: transaction.transaction_id,
      Cliente: {
        Id: transaction.payment.identify_number,
        Razon_social: transaction.payment.razon_social,
        Nombres: firstName,
        Apellidos: lastName,
        Celular: transaction.payment.phone_number,
        Email: transaction.payment.email,
        Direccion: shipping.address_line_2 ? `${shipping.address_line_1} - ${shipping.address_line_2}` : shipping.address_line_1,
        Codigo_ciudad: shipping.city,
        Codigo_departamento: department,
        Pais: shipping.country,
        Tipo_identificacion: transaction.payment.identification_type,
      },
      Order: {
        Id: order.order_id,
        Transportadora: order.logistics_provider,
        Guia: order.tracking_code,
        Estado_orden: order.status,
        Cupon: order.coupon,
        Discount: order.discount,
        Subtotal: order.subtotal,
        Total: order.total,
      },
      Products: products,
      Fecha_transaccion: transaction.transaction_date,
      Indicador_pago: transaction.payment_id,
      Metodo_pago: transaction.payment_method,
      Estado_transaccion: transaction.status,
      Impuestos: transaction.taxes,
      Total_neto: transaction.subtotal,
      Currency: "COP",
      Total: transaction.total,
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