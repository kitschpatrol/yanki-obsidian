import type { TestProject } from 'vitest/node'
import { execFile, spawn } from 'node:child_process'
import { createHash, randomUUID } from 'node:crypto'
import { createWriteStream, existsSync } from 'node:fs'
import fs from 'node:fs/promises'
import net from 'node:net'
import os from 'node:os'
import path from 'node:path'
import { setTimeout } from 'node:timers/promises'
import { promisify } from 'node:util'
import type { AnkiConnection } from './anki'
import { ankiRequest } from './anki'
import { getTestEnvironment } from './environment'

const ankiConnectRevision = 'de6e6e1b8aaf4ae195eb1d1ff6db5409b99b2a3e'
const ankiConnectSha256 = '0dc931bcf645d342e02726329fb3fb6b0bdc7066b064eea9bea17e8e2072029a'

async function getAnkiConnectArchive(): Promise<string> {
	const archive = path.resolve('.cache/yanki-e2e', `anki-connect-${ankiConnectRevision}.tar.gz`)
	await fs.mkdir(path.dirname(archive), { recursive: true })
	if (!existsSync(archive)) {
		const response = await fetch(
			`https://git.sr.ht/~foosoft/anki-connect/archive/${ankiConnectRevision}.tar.gz`,
			{ signal: AbortSignal.timeout(60_000) },
		)
		if (!response.ok) {
			throw new Error(`AnkiConnect download failed: ${String(response.status)}`)
		}

		await fs.writeFile(archive, new Uint8Array(await response.arrayBuffer()))
	}

	if (
		createHash('sha256')
			.update(await fs.readFile(archive))
			.digest('hex') !== ankiConnectSha256
	) {
		await fs.rm(archive)
		throw new Error('AnkiConnect archive checksum mismatch; removed the cached download.')
	}

	return archive
}

async function unusedPort(): Promise<number> {
	const server = net.createServer()
	await new Promise<void>((resolve, reject) => {
		server.once('error', reject)
		server.listen(0, '127.0.0.1', resolve)
	})
	const { port } = server.address() as net.AddressInfo
	await new Promise<void>((resolve, reject) => {
		server.close((error) => {
			if (error) {
				reject(error)
			} else {
				resolve()
			}
		})
	})
	return port
}

/** Start a disposable Anki process and provide its connection to Vitest workers. */
export default async function setup(project: TestProject) {
	// Fail before starting desktop apps if the production build was omitted.
	for (const file of ['main.js', 'manifest.json', 'styles.css']) {
		await fs.access(path.resolve('dist', file))
	}

	const { resultsDirectory } = await getTestEnvironment({ ...process.env, ...project.config.env })
	await fs.mkdir(resultsDirectory, { recursive: true })
	const logPath = path.join(resultsDirectory, 'anki.log')

	// Uv installs the pinned Python and locked Anki dependencies on first use.
	console.log('Preparing Anki with uv…')
	try {
		// eslint-disable-next-line ts/strict-void-return -- execFile supports promisify and also returns its child process.
		await promisify(execFile)(
			'uv',
			['sync', '--project', path.resolve('test'), '--locked', '--managed-python'],
			{
				timeout: 300_000,
			},
		)
	} catch (error) {
		throw new Error('Could not prepare Anki with uv. See test/README.md for setup.', {
			cause: error,
		})
	}

	const archive = await getAnkiConnectArchive()
	const base = await fs.mkdtemp(path.join(os.tmpdir(), 'yanki-obsidian-anki-'))
	const connection: AnkiConnection = {
		key: randomUUID(),
		port: await unusedPort(),
		profile: `yanki-e2e-${randomUUID()}`,
	}
	await fs.writeFile(path.join(base, 'connection.json'), JSON.stringify(connection))
	const log = createWriteStream(logPath)
	const child = spawn(
		'uv',
		[
			'run',
			'--project',
			path.resolve('test'),
			'--locked',
			'--no-sync',
			'--managed-python',
			'python',
			// Cocoa can interpret a script argument as a file to open in Anki.
			'-c',
			'import runpy; runpy.run_path("test/support/launch-anki.py", run_name="__main__")',
		],
		{
			detached: process.platform !== 'win32',
			env: {
				...process.env,
				ANKI_SOFTWAREOPENGL: '1',
				PYTHONUNBUFFERED: '1',
				YANKI_E2E_ANKI_BASE: base,
				YANKI_E2E_ANKICONNECT_ARCHIVE: archive,
			},
			stdio: ['ignore', 'pipe', 'pipe'],
		},
	)
	child.stdout.pipe(log, { end: false })
	child.stderr.pipe(log, { end: false })
	let launchError: Error | undefined
	child.once('error', (error) => {
		launchError = error
	})
	const exited = new Promise<void>((resolve) => {
		child.once('close', () => {
			resolve()
		})
	})

	const isRunning = () => child.exitCode === null && child.signalCode === null

	async function cleanup() {
		// Only terminate the process tree this setup owns. No pkill/taskkill by name.
		if (child.pid !== undefined && isRunning()) {
			try {
				await ankiRequest(connection, 'guiExitAnki')
			} catch {
				// Startup may have failed before the HTTP server became available.
			}

			await Promise.race([exited, setTimeout(5000, undefined, { ref: false })])
			if (isRunning()) {
				if (process.platform === 'win32') {
					await new Promise<void>((resolve, reject) => {
						const kill = spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'])
						kill.once('error', reject)
						kill.once('close', () => {
							resolve()
						})
					})
				} else {
					process.kill(-child.pid, 'SIGKILL')
				}

				await exited
			}
		}

		log.end()
		await fs.rm(base, { force: true, maxRetries: 5, recursive: true, retryDelay: 300 })
	}

	try {
		const deadline = Date.now() + 90_000
		let lastError: unknown
		while (Date.now() < deadline) {
			if (launchError !== undefined || !isRunning()) {
				throw new Error(`Could not start test Anki. See ${logPath} and test/README.md.`, {
					cause: launchError,
				})
			}

			try {
				const profile = await ankiRequest<string>(connection, 'getActiveProfile')
				if (profile !== connection.profile) {
					throw new Error(`Unexpected Anki profile: ${profile}`)
				}

				const notes = await ankiRequest<number[]>(connection, 'findNotes', { query: '*' })
				if (notes.length > 0) {
					throw new Error('Test Anki collection is not empty')
				}

				project.provide('anki', connection)
				return cleanup
			} catch (error) {
				lastError = error
			}

			await setTimeout(250)
		}

		throw new Error(`Anki startup timed out. See ${logPath}.`, { cause: lastError })
	} catch (error) {
		await cleanup()
		throw error
	}
}
