import sharedConfig, { overrideRules } from '@kitschpatrol/remark-config'

const localConfig = {
	...sharedConfig,
	// Overrides are a special case, working as below (set `false` as the second element to disable):
	// plugins: overrideRules(sharedConfig.plugins, [['remark-lint-first-heading-level', 2]])
}

export default localConfig
