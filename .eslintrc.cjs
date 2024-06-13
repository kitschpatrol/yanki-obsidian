/* eslint-disable perfectionist/sort-objects */
/* @type {import('eslint').Linter.Config} */
module.exports = {
	root: true,
	extends: ['@kitschpatrol/eslint-config'],
	// Overrides
	overrides: [
		{
			files: ['*/**'],
			rules: {
				'no-new': 'off',
				'perfectionist/sort-classes': 'off',
				'@typescript-eslint/member-ordering': 'off',
			},
		},
	],
}
