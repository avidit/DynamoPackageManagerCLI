'use strict'

const got = require('got')
const { BASE_URL } = require('../config/config')

const columnify = require('columnify')
const getHealth = async () => {
  try {
    const response = await got(`${BASE_URL}/health`).json()
    console.log(columnify(response, { showHeaders: false }))
  } catch (error) {
    console.log(error.message)
  }
}

module.exports = { health: getHealth }
