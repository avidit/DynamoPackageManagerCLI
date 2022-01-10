'use strict'

const got = require('got')
const { BASE_URL } = require('./config')

const columnify = require('columnify')
const getHealth = async () => {
  try {
    const response = await got(`${BASE_URL}/health`).json()
    console.log(columnify(response, { showHeaders: false }))
  } catch (error) {
    console.log(error.response.body)
  }
}

module.exports = { health: getHealth }
