import { defineConfig } from 'vitest/config'
import config from './vitest.config.ts'

// Local diagnostic for an installer below the supported floor, outside CI.
// Keep this pinned even as "latest" moves on. The second-sync assertion fails until
// https://github.com/kitschpatrol/yanki-obsidian/issues/81 is fixed.
export default defineConfig({
	...config,
	test: {
		...config.test,
		env: {
			YANKI_E2E_APP_VERSION: '1.13.7',
			YANKI_E2E_INSTALLER_VERSION: '1.5.12',
		},
		include: ['test/sync.e2e.test.ts'],
	},
})
