import { eslintConfig } from '@kitschpatrol/eslint-config'
import obsidianmd from 'eslint-plugin-obsidianmd'

export default eslintConfig(
	{
		html: {
			overrides: {
				'html/no-inline-styles': 'off',
			},
		},
		ignores: ['examples/Yanki Demo Vault/*'],
		json: {
			// We're not actually publishing an NPM package...
			overrides: {
				'json-package/require-files': 'off',
				'json-package/require-sideEffects': 'off',
				'json-package/valid-package-definition': 'off',
			},
		},
		ts: {
			overrides: {
				'no-new': 'off',
				// Array.prototype.reduce is the cleanest way to express several single-pass
				// accumulations in this codebase (template-tag interleaving, action-count
				// tallying, type-narrowed filtering). Refactoring to imperative loops or
				// chained filter/map calls hurts readability more than the rule helps.
				'unicorn/no-array-reduce': 'off',
				// String.prototype.replaceAll requires ES2021, but the build target is
				// still ES2020 for broad Obsidian runtime compatibility.
				'unicorn/prefer-string-replace-all': 'off',
			},
		},
	},
	{
		files: ['CONTRIBUTING.md', '**/README.md', 'examples/**/*.md'],
		rules: {
			'unicorn/filename-case': 'off',
		},
	},
	{
		files: ['test/**/*.ts', 'vitest*.ts'],
		rules: {
			// ExecuteObsidian serializes callbacks into another runtime: regexes
			// must stay inside those callbacks and work on older Electron versions.
			'e18e/prefer-static-regex': 'off',
			// Desktop test tooling runs on Node 24, independently of plugin engines.
			'node/no-unsupported-features/node-builtins': ['error', { version: '>=24.16.0' }],
			'require-unicode-regexp': ['error', { requireFlag: 'u' }],
			'test/no-standalone-expect': ['error', { additionalTestBlockFunctions: ['test'] }],
			// Environment and WebDriver capability names are external API contracts.
			'ts/naming-convention': 'off',
		},
	},
	{
		files: ['test/support/types.d.ts'],
		rules: {
			// Module augmentation requires interfaces for declaration merging.
			'ts/consistent-type-definitions': ['error', 'interface'],
		},
	},
	{
		files: ['test/vault/**/*.md'],
		rules: { 'unicorn/filename-case': 'off' },
	},
	// Follow upstream's rules-only presets, retaining our stricter overrides.
	// See https://github.com/obsidianmd/eslint-plugin.
	//
	// The full `obsidianmd.configs.recommended` also registers other plugins.
	// Its `depend` registration conflicts with @kitschpatrol/eslint-config
	// ("Cannot redefine plugin \"depend\""); its `import` registration also
	// overlaps our shared config's eslint-plugin-import-x namespace.
	// The rules-only presets avoid those registrations. General lint rules
	// continue to come from our shared config.
	{
		files: ['src/**/*.js', 'src/**/*.jsx', 'src/**/*.ts', 'src/**/*.tsx'],
		plugins: { obsidianmd },
		rules: {
			...obsidianmd.ruleConfigs.recommended,
			'obsidianmd/commands/no-command-in-command-id': 'error',
			'obsidianmd/commands/no-command-in-command-name': 'error',
			'obsidianmd/commands/no-default-hotkeys': 'error',
			'obsidianmd/commands/no-plugin-id-in-command-id': 'error',
			'obsidianmd/commands/no-plugin-name-in-command-name': 'error',
			'obsidianmd/editor-drop-paste': 'error',
			'obsidianmd/hardcoded-config-path': 'error',
			'obsidianmd/no-global-this': 'error',
			'obsidianmd/no-tfile-tfolder-cast': 'error',
			'obsidianmd/object-assign': 'error',
			'obsidianmd/prefer-abstract-input-suggest': 'error',
			'obsidianmd/prefer-active-doc': 'warn',
			'obsidianmd/prefer-get-language': 'error',
			'obsidianmd/prefer-window-timers': 'error',
			'obsidianmd/ui/sentence-case': [
				'error',
				{
					brands: ['Anki', 'AnkiConnect', 'AnkiWeb', 'Yanki'],
					enforceCamelCaseLower: true,
					ignoreWords: [
						// This text needs to match the case of the button it references
						'Sync',
					],
				},
			],
			'obsidianmd/validate-license': 'error',
			'obsidianmd/validate-manifest': 'error',
			'obsidianmd/vault/iterate': 'error',
		},
	},
	// Type-aware rules — require @typescript-eslint/parser with type info.
	{
		files: ['src/**/*.ts', 'src/**/*.tsx'],
		plugins: { obsidianmd },
		rules: {
			// The preset also includes @typescript-eslint/no-deprecated, which
			// our shared config already enables under the ts/ namespace.
			...Object.fromEntries(
				Object.entries(obsidianmd.ruleConfigs.recommendedTypeChecked).filter(([rule]) =>
					rule.startsWith('obsidianmd/'),
				),
			),
			'obsidianmd/prefer-instanceof': 'error',
		},
	},
)
