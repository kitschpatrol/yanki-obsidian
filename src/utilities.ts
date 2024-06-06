import plur from 'plur'
import { type SyncReport } from 'yanki'

export function formatSyncReport(syncReport: SyncReport): DocumentFragment {
	const { synced } = syncReport

	const reportFragment = new DocumentFragment()
	const report = reportFragment.createEl('span')

	const reportLines: string[] = []
	reportLines.push(
		'<strong>Successfully synced to Anki.</strong>',
		`Found ${synced.length} ${plur('flashcard', synced.length)} in vault.`,
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

	report.innerHTML = reportLines.join('<br>')
	return reportFragment
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
