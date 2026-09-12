import { defineConfig } from 'vitest/config'

export default defineConfig({
	test: {
		// Real desktop applications share one disposable Anki collection.
		fileParallelism: false,
		globalSetup: ['./test/support/global-setup.ts'],
		hookTimeout: 300_000,
		include: ['test/**/*.e2e.test.ts'],
		// Test fixtures include the initial Obsidian/ChromeDriver downloads.
		testTimeout: 300_000,
	},
})
