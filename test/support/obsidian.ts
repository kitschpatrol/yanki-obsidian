import { randomUUID } from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { test as base, expect, inject } from 'vitest'
import ObsidianService, { launcher as ObsidianLauncher } from 'wdio-obsidian-service'
import { remote } from 'webdriverio'
import type { AnkiConnection } from './anki'
import { getTestEnvironment } from './environment'

type Desktop = {
	anki: AnkiConnection
	browser: WebdriverIO.Browser
	namespace: string
}

async function saveDiagnostics(
	browser: WebdriverIO.Browser,
	directory: string,
	mainWindow: string,
) {
	async function writeJson(file: string, result: Promise<unknown>) {
		await fs.writeFile(path.join(directory, file), JSON.stringify(await result, undefined, 2))
	}

	// Settings can live in a separate window on newer Obsidian. The helper
	// plugin and vault API remain in the original main window.
	try {
		const handles = await browser.getWindowHandles()
		for (const handle of handles) {
			await browser.switchToWindow(handle)
			if (await browser.$('.folder-setting input').isExisting()) {
				await browser.saveScreenshot(path.join(directory, 'settings.png'))
			}
		}
	} catch (error) {
		console.warn('Could not capture settings diagnostics:', error)
	}

	await browser.switchToWindow(mainWindow)

	const captures = await Promise.allSettled([
		browser.saveScreenshot(path.join(directory, 'obsidian.png')),
		writeJson('page.json', browser.getPageSource()),
		writeJson('console.json', browser.getLogs('browser')),
		writeJson(
			'vault.json',
			browser.executeObsidian(async ({ app, plugins }) => {
				const files = await Promise.all(
					app.vault.getMarkdownFiles().map(async (file) => ({
						content: await app.vault.read(file),
						path: file.path,
					})),
				)
				// A failed plugin load may leave the typed plugin absent at runtime.
				// eslint-disable-next-line ts/no-unnecessary-condition
				return { files, stats: plugins.yanki?.settings.stats }
			}),
		),
	])
	for (const result of captures) {
		if (result.status === 'rejected') {
			console.warn('Could not capture an Obsidian diagnostic:', result.reason)
		}
	}
}

export const test = base.extend<{ desktop: Desktop }>({
	async desktop({ task }, use) {
		const anki = inject('anki')
		const namespace = `Yanki E2E ${randomUUID()}`
		const { appVersion, installerVersion, resultsDirectory } = await getTestEnvironment()
		const directory = path.join(resultsDirectory, task.name.replaceAll(/\W+/gu, '-'))
		await fs.mkdir(directory, { recursive: true })
		const capabilities: WebdriverIO.Capabilities & {
			'goog:loggingPrefs': { browser: string }
		} = {
			browserName: 'obsidian',
			browserVersion: appVersion,
			'goog:chromeOptions': { args: ['--window-size=1280,900'] },
			'goog:loggingPrefs': { browser: 'ALL' },
			'wdio:obsidianOptions': {
				installerVersion,
				plugins: [path.resolve('dist')],
				vault: path.resolve('test/vault'),
			},
		}
		const options = {
			cacheDir: path.resolve('.cache/obsidian'),
			capabilities,
			connectionRetryCount: 0,
			connectionRetryTimeout: 60_000,
			logLevel: 'warn' as const,
			outputDir: directory,
		}
		// Same lifecycle as startWdioSession, retaining the service so its
		// afterSession hook also removes temporary vaults and Electron profiles.
		const launcher = new ObsidianLauncher({}, capabilities, options)
		const service = new ObsidianService({}, capabilities, options)
		let browser: undefined | WebdriverIO.Browser
		let mainWindow: string | undefined
		try {
			await launcher.onPrepare(options, [capabilities])
			await service.beforeSession(options, capabilities)
			browser = await remote(options)
			mainWindow = await browser.getWindowHandle()
			await service.before(capabilities, [], browser)
			// Electron's ChromeDriver does not implement WebDriver window/rect.
			await browser.executeObsidian(({ require }) => {
				const electron = require('electron') as {
					remote: {
						getCurrentWindow: () => {
							focus: () => void
							setSize: (width: number, height: number) => void
						}
					}
				}
				const window = electron.remote.getCurrentWindow()
				window.setSize(1280, 900)
				window.focus()
			})
			const runtime = await browser.executeObsidian(
				({ obsidian }, resolvedInstallerVersion) => ({
					app: obsidian.apiVersion,
					installer: resolvedInstallerVersion,
					versions: process.versions,
				}),
				capabilities['wdio:obsidianOptions']?.installerVersion,
			)
			await fs.writeFile(
				path.join(directory, 'runtime.json'),
				JSON.stringify(runtime, undefined, 2),
			)
			console.log(
				`Obsidian ${runtime.app}, installer ${runtime.installer}, Electron ${runtime.versions.electron}`,
			)
			await browser.executeObsidian(
				async ({ plugins }, connection, testNamespace) => {
					const plugin = plugins.yanki
					plugin.settings.ankiConnect = {
						host: 'http://127.0.0.1',
						key: connection.key,
						port: connection.port,
					}
					plugin.settings.namespace = testNamespace
					plugin.settings.sync.autoSyncEnabled = false
					plugin.settings.sync.pushToAnkiWeb = false
					await plugin.saveSettings()
				},
				anki,
				namespace,
			)
			await use({ anki, browser, namespace })
		} finally {
			try {
				if (browser && mainWindow !== undefined) {
					await saveDiagnostics(browser, directory, mainWindow)
				}
			} finally {
				try {
					await browser?.deleteSession()
				} finally {
					await service.afterSession()
				}
			}
		}
	},
})

