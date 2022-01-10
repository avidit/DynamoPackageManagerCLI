'use strict'

const got = require('got')
const path = require('path')
const columnify = require('columnify')
const { writeFileSync, existsSync, readdirSync, statSync } = require('fs')

const { readPreferences } = require('./preferences')
const {
  BASE_URL,
  PACKAGES_CACHE,
  CACHE_DURATION,
  COLUMNIFY_CONFIG
} = require('./config')

const findInstalledPackages = (dir) => {
  return readdirSync(dir)
    .map((item) => path.join(dir, item))
    .filter((item) => statSync(item).isDirectory())
    .filter((item) => existsSync(path.join(item, 'pkg.json')))
    .map((item) => {
      const metadata = require(path.join(item, 'pkg.json'))
      metadata.location = item
      return metadata
    })
}

const listInstalledPackages = async () => {
  const preferences = await readPreferences()
  const preferenceSettings = preferences.PreferenceSettings
  const customPackageFolders = preferenceSettings.CustomPackageFolders[0].string
  customPackageFolders
    .filter((folder) => folder !== '%BuiltInPackages%')
    .forEach((folder) => {
      if (folder.startsWith(process.env.APPDATA)) {
        folder = path.join(folder, 'packages')
      }
      const pkgs = findInstalledPackages(folder)
      console.log(`\n==> ${folder}`)
      if (pkgs?.length) {
        console.log(
          columnify(pkgs, {
            columns: ['name', 'version', 'description'],
            columnSplitter: ' | ',
            config: COLUMNIFY_CONFIG
          })
        )
      } else {
        console.log('No packages found')
      }
    })
}

const getPackages = async () => {
  if (existsSync(PACKAGES_CACHE)) {
    const packages = require(PACKAGES_CACHE)
    const timestamp = packages.timestamp
    if (Date.now() - timestamp < CACHE_DURATION) {
      console.log(`==> reading from cache: ${PACKAGES_CACHE}`)
      return packages
    }
  }

  try {
    console.log('==> getting all packages')
    const response = await got(`${BASE_URL}/packages`).json()
    writeFileSync(PACKAGES_CACHE, JSON.stringify(response))
    return response
  } catch (error) {
    throw error.response.body
  }
}

const searchPackage = async (query) => {
  try {
    const packages = await getPackages()
    const q = query.toLowerCase()
    console.log(`==> searching package by query: ${q}`)
    const pkgs = packages.content.filter((pkg) => {
      const name = pkg.name.toLowerCase()
      return (
        name.includes(q) || pkg.keywords?.includes(q) || pkg._id?.includes(q)
      )
    })

    if (!pkgs.length) {
      console.log('No packages found')
      return
    }

    const columns = ['name', '_id', 'description']
    const res = pkgs.map((pkg) => {
      return columns.reduce((obj, key) => {
        const res = { ...obj, [key]: pkg[key] }
        return res
      }, {})
    })

    console.log(
      columnify(res, {
        showHeaders: true,
        headingTransform: (text) => text.replace('_', '').toUpperCase(),
        columns: columns,
        columnSplitter: ' | ',
        config: COLUMNIFY_CONFIG
      })
    )
  } catch (error) {
    console.error(error)
  }
}

module.exports = {
  list: listInstalledPackages,
  search: searchPackage
}
