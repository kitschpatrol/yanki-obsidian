import type { RenameFilesResult, SyncFilesResult } from 'yanki'
import { sanitizeHTMLToDom } from 'obsidian'
import plur from 'plur'

export type CommonProperties<T, U> = {
	[K in keyof T & keyof U]: T[K] extends U[K] ? T[K] : never
}

export function formatRenameResult(renameReport: RenameFilesResult): DocumentFragment {
	const { notes } = renameReport

	const renameCount = notes.filter(
		({ filePath, filePathOriginal }) => filePath !== filePathOriginal,
	).length

	if (renameCount > 0) {
		return sanitizeHTMLToDom(
			html`<strong>Anki note file rename:</strong><br />${renameCount} local
				${plur('note', renameCount)} renamed.`,
		)
	}

	return sanitizeHTMLToDom(
		html`<strong>Anki note file rename:</strong><br />All local note names are already correct.`,
	)
}

export function formatSyncResult(syncReport: SyncFilesResult): DocumentFragment {
	const { synced } = syncReport

	// Aggregate the counts of each action:
	// eslint-disable-next-line unicorn/no-array-reduce
	const actionCounts = synced.reduce<Record<string, number>>((acc, note) => {
		acc[note.action] = (acc[note.action] || 0) + 1
		return acc
	}, {})

	const ankiUnreachable = actionCounts.ankiUnreachable > 0

	if (ankiUnreachable) {
		return sanitizeHTMLToDom(
			html`<strong>Anki sync failed:</strong><br />Could not connect to Anki<br /><br />Please make
				sure that the Anki desktop application is running, and that it has the
				<a href="https://ankiweb.net/shared/info/2055492159">Anki-Connect</a> add-on installed and
				<a href="https://github.com/kitschpatrol/yanki-obsidian?tab=readme-ov-file#quick-start"
					>configured</a
				>.`,
		)
	}

	const reportLines: string[] = []

	const localCount = synced.filter((syncedNote) =>
		['created', 'matched', 'unchanged', 'updated'].includes(syncedNote.action),
	).length

	reportLines.push(
		html`<strong>Successfully synced to Anki:</strong>`,
		`Found ${localCount} flashcard ${plur('note', localCount)} in vault.`,
		'',
		'Sync report:',
	)

	for (const [action, count] of Object.entries(actionCounts)) {
		reportLines.push(`\t${count} Anki ${plur('note', count)} ${action}`)
	}

	const renameCount = synced.filter(
		({ filePath, filePathOriginal }) => filePath !== filePathOriginal,
	).length

	if (renameCount > 0) {
		reportLines.push(`\t${renameCount} local ${plur('note', renameCount)} renamed`)
	}

	return sanitizeHTMLToDom(reportLines.join(html`<br />`))
}

export function objectsEqual<T extends Record<string, unknown> | undefined>(a: T, b: T): boolean {
	if (a === b) return true
	if (a === undefined || b === undefined) return false

	const aKeys = Object.keys(a)
	const bKeys = Object.keys(b)

	if (aKeys.length !== bKeys.length) return false

	for (const key of aKeys) {
		if (a[key] !== b[key]) return false
	}

	return true
}

export function arraysEqual<T extends undefined | unknown[]>(a: T, b: T): boolean {
	if (a === b) return true
	if (a === undefined || b === undefined) return false
	if (a.length !== b.length) return false

	for (const [i, element] of a.entries()) {
		if (element !== b[i]) return false
	}

	return true
}

export function capitalize(text: string): string {
	return text.charAt(0).toUpperCase() + text.slice(1)
}

export function validateNamespace(namespace: string): boolean {
	const sanitizedNamespace = sanitizeNamespace(namespace)
	return sanitizedNamespace.length > 0 && namespace === sanitizedNamespace
}

export function sanitizeNamespace(namespace: string): string {
	// Additional sanitization also happens inside Yanki
	// Stuck with es2020?
	// eslint-disable-next-line unicorn/prefer-string-replace-all
	return namespace.replace(/[*:]/g, '').trim()
}

/**
 * Elements with class will call a function when clicked
 */
export function sanitizeHtmlToDomWithFunction(
	html: string,
	targetClass: string,
	callback: () => void,
) {
	const fragment = sanitizeHTMLToDom(html)
	const functionElement = fragment.querySelector(`.${targetClass}`)
	functionElement?.addEventListener('click', callback)
	return fragment
}

/**
 * Mainly for nice formatting with prettier. But the line wrapping means we have to strip surplus whitespace.
 * @public
 */
export function html(strings: TemplateStringsArray, ...values: unknown[]): string {
	// eslint-disable-next-line unicorn/no-array-reduce
	const conjoined = strings.reduce(
		// eslint-disable-next-line ts/no-base-to-string
		(result, text, i) => `${result}${text}${String(values[i] ?? '')}`,
		'',
	)
	return conjoined.replaceAll(/\s+/g, ' ')
}

/**
 * Alternate HTML templating function.
 @todo test why this is breaking notice formatting
 @public
 */
export function htmlNew(strings: TemplateStringsArray, ...values: unknown[]): string {
	return trimLeadingIndentation(strings, ...values)
}

function trimLeadingIndentation(strings: TemplateStringsArray, ...values: unknown[]): string {
	const lines = strings
		// eslint-disable-next-line ts/no-base-to-string, unicorn/no-array-reduce
		.reduce((result, text, i) => `${result}${text}${String(values[i] ?? '')}`, '')
		.split(/\r?\n/)
		.filter((line) => line.trim() !== '')

	// Get leading white space of first line, and trim that much white space
	// from subsequent lines
	// eslint-disable-next-line regexp/no-unused-capturing-group
	const leadingSpace = /^(\s+)/.exec(lines[0])?.[0] ?? ''
	const leadingSpaceRegex = new RegExp(`^${leadingSpace}`)
	return lines.map((line) => line.replace(leadingSpaceRegex, '').trimEnd()).join('\n')
}
