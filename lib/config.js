'use strict'

const homedir = require('os').homedir()
const path = require('path')
const { writeFileSync, existsSync, mkdirSync } = require('fs')
const config = require('../config/config')

const CONFIG_DIR = path.join(homedir, '.config', 'dpm')
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json')

const listConfig = () => {
  try {
    console.log(config)
  } catch (error) {
    console.log(error.message)
  }
}

const getConfig = (key) => {
  const key_upper = key.toUpperCase()
  if (key_upper in config) {
    console.log(config[key_upper])
  } else {
    console.log(`${key} is not a valid config key.`)
  }
}

const setConfig = (key, value) => {
  try {
    console.log('old config:\n', config)
    config[key.toUpperCase()] = value
    console.log('new config:\n', config)
    !existsSync(CONFIG_DIR) && mkdirSync(CONFIG_DIR, { recursive: true })
    writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2))
  } catch (error) {
    console.log(error.message)
  }
}

module.exports = {
  listConfig: listConfig,
  getConfig: getConfig,
  setConfig: setConfig
}
