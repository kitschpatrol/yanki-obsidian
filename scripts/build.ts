import builtins from 'builtin-modules'
import esbuild from 'esbuild'
import process from 'node:process'

const banner = `/*
This is a generated source file!
If you want to view the original source code, please visit:
https://github.com/kitschpatrol/yanki-obsidian
*/
`

const production = process.argv[2] === 'production'

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
	outfile: 'dist/main.js',
	sourcemap: production ? false : 'inline',
	target: 'es2020',
	treeShaking: true,
})

await (production ? context.rebuild() : context.watch())
