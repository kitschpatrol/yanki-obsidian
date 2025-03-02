import { knipConfig } from '@kitschpatrol/knip-config'

export default knipConfig({
	ignore: ['examples/**/*'],
	ignoreDependencies: ['entities', 'type-fest', 'yanki'],
})
