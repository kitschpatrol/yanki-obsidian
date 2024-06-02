import builtins from 'builtin-modules'
import esbuild from 'esbuild'
import { copy } from 'esbuild-plugin-copy'
import process from 'node:process'

const banner = `/*
This is a generated source file!
If you want to view the original source code, please visit:
https://github.com/kitschpatrol/yanki-obsidian
*/
`

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
		...builtins,
	],

	format: 'cjs',
	logLevel: 'info',
	outbase: 'dist',
	outfile: 'dist/main.js',
	plugins: [
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
