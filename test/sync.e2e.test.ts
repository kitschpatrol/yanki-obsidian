import { expect } from 'vitest'
import { ankiRequest } from './support/anki'
import { sync, test, watchFolders } from './support/obsidian'

test('issue 81: syncs again after adding Chicken to a nested deck', async ({ desktop }) => {
	const { anki, browser, namespace } = desktop
	await watchFolders(browser)
	const first = await sync(browser)
	expect(first.notes.created).toBe(4)

	const query = `"YankiNamespace:${namespace}"`
	const originalIds = await ankiRequest<number[]>(anki, 'findNotes', { query })
	expect(originalIds).toHaveLength(4)
	const firstIdsByPath = await browser.executeObsidian(
		async ({ app, plugins }): Promise<Record<string, number>> =>
			Object.fromEntries(
				await Promise.all(
					plugins.yanki.getWatchedFiles().map(async (file) => {
						const content = await app.vault.read(file)
						return [file.path, Number(/^noteId: (\d+)$/mu.exec(content)?.[1])] as const
					}),
				),
			),
	)
	expect(Object.values(firstIdsByPath).toSorted((a, b) => a - b)).toEqual(
		originalIds.toSorted((a, b) => a - b),
	)

	// Use the real Vault API: this exercises the plugin's adapters and Obsidian's
	// file/metadata events, unlike the library's equivalent filesystem test.
	await browser.executeObsidian(async ({ app }) => {
		await app.vault.create('Anki/Animals/Biped/Chicken.md', 'Chicken\n\n---\n\nA biped.\n')
	})
	await expect
		.poll(async () =>
			browser.executeObsidian(({ plugins }) => plugins.yanki.getWatchedFiles().length),
		)
		.toBe(5)

	// On installer 1.5.12 this must fail with the visible "union is not a
	// function" notice, not silently pass because the command was dispatched.
	const second = await sync(browser)
	expect(second.notes.created).toBe(5)
	expect(second.notes.unchanged).toBe(4)
	const ids = await ankiRequest<number[]>(anki, 'findNotes', { query })
	expect(ids).toHaveLength(5)
	expect(ids).toEqual(expect.arrayContaining(originalIds))
	const chickenIds = ids.filter((id) => !originalIds.includes(id))
	expect(chickenIds).toHaveLength(1)

	await expect
		.poll(async () =>
			browser.executeObsidian(({ app }) => {
				const file = app.vault.getFileByPath('Anki/Animals/Biped/Chicken.md')
				return file ? Number(app.metadataCache.getFileCache(file)?.frontmatter?.noteId) : 0
			}),
		)
		.toBe(chickenIds[0])
	for (const [filePath, id] of Object.entries(firstIdsByPath)) {
		expect(
			await browser.executeObsidian(async ({ app }, notePath) => {
				const file = app.vault.getFileByPath(notePath)
				if (!file) {
					throw new Error(`Missing note: ${notePath}`)
				}

				return Number(/^noteId: (\d+)$/mu.exec(await app.vault.read(file))?.[1])
			}, filePath),
		).toBe(id)
	}

	const deckCards = await ankiRequest<Record<string, number[]>>(anki, 'getDecks', {
		cards: await ankiRequest<number[]>(anki, 'findCards', { query }),
	})
	expect(Object.keys(deckCards).toSorted()).toEqual([
		'Animals',
		'Animals::Biped',
		'Animals::Quadruped',
		'Non-living things',
	])

	// An unchanged third sync must neither recreate nor duplicate notes.
	await sync(browser)
	expect(await ankiRequest<number[]>(anki, 'findNotes', { query })).toEqual(ids)
})
