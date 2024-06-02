import sharedConfig, { overrideRules } from '@kitschpatrol/remark-config'

const localConfig = {
	...sharedConfig,
	plugins: overrideRules(sharedConfig.plugins, [
		['remarkValidateLinks', { repository: false }],
		['remark-lint-no-undefined-references', false],
		['remark-lint-no-duplicate-headings', false],
	]),
}

export default localConfig