/** Open Yanki settings and select their window, supporting modal and popout UIs. */
export async function openSettings(browser: WebdriverIO.Browser): Promise<string> {
	const mainWindow = await browser.getWindowHandle()
	await browser.executeObsidian(({ plugins }) => {
		plugins.yanki.openSettingsTab()
	})
	await browser.waitUntil(
		async () => {
			const handles = await browser.getWindowHandles()
			for (const handle of handles) {
				await browser.switchToWindow(handle)
				if (await browser.$('.folder-setting input').isDisplayed()) {
					return true
				}
			}

			return false
		},
		{ timeout: 10_000, timeoutMsg: 'Yanki folder settings did not appear in any Obsidian window.' },
	)
	return mainWindow
}

/**
 * Close settings through the main application, including a separate settings
 * window.
 */
export async function closeSettings(browser: WebdriverIO.Browser, mainWindow: string) {
	await browser.switchToWindow(mainWindow)
	await browser.executeObsidian(({ app }) => {
		app.setting.close()
	})
}

/**
 * Configure watched folders while keeping all other test settings.
 */
export async function watchFolders(browser: WebdriverIO.Browser, folders = ['Anki']) {
	await browser.executeObsidian(async ({ plugins }, watchedFolders) => {
		plugins.yanki.settings.folders = watchedFolders
		await plugins.yanki.saveSettings()
	}, folders)
}

/**
 * Run the user command and assert its completed result, including caught
 * errors.
 */
export async function sync(browser: WebdriverIO.Browser) {
	const before = await browser.executeObsidian(({ plugins }) => plugins.yanki.settings.stats.sync)
	await browser.executeObsidianCommand('yanki:sync')
	await browser.waitUntil(
		async () => {
			const stats = await browser.executeObsidian(
				({ plugins }) => plugins.yanki.settings.stats.sync,
			)
			return (
				stats.manual > before.manual ||
				stats.errors > before.errors ||
				stats.invalid > before.invalid
			)
		},
		{ timeout: 45_000, timeoutMsg: 'Yanki sync did not complete; see test-results diagnostics.' },
	)
	const result = await browser.executeObsidian(({ plugins }) => ({
		notices: Array.from(document.querySelectorAll('.notice'), (notice) => notice.textContent),
		stats: plugins.yanki.settings.stats.sync,
	}))
	// Assert the plugin's outcome: its command callback does not await the sync,
	// and the plugin catches library errors and surfaces them as Obsidian notices.
	expect(result.stats.errors, result.notices.join('\n')).toBe(before.errors)
	expect(result.stats.invalid, result.notices.join('\n')).toBe(before.invalid)
	expect(result.stats.notes.ankiUnreachable, result.notices.join('\n')).toBe(
		before.notes.ankiUnreachable,
	)
	expect(result.stats.manual).toBe(before.manual + 1)
	return result.stats
}
