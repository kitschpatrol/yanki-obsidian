import { expect } from 'vitest'
import { ankiRequest } from './support/anki'
import { sync, test, watchFolders } from './support/obsidian'

// Yanki resolves the links in a note itself, to turn them into `obsidian://`
// URLs for Anki. Each must lead where the same link leads in Obsidian, so the
// running app is the reference here: both sides of the comparison are answers
// from Obsidian's own link resolver, for every link in the `Links` fixtures.
test('links in Anki notes lead where they lead in Obsidian', async ({ desktop }) => {
	const { anki, browser, namespace } = desktop
	await watchFolders(browser, ['Links'])
	const { notes: noteStats } = await sync(browser)
	expect(noteStats.created).toBe(4)

	const ankiNotes = await ankiRequest<
		Array<{ fields: Record<string, { value: string }>; noteId: number }>
	>(anki, 'notesInfo', {
		notes: await ankiRequest<number[]>(anki, 'findNotes', {
			query: `"YankiNamespace:${namespace}"`,
		}),
	})

	const { links, vaultName } = await browser.executeObsidian(
		async ({ app, obsidian, plugins }, notes) => {
			const unresolved = '(unresolved)'
			const linksByFile = await Promise.all(
				plugins.yanki.getWatchedFiles().map(async (file) => {
					const noteId = Number(/^noteId: (\d+)$/mu.exec(await app.vault.read(file))?.[1])
					const html = Object.values(notes.find((note) => note.noteId === noteId)?.fields ?? {})
						.map(({ value }) => value)
						.join('')
					const elements = new DOMParser()
						.parseFromString(html, 'text/html')
						.querySelectorAll<HTMLElement>('[data-yanki-src-original]')

					return Array.from(elements, (element) => {
						const link = decodeURI(element.dataset.yankiSrcOriginal ?? '')
						// An embedded note wraps its link in another element
						const href =
							element.getAttribute('href') ?? element.querySelector('a')?.getAttribute('href') ?? ''
						const url = href.startsWith('obsidian://open?') ? new URL(href) : undefined

						// The link as Obsidian follows it from the note it's written in
						const inNote = obsidian.parseLinktext(link)
						const noteTarget = app.metadataCache.getFirstLinkpathDest(inNote.path, file.path)

						// The link as Obsidian's URL handler follows it from an Anki card
						const inUrl = obsidian.parseLinktext(url?.searchParams.get('file') ?? '')
						const urlTarget =
							url && app.metadataCache.getFirstLinkpathDest(obsidian.normalizePath(inUrl.path), '')

						return {
							fromAnki: urlTarget ? `${urlTarget.path}${inUrl.subpath}` : unresolved,
							fromNote: noteTarget ? `${noteTarget.path}${inNote.subpath}` : unresolved,
							link: `${file.path} → ${link}`,
							vault: url?.searchParams.get('vault') ?? undefined,
						}
					})
				}),
			)

			return { links: linksByFile.flat(), vaultName: app.vault.getName() }
		},
		ankiNotes,
	)

	const followed = (from: 'fromAnki' | 'fromNote') =>
		Object.fromEntries(links.map((link) => [link.link, link[from]]))

	// Every link opens the same file, at the same anchor, from Anki as from
	// the note it was written in
	expect(followed('fromAnki')).toEqual(followed('fromNote'))

	// Resolved links name this vault
	expect([...new Set(links.flatMap(({ vault }) => vault ?? []))]).toEqual([vaultName])

	// The fixtures still demonstrate the rules they were written for
	expect(followed('fromAnki')).toEqual({
		'Links/A much longer folder name/Rock.md → ../Bobcat': 'Links/Bobcat.md',
		'Links/A much longer folder name/Rock.md → #^stone':
			'Links/A much longer folder name/Rock.md#^stone',
		// Itself, as the nearest file with this name
		'Links/A much longer folder name/Rock.md → Rock': 'Links/A much longer folder name/Rock.md',
		// Not itself, though its own name ends with the link's
		'Links/Bobcat.md → Cat': 'Anki/Animals/Quadruped/Cat.md',
		'Links/Link types.md → ../Anki/Animals/Quadruped/Cat.md': 'Anki/Animals/Quadruped/Cat.md',
		'Links/Link types.md → ../Outside': 'Outside.md',
		'Links/Link types.md → ./Bobcat': 'Links/Bobcat.md',
		'Links/Link types.md → /Links/Outside': 'Links/Outside.md',
		'Links/Link types.md → #Answers': 'Links/Link types.md#Answers',
		'Links/Link types.md → Bobcat': 'Links/Bobcat.md',
		// Not the shallower Links/Bobcat.md
		'Links/Link types.md → Cat': 'Anki/Animals/Quadruped/Cat.md',
		'Links/Link types.md → Cat#Whiskers': 'Anki/Animals/Quadruped/Cat.md#Whiskers',
		'Links/Link types.md → Missing': '(unresolved)',
		'Links/Link types.md → Non-living things/Rock': 'Anki/Non-living things/Rock.md',
		// The vault root wins over the sibling Links/Outside.md
		'Links/Link types.md → Outside': 'Outside.md',
		// The nearest file wins over the shorter Anki/Non-living things/Rock.md
		'Links/Link types.md → Rock': 'Links/A much longer folder name/Rock.md',
		// The vault root wins even over the linking note itself
		'Links/Outside.md → Outside': 'Outside.md',
	})
})
