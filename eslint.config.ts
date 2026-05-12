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
		files: ['README.md', 'examples/**/*.md'],
		rules: {
			'unicorn/filename-case': 'off',
		},
	},
	// Obsidian plugin guidelines — matches the rule set used by the Obsidian
	// plugin scanner. See https://github.com/obsidianmd/eslint-plugin.
	//
	// We register the plugin and apply its rules directly rather than spreading
	// `obsidianmd.configs.recommended`. The recommended config bundles in
	// typescript-eslint, eslint-plugin-import, eslint-plugin-depend,
	// @microsoft/sdl, and no-unsanitized, all of which are already configured
	// by @kitschpatrol/eslint-config — registering them twice triggers
	// "Cannot redefine plugin" errors.
	{
		files: ['src/**/*.js', 'src/**/*.jsx', 'src/**/*.ts', 'src/**/*.tsx'],
		plugins: { obsidianmd },
		rules: {
			'obsidianmd/commands/no-command-in-command-id': 'error',
			'obsidianmd/commands/no-command-in-command-name': 'error',
			'obsidianmd/commands/no-default-hotkeys': 'error',
			'obsidianmd/commands/no-plugin-id-in-command-id': 'error',
			'obsidianmd/commands/no-plugin-name-in-command-name': 'error',
			'obsidianmd/detach-leaves': 'error',
			'obsidianmd/editor-drop-paste': 'error',
			'obsidianmd/hardcoded-config-path': 'error',
			'obsidianmd/no-forbidden-elements': 'error',
			'obsidianmd/no-global-this': 'error',
			'obsidianmd/no-sample-code': 'error',
			'obsidianmd/no-static-styles-assignment': 'error',
			'obsidianmd/no-tfile-tfolder-cast': 'error',
			'obsidianmd/object-assign': 'error',
			'obsidianmd/platform': 'error',
			'obsidianmd/prefer-abstract-input-suggest': 'error',
			'obsidianmd/prefer-active-doc': 'warn',
			'obsidianmd/prefer-get-language': 'error',
			'obsidianmd/prefer-window-timers': 'error',
			'obsidianmd/regex-lookbehind': 'error',
			'obsidianmd/sample-names': 'error',
			'obsidianmd/settings-tab/no-manual-html-headings': 'error',
			'obsidianmd/settings-tab/no-problematic-settings-headings': 'error',
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
			'obsidianmd/no-plugin-as-component': 'error',
			'obsidianmd/no-unsupported-api': 'error',
			'obsidianmd/no-view-references-in-plugin': 'error',
			'obsidianmd/prefer-file-manager-trash-file': 'warn',
			'obsidianmd/prefer-instanceof': 'error',
		},
	},
)
