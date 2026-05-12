import type { RenameFilesResult, SyncFilesResult } from 'yanki'
import { sanitizeHTMLToDom } from 'obsidian'
import plur from 'plur'

export type CommonProperties<T, U> = {
	[K in keyof T & keyof U]: T[K] extends U[K] ? T[K] : never
}

/**
 * Formats a file rename result into a user-facing notification.
 */
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

/**
 * Formats a sync result into a user-facing notification with action counts.
 */
export function formatSyncResult(syncReport: SyncFilesResult): DocumentFragment {
	const { synced } = syncReport

	// Aggregate the counts of each action:
	const actionCounts = synced.reduce<Record<string, number>>((acc, note) => {
		acc[note.action] = (acc[note.action] || 0) + 1
		return acc
	}, {})

	const ankiUnreachable = actionCounts.ankiUnreachable > 0

	if (ankiUnreachable) {
		return sanitizeHTMLToDom(
			html`<strong>Anki sync failed:</strong><br />Could not connect to Anki<br /><br />Please make
				sure that the Anki desktop application is running, and that it has the
				<a href="https://ankiweb.net/shared/info/2055492159">AnkiConnect</a> add-on installed and
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

/**
 * Shallow-compares two objects by their enumerable keys and values.
 */
export function objectsEqual<T extends Record<string, unknown> | undefined>(a: T, b: T): boolean {
	if (a === b) {
		return true
	}

	if (a === undefined || b === undefined) {
		return false
	}

	const aKeys = Object.keys(a)
	const bKeys = Object.keys(b)

	if (aKeys.length !== bKeys.length) {
		return false
	}

	for (const key of aKeys) {
		if (a[key] !== b[key]) {
			return false
		}
	}

	return true
}

/**
 * Shallow-compares two arrays by index.
 */
export function arraysEqual<T extends undefined | unknown[]>(a: T, b: T): boolean {
	if (a === b) {
		return true
	}

	if (a === undefined || b === undefined) {
		return false
	}

	if (a.length !== b.length) {
		return false
	}

	for (const [i, element] of a.entries()) {
		if (element !== b[i]) {
			return false
		}
	}

	return true
}

/**
 * Capitalizes the first character of a string.
 */
export function capitalize(text: string): string {
	return text.charAt(0).toUpperCase() + text.slice(1)
}

/**
 * Checks whether a namespace string is valid and already sanitized.
 */
export function validateNamespace(namespace: string): boolean {
	const sanitizedNamespace = sanitizeNamespace(namespace)
	return sanitizedNamespace.length > 0 && namespace === sanitizedNamespace
}

/**
 * Strips invalid characters (`*`, `:`) from a namespace string.
 */
export function sanitizeNamespace(namespace: string): string {
	// Additional sanitization also happens inside Yanki
	// Stuck with es2020?
	return namespace.replace(/[*:]/g, '').trim()
}

/**
 * Elements with class will call a function when clicked
 */
export function sanitizeHtmlToDomWithFunction(
	html: string,
	classActions: Record<string, () => void>,
) {
	const fragment = sanitizeHTMLToDom(html)
	for (const [targetClass, callback] of Object.entries(classActions)) {
		const functionElement = fragment.querySelector(`.${targetClass}`)
		functionElement?.addEventListener('click', callback)
	}

	return fragment
}

/**
 * Mainly for nice formatting with prettier. But the line wrapping means we have
 * to strip surplus whitespace.
 *
 * @public
 */
export function html(strings: TemplateStringsArray, ...values: Array<number | string>): string {
	const conjoined = strings.reduce((result, text, i) => `${result}${text}${values[i] ?? ''}`, '')
	return conjoined.replaceAll(/\s+/g, ' ')
}

/**
 * Alternate HTML templating function.
 *
 * @public
 * @todo Test why this is breaking notice formatting
 */
export function htmlNew(strings: TemplateStringsArray, ...values: Array<number | string>): string {
	return trimLeadingIndentation(strings, ...values)
}

// eslint-disable-next-line regexp/no-unused-capturing-group -- group is kept for readability; full match is consumed via `[0]`
const LEADING_SPACE_REGEX = /^(\s+)/
const NEW_LINE_REGEX = /\r?\n/

function trimLeadingIndentation(
	strings: TemplateStringsArray,
	...values: Array<number | string>
): string {
	const lines = strings
		.reduce((result, text, i) => `${result}${text}${values[i] ?? ''}`, '')
		.split(NEW_LINE_REGEX)
		.filter((line) => line.trim() !== '')

	// Get leading white space of first line, and trim that much white space
	// from subsequent lines

	const leadingSpace = LEADING_SPACE_REGEX.exec(lines[0])?.[0] ?? ''
	const leadingSpaceRegex = new RegExp(`^${leadingSpace}`)
	return lines.map((line) => line.replace(leadingSpaceRegex, '').trimEnd()).join('\n')
}
