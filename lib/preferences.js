'use strict'

const { existsSync, readFileSync } = require('fs')
const { parseString } = require('xml2js')
const { DYNAMO_HOST, DYNAMO_VERSION } = require('../config/config')

const readPreferences = async () => {
  const PREFERENCES_FILE = `${process.env.APPDATA}\\Dynamo\\${DYNAMO_HOST}\\${DYNAMO_VERSION}\\DynamoSettings.xml`
  if (!existsSync(PREFERENCES_FILE)) {
    console.error(
      'Preferences file was not found in',
      PREFERENCES_FILE,
      'Please make sure Dynamo is installed.'
    )
    process.exit(1)
  }

  const data = readFileSync(PREFERENCES_FILE, { encoding: 'utf8' })
  return await new Promise((resolve, reject) =>
    parseString(data, (err, res) => {
      if (err) reject(err)
      else resolve(res)
    })
  )
}

module.exports = { readPreferences: readPreferences }
