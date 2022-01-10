'use strict'

const DYNAMO_VERSION = '2.14'
const BASE_URL = 'https://dynamopackages.com'
const DYNAMO_HOST = 'Dynamo Core'
const PREFERENCES_FILE = `${process.env.APPDATA}\\Dynamo\\${DYNAMO_HOST}\\${DYNAMO_VERSION}\\DynamoSettings.xml`

const DYNAMO_CONFIG = {
  DYNAMO_VERSION: DYNAMO_VERSION,
  BASE_URL: BASE_URL,
  DYNAMO_HOST: DYNAMO_HOST,
  PREFERENCES_FILE: PREFERENCES_FILE
}

module.exports = { ...DYNAMO_CONFIG }
