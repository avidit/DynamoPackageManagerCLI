'use strict'

const path = require('path')
const columnify = require('columnify')
const { existsSync, readdirSync, statSync } = require('fs')

const { readPreferences } = require('./preferences')
const { COLUMNIFY_CONFIG } = require('./config')

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

module.exports = {
  list: listInstalledPackages
}
