import type { PluginManifest } from 'obsidian'
import fs from 'node:fs/promises'
import packageJson from '../package.json'

const inferredManifest = {
	author: packageJson.author.name,
	authorUrl: packageJson.author.url,
	description: packageJson.description,
	id: packageJson.name,
	version: packageJson.version,
}

const manifest: PluginManifest = { ...inferredManifest, ...packageJson.obsidian }

await fs.mkdir('./dist', { recursive: true })
await fs.writeFile('./dist/manifest.json', JSON.stringify(manifest, undefined, 2))

// Obsidian's plugin review process also seems to require the manifest.json to
// be in the root of the repository, even though it's also in the release...
await fs.writeFile('./manifest.json', `${JSON.stringify(manifest, undefined, 2)}\n`)

console.log(`Generated Obsidian manifest.json file.`)
