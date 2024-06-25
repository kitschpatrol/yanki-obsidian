import sharedConfig, { overrideRules } from '@kitschpatrol/remark-config'

const localConfig = {
	...sharedConfig,
	plugins: overrideRules(sharedConfig.plugins, [
		['remark-lint-no-undefined-references', false],
		['remark-lint-maximum-heading-length', 80],
		['remark-lint-no-file-name-irregular-characters', false],
	]),
}

export default localConfig
