import { createHash } from 'node:crypto'
import fs from 'node:fs/promises'
import { expect } from 'vitest'
import { ankiRequest } from './support/anki'
import { sync, test, watchFolders } from './support/obsidian'

test('syncs an added note into a nested deck and preserves existing note IDs', async ({
	desktop,
}) => {
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

	// The Cat fixture embeds an image stored outside the watched folder. Yanki
	// names uploaded media by content hash, so the plugin's binary file adapter
	// and Obsidian's Web Crypto must produce the digest the CLI would in Node,
	// and the stored bytes must round-trip.
	const catId = firstIdsByPath['Anki/Animals/Quadruped/Cat.md']
	if (catId === undefined) {
		throw new Error('Cat fixture was not synced')
	}

	const image = await fs.readFile('test/vault/Attachments/cat.jpeg')
	const [cat] = await ankiRequest<Array<{ fields: Record<string, { value: string }> }>>(
		anki,
		'notesInfo',
		{ notes: [catId] },
	)
	const mediaFilename = /<img src="([^"]+)"/u.exec(cat?.fields.Back?.value ?? '')?.[1]
	expect(mediaFilename).toContain(createHash('sha256').update(image).digest('hex').slice(0, 16))
	expect(await ankiRequest<string>(anki, 'retrieveMediaFile', { filename: mediaFilename })).toBe(
		image.toString('base64'),
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

	// An unchanged third sync must neither recreate, update, nor duplicate notes.
	// Plugin stats accumulate across syncs, so compare against the second sync.
	const third = await sync(browser)
	expect(third.notes.unchanged - second.notes.unchanged).toBe(5)
	expect(await ankiRequest<number[]>(anki, 'findNotes', { query })).toEqual(ids)
})
