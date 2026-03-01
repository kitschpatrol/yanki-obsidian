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
