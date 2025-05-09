import { knipConfig } from '@kitschpatrol/knip-config'

export default knipConfig({
	ignore: ['examples/**/*'],
	ignoreDependencies: ['entities', 'moment', 'type-fest', 'yanki'],
})
