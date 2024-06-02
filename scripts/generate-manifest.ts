import packageJson from '../package.json'
import fs from 'node:fs/promises'

type ObsidianManifest = {
	author: string
	authorUrl: string
	description: string
	helpUrl: string
	id: string
	isDesktopOnly: boolean
	minAppVersion: string
	name: string
	version: string
}

const manifest: ObsidianManifest = {
	author: packageJson.author.name,
	authorUrl: packageJson.author.url,
	description: packageJson.description,
	helpUrl: packageJson.homepage,
	id: packageJson.name,
	version: packageJson.version,
	...packageJson.obsidian,
}

await fs.mkdir('./dist', { recursive: true })
await fs.writeFile('./dist/manifest.json', JSON.stringify(manifest, undefined, 2))

console.log(`Generated Obsidian manifest.json file.`)
