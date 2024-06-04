import packageJson from '../package.json'
import fs from 'node:fs/promises'
import type { PluginManifest } from 'obsidian'

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
// be in the root of the repository, even though it's in the release...
await fs.writeFile('./manifest.json', JSON.stringify(manifest, undefined, 2))

console.log(`Generated Obsidian manifest.json file.`)
