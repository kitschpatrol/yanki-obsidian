// TODO currently unused, revisit this...

import { readFileSync, writeFileSync } from 'node:fs'

const targetVersion = process.env.npm_package_version

if (targetVersion === undefined) {
	throw new Error('npm_package_version is undefined')
}

// Read minAppVersion from manifest.json and bump version to target version
const manifest = JSON.parse(readFileSync('manifest.json', 'utf8')) as Record<string, unknown>
const { minAppVersion } = manifest
manifest.version = targetVersion
writeFileSync('manifest.json', JSON.stringify(manifest, undefined, 2))

// Update versions.json with target version and minAppVersion from manifest.json
const versions = JSON.parse(readFileSync('versions.json', 'utf8')) as Record<string, unknown>
versions[targetVersion] = minAppVersion
writeFileSync('versions.json', JSON.stringify(versions, undefined, 2))
