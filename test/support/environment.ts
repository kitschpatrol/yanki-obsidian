import type { PluginManifest } from 'obsidian'
import fs from 'node:fs/promises'
import path from 'node:path'

/** Use the minimum supported installer for both minimum and latest app tests. */
export async function getTestEnvironment(environment: NodeJS.ProcessEnv = process.env) {
	const manifest = JSON.parse(
		await fs.readFile(path.resolve('dist/manifest.json'), 'utf8'),
	) as PluginManifest
	const appVersion = environment.YANKI_E2E_APP_VERSION ?? 'latest'
	const installerVersion = environment.YANKI_E2E_INSTALLER_VERSION ?? manifest.minAppVersion
	return {
		appVersion,
		installerVersion,
		resultsDirectory: path.resolve('test-results', `${appVersion}-${installerVersion}`),
	}
}
