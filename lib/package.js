'use strict'

const os = require('os')
const got = require('got')
const path = require('path')
const AdmZip = require('adm-zip')
const columnify = require('columnify')
const {
  createWriteStream,
  writeFileSync,
  existsSync,
  readdirSync,
  rmdirSync,
  statSync
} = require('fs')

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

const findAllInstalledPackages = async () => {
  try {
    const preferences = await readPreferences()
    const preferenceSettings = preferences.PreferenceSettings
    const customPackageFolders =
      preferenceSettings.CustomPackageFolders[0].string
    return customPackageFolders
      .filter((folder) => folder !== '%BuiltInPackages%')
      .map((folder) => {
        return folder.startsWith(process.env.APPDATA)
          ? path.join(folder, 'packages')
          : folder
      })
      .map((folder) => {
        return { name: folder, packages: findInstalledPackages(folder) }
      })
  } catch (error) {
    console.log(error.message)
  }
}

const getPackages = async () => {
  try {
    if (existsSync(PACKAGES_CACHE)) {
      const packages = require(PACKAGES_CACHE)
      const timestamp = packages.timestamp
      if (Date.now() - timestamp < CACHE_DURATION) {
        console.log('==> Reading from cache:', PACKAGES_CACHE)
        return packages
      }
    }

    console.log('==> Getting all packages')
    const response = await got(`${BASE_URL}/packages`).json()
    writeFileSync(PACKAGES_CACHE, JSON.stringify(response))
    return response
  } catch (error) {
    throw error.response.body
  }
}

const getPackageByName = async (name) => {
  try {
    const response = await got(
      `${BASE_URL}/package/dynamo/${encodeURIComponent(name)}`
    ).json()
    return response
  } catch (error) {
    throw error.response.body
  }
}

const getPackageById = async (id) => {
  try {
    const response = await got(`${BASE_URL}/package/${id}`).json()
    return response
  } catch (error) {
    throw error.response.body
  }
}

const getPackage = async (query) => {
  try {
    return await Promise.any([getPackageById(query), getPackageByName(query)])
  } catch (error) {
    throw new Error('Package not found')
  }
}

const listInstalledPackages = async () => {
  try {
    const pkgFolders = await findAllInstalledPackages()
    pkgFolders.forEach((pkgFolder) => {
      console.log('')
      console.log('==>', pkgFolder.name)
      if (pkgFolder.packages.length) {
        console.log(
          columnify(pkgFolder.packages, {
            columns: ['name', 'version', 'description'],
            columnSplitter: ' | ',
            config: COLUMNIFY_CONFIG
          })
        )
      } else {
        console.log('No packages found')
      }
    })
  } catch (error) {
    console.log(error.message)
  }
}

const searchPackage = async (query) => {
  try {
    const packages = await getPackages()
    const q = query.toLowerCase()
    console.log('==> Searching package by query:', q)
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

const listPackageDetails = async (query) => {
  try {
    const data = await getPackage(query)
    const content = data.content
    console.log('Name:', content.name)
    console.log('ID:', content._id)
    console.log('')
    console.log('Description:', content.description)
    console.log('')
    content.site_url && console.log('Site:', content.site_url)
    console.log('Maintainers:')
    content.maintainers.forEach((maintainer) => {
      console.log('-', maintainer.username)
    })
    content.license && console.log('License:', content.license)
    console.log('')
    console.log('Versions:', content.num_versions)
    console.log(
      'Latest:',
      content.versions[content.versions.length - 1].version
    )
  } catch (error) {
    console.log(error.message)
  }
}

const downloadPackage = async (query, version) => {
  try {
    const preferences = await readPreferences()
    const preferenceSettings = preferences.PreferenceSettings
    const packagePath = preferenceSettings.SelectedPackagePathForInstall[0]
    const data = await getPackage(query)
    const id = data.content._id
    const name = data.content.name
    const ver =
      version || data.content.versions[data.content.versions.length - 1].version
    const fileName = path.join(os.tmpdir(), `${id}.${ver}.zip`)
    console.log('==> Downloading package version:', ver)
    await got
      .stream(`${BASE_URL}/download/${id}/${ver}`)
      .on('error', (error) => {
        console.log('==> Failed to download file:', error.message)
      })
      .pipe(
        createWriteStream(fileName)
          .on('error', (error) => {
            console.error('==> Failed to write file:', error.message)
          })
          .on('finish', () => {
            console.log('==> File downloaded to:', fileName)
          })
      )
      .on('finish', () => {
        console.log('==> Extracting file', fileName, 'to', packagePath)
        const zip = new AdmZip(fileName)
        try {
          zip.extractAllTo(path.join(packagePath, name))
        } catch (error) {
          console.log(error.message)
        }
      })
  } catch (error) {
    console.log(error.message)
  }
}

const deletePackage = async (name) => {
  try {
    let res
    const pkgFolders = await findAllInstalledPackages()
    for (const pkgFolder of pkgFolders) {
      for (const pkg of pkgFolder.packages) {
        if (pkg.name === name) {
          res = pkg
          break
        }
      }
    }

    if (res) {
      console.log(
        '==> Uninstalling',
        res.name,
        res.version,
        'from',
        res.location
      )
      rmdirSync(res.location, { recursive: true })
    } else {
      console.log('Package not installed')
    }
  } catch (error) {
    console.log(error.message)
  }
}

module.exports = {
  list: listInstalledPackages,
  search: searchPackage,
  info: listPackageDetails,
  install: downloadPackage,
  uninstall: deletePackage
}
