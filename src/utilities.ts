import { sanitizeHTMLToDom } from 'obsidian'
import plur from 'plur'
import { type SyncReport } from 'yanki'

export function formatSyncReport(syncReport: SyncReport): DocumentFragment {
	const { synced } = syncReport

	const reportLines: string[] = []
	reportLines.push(
		'<strong>Successfully synced to Anki.</strong>',
		`Found ${synced.length} flashcard ${plur('note', synced.length)} in vault.`,
		'',
		'Sync report:',
	)

	// Aggregate the counts of each action:
	const actionCounts = synced.reduce<Record<string, number>>((acc, note) => {
		acc[note.action] = (acc[note.action] || 0) + 1
		return acc
	}, {})

	for (const [action, count] of Object.entries(actionCounts)) {
		reportLines.push(`\t${count} ${plur('card', count)} ${action}`)
	}

	return sanitizeHTMLToDom(reportLines.join('<br>'))
}

export function arraysEqual<T>(a: T[], b: T[]): boolean {
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

export function sanitizeNamespace(namespace: string): string {
	// Stuck with es2020?
	// eslint-disable-next-line unicorn/prefer-string-replace-all
	return namespace.replace(/[*:]/g, '')
}

/**
 * Elements with class will call a function when clicked
 * @returns
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
