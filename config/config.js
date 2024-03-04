'use strict'

const homedir = require('os').homedir()
const path = require('path')
const { writeFileSync, existsSync, mkdirSync } = require('fs')

const DYNAMO_VERSION = '3.0'
const BASE_URL = 'https://dynamopackages.com'
const DYNAMO_HOST = 'Dynamo Core'
const CACHE_DIR = path.join(homedir, '.cache', 'dpm')
const PACKAGES_CACHE = path.join(CACHE_DIR, 'packages.json')
const CACHE_DURATION = 3600000
const CONFIG_DIR = path.join(homedir, '.config', 'dpm')
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json')

const DYNAMO_CONFIG = {
  DYNAMO_VERSION: DYNAMO_VERSION,
  BASE_URL: BASE_URL,
  DYNAMO_HOST: DYNAMO_HOST,
  PACKAGES_CACHE: PACKAGES_CACHE,
  CACHE_DURATION: CACHE_DURATION
}

const COLUMNIFY_CONFIG = {
  name: { maxWidth: 50, truncate: false },
  id: { minWidth: 36, maxWidth: 36, truncate: false },
  version: { minWidth: 8, maxWidth: 10 },
  description: {
    minWidth: 25,
    maxWidth: 75,
    truncate: true,
    truncateMarker: '...'
  }
}

const CONFIG = { ...DYNAMO_CONFIG, ...{ COLUMNIFY_CONFIG } }

;(async () => {
  try {
    !existsSync(CACHE_DIR) && mkdirSync(CACHE_DIR, { recursive: true })
    !existsSync(CONFIG_DIR) && mkdirSync(CONFIG_DIR, { recursive: true })
    !existsSync(CONFIG_FILE) &&
      writeFileSync(CONFIG_FILE, JSON.stringify(CONFIG))
  } catch (error) {
    console.error(error)
  }
})()

module.exports = require(CONFIG_FILE)
