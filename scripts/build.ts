import type { Plugin } from 'esbuild'
import chokidar from 'chokidar'
import esbuild from 'esbuild'
import { copy } from 'esbuild-plugin-copy'
import fs from 'node:fs/promises'
import process from 'node:process'
import { generateManifest } from './generate-manifest'

// We assume our minimum specified Obsidian version 1.5.0 correlates with the
// following:
// - The closest release seems to be 1.5.3:
//   https://github.com/obsidianmd/obsidian-releases/releases/tag/v1.5.3
// This release is using Electron 25.8.1, Chromium 114, V8 11.4, and Node 18.15.0

const banner = `/*
This is a generated source file!
If you want to view the original source code, please visit:
https://github.com/kitschpatrol/yanki-obsidian
*/
`

const ignoreNodeModulesPlugin: Plugin = {
	name: 'ignore-node-modules',
	setup(build) {
		build.onResolve({ filter: /^node:.+$/ }, (args) => ({ external: true, path: args.path }))
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

		// Node 18 builtins
		// https://github.com/uncenter/builtin-modules-static/blob/main/lib/v18.js
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
	if (isRebuilding) return
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

if (production) {
	await triggerRebuild()
	// eslint-disable-next-line unicorn/no-process-exit
	process.exit(0)
} else {
	await triggerRebuild()

	console.log('Watching for changes...')
	const watcher = chokidar.watch('src', { ignoreInitial: true })

	watcher.on('all', (event, path) => {
		console.log(`Detected ${event} on ${path}. Scheduling rebuild...`)
		if (rebuildTimeout) clearTimeout(rebuildTimeout)
		rebuildTimeout = setTimeout(triggerRebuild, 100)
	})
}
