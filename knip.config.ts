import { knipConfig } from '@kitschpatrol/knip-config'

export default knipConfig({
	ignore: ['examples/**/*'],
	ignoreDependencies: [
		'@kitschpatrol/typescript-config',
		'entities',
		'moment',
		'type-fest',
		'yanki',
	],
})
