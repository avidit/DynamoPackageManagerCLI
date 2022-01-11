'use strict'

const { existsSync, readFileSync } = require('fs')
const { parseString } = require('xml2js')
const { PREFERENCES_FILE } = require('./config')

const readPreferences = async () => {
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
