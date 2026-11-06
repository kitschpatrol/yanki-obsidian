import { knipConfig } from '@kitschpatrol/knip-config'

export default knipConfig({
	ignore: ['examples/**/*'],
	// Installed separately to manage the desktop test's Python environment.
	ignoreBinaries: ['uv'],
	ignoreDependencies: [
		'@kitschpatrol/chagent', // Typically invoked through bumpp's --execute argument, which Knip doesn't parse
		// Supplied by Obsidian inside executeObsidian callbacks.
		'electron',
		'entities',
		'moment',
		'type-fest',
	],
})
