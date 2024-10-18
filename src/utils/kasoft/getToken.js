const axios = require('axios')

async function getToken(company) {
  const url = `${process.env.KASOFT_URL}/auth/login`

  try {
    const response = await axios.post(url, {
      user: process.env.KASOFT_USER,
      secretKey: "APkknqM5YpK#cg!x!F6WH#",
      app:process.env.KASOFT_APP,
      company: company
    })    
    return response.data.data.token
  } catch (error) {
    console.log(error)
  }
}

module.exports = { getToken };