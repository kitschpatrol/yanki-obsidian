import { knipConfig } from '@kitschpatrol/knip-config'

export default knipConfig({
	ignore: ['examples/**/*'],
	// Installed separately to manage the desktop test's Python environment.
	ignoreBinaries: ['uv'],
	ignoreDependencies: [
		'@kitschpatrol/typescript-config',
		// Supplied by Obsidian inside executeObsidian callbacks.
		'electron',
		'entities',
		'moment',
		'type-fest',
		'yanki',
	],
})
