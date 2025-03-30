import type { Plugin } from 'esbuild'
import esbuild from 'esbuild'
import { copy } from 'esbuild-plugin-copy'
import process from 'node:process'

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
		// 'entities',
		// 'open',
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

if (production) {
	await context.rebuild()
	// eslint-disable-next-line unicorn/no-process-exit
	process.exit(0)
} else {
	await context.watch()
}
