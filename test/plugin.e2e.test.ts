import { expect } from 'vitest'
import { ankiRequest } from './support/anki'
import { closeSettings, openSettings, sync, test, watchFolders } from './support/obsidian'

test('loads the release bundle and reports an unconfigured sync in Obsidian', async ({
	desktop,
}) => {
	const { browser } = desktop
	expect(
		await browser.executeObsidian(({ app }) =>
			app.commands
				.listCommands()
				.filter(({ id }) => id.startsWith('yanki:'))
				.map(({ id }) => id),
		),
	).toEqual(['yanki:sync'])
	await browser.executeObsidianCommand('yanki:sync')
	await expect
		.poll(async () =>
			browser.executeObsidian(({ plugins }) => plugins.yanki.settings.stats.sync.invalid),
		)
		.toBe(1)
	await expect
		.poll(async () => browser.$('.notice-container').getText())
		.toContain('No flashcard folders to sync')
})

test('offers installer updates and issue reporting after a sync error', async ({ desktop }) => {
	const { browser } = desktop
	await watchFolders(browser)
	await browser.executeObsidian(({ plugins }) => {
		// Inject a read failure into this test's disposable plugin instance.
		// eslint-disable-next-line ts/require-await -- The async adapter deliberately rejects without reading a file.
		plugins.yanki.fileAdapterRead = async () => {
			throw new Error('Could not read test flashcard')
		}
	})
	await browser.executeObsidianCommand('yanki:sync')
	const notice = browser.$(
		'.notice:has(a[href="https://obsidian.md/help/updates#Installer+updates"])',
	)
	await notice.waitForDisplayed()
	await expect.poll(async () => notice.getText()).toContain('Could not read test flashcard')
	expect(
		await notice.$('a[href="https://obsidian.md/help/updates#Installer+updates"]').getText(),
	).toBe('install the latest version of Obsidian')
	expect(
		await notice.$('a[href="https://github.com/kitschpatrol/yanki-obsidian/issues"]').getText(),
	).toBe('open an issue')
	expect(
		await browser.executeObsidian(({ plugins }) => plugins.yanki.settings.stats.sync),
	).toMatchObject({ errors: 1, manual: 0 })
})

test('persists folder settings from the UI through plugin reloads', async ({ desktop }) => {
	const { browser } = desktop
	const mainWindow = await openSettings(browser)
	const folder = browser.$('.folder-setting input')
	await folder.waitForDisplayed()
	await folder.setValue('Anki/')
	// Closing while the input is focused exercises hide() persistence as well as
	// the pre-1.13 and 1.13+ settings rendering paths in the CI matrix.
	await closeSettings(browser, mainWindow)
	await expect
		.poll(async () =>
			browser.executeObsidian(async ({ plugins }) => {
				const settings = await plugins.yanki.loadData()
				return settings?.folders
			}),
		)
		.toEqual(['Anki'])
	for (let i = 0; i < 2; i++) {
		await browser.getObsidianPage().disablePlugin('yanki')
		expect(
			await browser.executeObsidian(({ app }) =>
				app.commands.listCommands().some(({ id }) => id === 'yanki:sync'),
			),
		).toBe(false)
		await browser.getObsidianPage().enablePlugin('yanki')
	}

	await openSettings(browser)
	await browser.$('.folder-setting input').waitForDisplayed()
	expect(await browser.$$('.folder-setting input').length).toBe(1)
	expect(await browser.$('.folder-setting input').getValue()).toBe('Anki')
	await closeSettings(browser, mainWindow)
	expect(
		await browser.executeObsidian(({ app }) =>
			app.commands.listCommands().filter(({ id }) => id === 'yanki:sync'),
		),
	).toHaveLength(1)
})

test('uses real vault files to filter folders and preserves links when renaming', async ({
	desktop,
}) => {
	const { browser } = desktop
	await browser.executeObsidian(async ({ app }) => {
		await app.vault.create('Anki/Animals/Animals.md', 'A folder note')
		await app.vault.create('Anki/attachment.txt', 'An attachment')
		await app.vault.create('Link.md', '[[Plato]]')
	})
	await watchFolders(browser, ['Anki', 'Anki/Animals', 'Anki/', ''])
	expect(
		await browser.executeObsidian(({ plugins }) =>
			plugins.yanki
				.getWatchedFiles()
				.map(({ path }) => path)
				.toSorted(),
		),
	).toEqual([
		'Anki/Animals/Biped/Plato.md',
		'Anki/Animals/Quadruped/Horse.md',
		'Anki/Animals/ignore.md',
		'Anki/Non-living things/Rock.md',
	])
	await expect
		.poll(async () =>
			browser.executeObsidian(
				({ app }) => app.metadataCache.resolvedLinks['Link.md']?.['Anki/Animals/Biped/Plato.md'],
			),
		)
		.toBe(1)
	await browser.executeObsidian(async ({ app, obsidian, plugins }) => {
		if (!(app.vault.adapter instanceof obsidian.FileSystemAdapter)) {
			throw new TypeError('Desktop vault required')
		}

		const root = app.vault.adapter.getBasePath().replaceAll('\\', '/')
		await plugins.yanki.fileAdapterRename(
			`${root}/Anki/Animals/Biped/Plato.md`,
			`${root}/Anki/Animals/Biped/Philosopher.md`,
		)
	})
	await expect
		.poll(async () => browser.getObsidianPage().read('Link.md'))
		.toContain('[[Philosopher]]')
})

test('syncs a vault edit automatically after disable and re-enable', async ({ desktop }) => {
	const { anki, browser, namespace } = desktop
	await watchFolders(browser)
	await sync(browser)
	await browser.getObsidianPage().disablePlugin('yanki')
	await browser.getObsidianPage().enablePlugin('yanki')
	await browser.executeObsidian(async ({ app, plugins }) => {
		plugins.yanki.settings.sync.autoSyncEnabled = true
		await plugins.yanki.saveSettings()
		const file = app.vault.getFileByPath('Anki/Animals/Biped/Plato.md')
		if (!file) {
			throw new Error('Plato fixture missing')
		}

		const content = await app.vault.read(file)
		await app.vault.modify(file, content.replace('A biped.', 'A philosopher.'))
	})
	const query = `"YankiNamespace:${namespace}"`
	await expect
		.poll(
			async () => {
				const ids = await ankiRequest<number[]>(anki, 'findNotes', { query })
				return JSON.stringify(await ankiRequest(anki, 'notesInfo', { notes: ids }))
			},
			{ timeout: 20_000 },
		)
		.toContain('A philosopher.')
	expect(await ankiRequest<number[]>(anki, 'findNotes', { query })).toHaveLength(4)
	expect(
		await browser.executeObsidian(({ plugins }) => plugins.yanki.settings.stats.sync.errors),
	).toBe(0)
})
