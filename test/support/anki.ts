export type AnkiConnection = {
	key: string
	port: number
	profile: string
}

/** Call only the authenticated, disposable AnkiConnect instance for this run. */
export async function ankiRequest<T>(
	connection: AnkiConnection,
	action: string,
	params: Record<string, unknown> = {},
): Promise<T> {
	const response = await fetch(`http://127.0.0.1:${String(connection.port)}`, {
		body: JSON.stringify({ action, key: connection.key, params, version: 6 }),
		method: 'POST',
		signal: AbortSignal.timeout(5000),
	})
	if (!response.ok) {
		throw new Error(`AnkiConnect HTTP ${String(response.status)} (${action})`)
	}

	// eslint-disable-next-line ts/no-restricted-types -- AnkiConnect uses null for success.
	const result = (await response.json()) as { error: null | string; result: T }
	if (result.error !== null) {
		throw new Error(`AnkiConnect ${action}: ${result.error}`)
	}

	return result.result
}
