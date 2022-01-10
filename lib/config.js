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

const COLUMNIFY_CONFIG = {
  name: { maxWidth: Infinity, truncate: false },
  id: { minWidth: 36, maxWidth: 36, truncate: false },
  version: { minWidth: 8, maxWidth: 10 },
  versions: { minWidth: 25, maxWidth: 25 },
  description: {
    minWidth: 25,
    maxWidth: 50,
    truncate: true,
    truncateMarker: '...'
  }
}

module.exports = { ...DYNAMO_CONFIG, ...{ COLUMNIFY_CONFIG } }
