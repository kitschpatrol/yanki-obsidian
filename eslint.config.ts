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
			overrides: {
				'json-package/valid-package-definition': 'off',
			},
		},
		ts: {
			overrides: {
				'import/no-named-as-default-member': 'off',
				'jsdoc/require-jsdoc': 'off',
				'no-new': 'off',
				'node/no-unpublished-import': 'off',
				'perfectionist/sort-classes': 'off',
				'ts/member-ordering': 'off',
				// TODO move this to shared-config
				'ts/naming-convention': [
					'error',
					{
						format: ['UPPER_CASE'],
						modifiers: ['const', 'exported'],
						selector: 'variable',
						// Not objects...
						types: ['boolean', 'string', 'number', 'array'],
					},
				],
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
