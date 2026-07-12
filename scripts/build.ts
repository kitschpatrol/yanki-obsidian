import type { Plugin } from 'esbuild'
import chokidar from 'chokidar'
import esbuild from 'esbuild'
import { copy } from 'esbuild-plugin-copy'
import fs from 'node:fs/promises'
import process from 'node:process'
import { generateManifest } from './generate-manifest'

// We assume our minimum specified Obsidian version 1.9.12 correlates with the
// following:
// - The closest release is version 1.9.12 from August 26, 2025:
//   https://github.com/obsidianmd/obsidian-releases/releases/tag/v1.9.12
// This release is using Electron 37.3.1, Chromium 138, V8 12.4, and Node 22.18.0

const banner = `/*
This is a generated source file!
If you want to view the original source code, please visit:
https://github.com/kitschpatrol/yanki-obsidian
*/
`

// eslint-disable-next-line require-unicode-regexp -- esbuild serializes filter flags into Go's `(?flags)` regexp syntax, which doesn't support 'v'
const NODE_MODULE_PREFIX = /^node:.+$/

const ignoreNodeModulesPlugin: Plugin = {
	name: 'ignore-node-modules',
	setup(build) {
		build.onResolve({ filter: NODE_MODULE_PREFIX }, (args) => ({ external: true, path: args.path }))
	},
}

// The `open` package (a transitive dependency via yanki-connect) is only used by
// yanki-connect's `launchAnkiApp()`, which auto-launches the Anki desktop app.
// This plugin disables `autoLaunch`, so that code path is never reached. `open`
// relies on Node's `child_process` and `fs` modules, which trip Obsidian's
// automated plugin review. Stubbing it out of the bundle removes those
// filesystem and shell-execution APIs entirely.
// eslint-disable-next-line require-unicode-regexp -- esbuild's Go regexp engine doesn't support the 'v' flag
const OPEN_MODULE = /^open$/
// eslint-disable-next-line require-unicode-regexp -- esbuild's Go regexp engine doesn't support the 'v' flag
const MATCH_ALL = /.*/
const stubOpenPlugin: Plugin = {
	name: 'stub-open',
	setup(build) {
		build.onResolve({ filter: OPEN_MODULE }, () => ({ namespace: 'stub-open', path: 'open' }))
		build.onLoad({ filter: MATCH_ALL, namespace: 'stub-open' }, () => ({
			contents: `
				const unsupported = () => {
					throw new Error('The "open" package is not bundled in the Yanki Obsidian plugin.')
				}
				export default unsupported
				export const openApp = unsupported
			`,
			loader: 'js',
		}))
	},
}

const production = process.argv.includes('production')

const context = await esbuild.context({
	banner: {
		js: banner,
	},
	bundle: true,
	entryPoints: ['./src/main.ts'],
	external: [
		'obsidian',
		'electron',
		'@codemirror/autocomplete',
		'@codemirror/collab',
		'@codemirror/commands',
		'@codemirror/language',
		'@codemirror/lint',
		'@codemirror/search',
		'@codemirror/state',
		'@codemirror/view',
		'@lezer/common',
		'@lezer/highlight',
		'@lezer/lr',

		// Node 20 builtins
		// https://github.com/uncenter/builtin-modules-static/blob/main/lib/v20.js
		'assert',
		'assert/strict',
		'async_hooks',
		'buffer',
		'child_process',
		'cluster',
		'console',
		'constants',
		'crypto',
		'dgram',
		'diagnostics_channel',
		'dns',
		'dns/promises',
		'domain',
		'events',
		'fs',
		'fs/promises',
		'http',
		'http2',
		'https',
		'inspector',
		'inspector/promises',
		'module',
		'net',
		'os',
		'path',
		'path/posix',
		'path/win32',
		'perf_hooks',
		'process',
		'punycode',
		'querystring',
		'readline',
		'readline/promises',
		'repl',
		'stream',
		'stream/consumers',
		'stream/promises',
		'stream/web',
		'string_decoder',
		'timers',
		'timers/promises',
		'tls',
		'trace_events',
		'tty',
		'url',
		'util',
		'util/types',
		'v8',
		'vm',
		'wasi',
		'worker_threads',
		'zlib',
	],
	format: 'cjs',
	logLevel: 'error',
	minify: production,
	outbase: 'dist',
	outfile: 'dist/main.js',
	platform: 'browser',
	plugins: [
		ignoreNodeModulesPlugin,
		stubOpenPlugin,
		copy({
			assets: { from: ['./src/**/*.css'], to: ['./'] },
		}),
	],
	sourcemap: production ? false : 'inline',
	target: 'es2020',
	treeShaking: true,
})

// Debounce mechanism variables
// eslint-disable-next-line ts/no-restricted-types, unicorn/no-null
let rebuildTimeout: NodeJS.Timeout | null = null
let isRebuilding = false

async function triggerRebuild(): Promise<void> {
	if (isRebuilding) {
		return
	}

	isRebuilding = true
	console.log('Rebuilding...')
	try {
		await context.rebuild()
		await generateManifest()

		console.log('Rebuild complete.')
		console.log('Copying files to demo vault...')

		await fs.mkdir('./examples/Yanki Demo Vault/.obsidian/plugins/yanki', { recursive: true })
		const distributionFiles = await fs.readdir('./dist')
		for (const file of distributionFiles) {
			await fs.copyFile(
				`./dist/${file}`,
				`./examples/Yanki Demo Vault/.obsidian/plugins/yanki/${file}`,
			)
		}

		// Create or update a .hotreload file in the demo vault to indicate a rebuild has occurred
		await fs.writeFile(
			'./examples/Yanki Demo Vault/.obsidian/plugins/yanki/.hotreload',
			new Date().toISOString(),
		)

		console.log('Files copied.')
	} catch (error) {
		console.error('Rebuild failed:', error)
	} finally {
		isRebuilding = false
	}
}

await triggerRebuild()

if (production) {
	// eslint-disable-next-line unicorn/no-process-exit
	process.exit(0)
} else {
	console.log('Watching for changes...')
	const watcher = chokidar.watch('src', { ignoreInitial: true })

	watcher.on('all', (event, path) => {
		console.log(`Detected ${event} on ${path}. Scheduling rebuild...`)
		if (rebuildTimeout) {
			clearTimeout(rebuildTimeout)
		}

		rebuildTimeout = setTimeout(() => {
			void triggerRebuild()
		}, 100)
	})
}
