import { eslintConfig } from '@kitschpatrol/eslint-config'

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
)
