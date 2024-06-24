/* eslint-disable unicorn/consistent-function-scoping */
/* eslint-disable @typescript-eslint/unbound-method */

import {
	YankiPluginSettingTab,
	type YankiPluginSettings,
	yankiPluginDefaultSettings,
} from './settings/settings'
import {
	arraysEqual,
	formatRenameResult,
	formatSyncResult,
	html,
	objectsEqual,
	sanitizeHtmlToDomWithFunction,
	sanitizeNamespace,
} from './utilities'
import sindreDebounce from 'debounce'
import path from 'node:path' // Assuming polyfilled
import {
	Notice,
	Plugin,
	type TAbstractFile,
	TFile,
	TFolder,
	Vault,
	moment,
	requestUrl,
	sanitizeHTMLToDom,
} from 'obsidian'
import {
	type FetchAdapter,
	type RenameFilesOptions,
	type SyncFilesOptions,
	renameFiles,
	syncFiles,
} from 'yanki'

type CommonProperties<T, U> = {
	[K in keyof T & keyof U]: T[K] extends U[K] ? T[K] : never
}

export default class YankiPlugin extends Plugin {
	public settings: YankiPluginSettings = yankiPluginDefaultSettings
	private readonly settingsTab: YankiPluginSettingTab = new YankiPluginSettingTab(this.app, this)

	// Where is "unregisterEvent"?
	// private readonly syncInProgress = false

	async onload() {
		this.fileAdapterWrite = this.fileAdapterWrite.bind(this)
		this.fileAdapterRead = this.fileAdapterRead.bind(this)
		this.fileAdapterReadBuffer = this.fileAdapterReadBuffer.bind(this)
		this.fileAdapterStat = this.fileAdapterStat.bind(this)
		this.fileAdapterRename = this.fileAdapterRename.bind(this)
		this.fetchAdapter = this.fetchAdapter.bind(this)

		this.getSharedOptions = this.getSharedOptions.bind(this)
		this.getRenameFilesOptions = this.getRenameFilesOptions.bind(this)
		this.getSyncFilesOptions = this.getSyncFilesOptions.bind(this)

		this.getWatchedFiles = this.getWatchedFiles.bind(this)
		this.getSanitizedFolders = this.getSanitizedFolders.bind(this)
		this.openSettingsTab = this.openSettingsTab.bind(this)

		this.updateNoteFilenames = this.updateNoteFilenames.bind(this)

		// Pretty sure sindreDebounce handles binding
		// this.syncFlashcardNotesToAnki = this.syncFlashcardNotesToAnki.bind(this)

		await this.loadSettings()
		this.addSettingTab(this.settingsTab)

		this.addCommand({
			callback: () => {
				// Trigger is not receiving a default `userInitiated` value on the
				// first invocation for some reason... so we specify it manually
				// and then flush to invoke without delay.
				// this.plugin.syncFlashcardNotesToAnki.trigger()
				void this.syncFlashcardNotesToAnki(true)
				this.syncFlashcardNotesToAnki.flush()
			},
			id: 'sync-yanki-obsidian',
			name: 'Sync flashcard notes to Anki',
		})

		// Spot any changes since last session
		this.app.workspace.onLayoutReady(async () => {
			await this.syncFlashcardNotesToAnki(false)
			this.registerEvent(this.app.vault.on('create', this.handleCreate.bind(this)))
		})

		// Create is also called when the vault is first loaded for each existing file
		this.registerEvent(this.app.vault.on('delete', this.handleDelete.bind(this)))

		// Still necessary in case notes are dragged in
		this.registerEvent(this.app.vault.on('modify', this.handleModify.bind(this)))

		// Only look at folders, which can affect deck names
		this.registerEvent(this.app.vault.on('rename', this.handleRename.bind(this)))
	}

	// Nothing to do?
	// onunload() {
	// }

	// Typed override
	async loadData(): Promise<YankiPluginSettings> {
		return super.loadData() as Promise<YankiPluginSettings>
	}

	async openSettingsTab() {
		// https://forum.obsidian.md/t/open-settings-for-my-plugin-community-plugin-settings-deeplink/61563/4
		const { setting } = this.app as unknown as {
			setting: { open: () => Promise<void>; openTabById: (id: string) => void }
		}
		await setting.open()
		setting.openTabById(this.manifest.id)
	}

	async loadSettings() {
		this.settings = { ...this.settings, ...(await this.loadData()) }
	}

	/**
	 * Translates YankiPluginSettings into a shared options object for use in Yanki library functions
	 * @param settings - YankiPluginSettings object
	 * @returns Options object with fields common to both RenameFilesOptions and SyncFilesOptions
	 */
	private getSharedOptions(
		settings: YankiPluginSettings,
	): CommonProperties<RenameFilesOptions, SyncFilesOptions> {
		return {
			dryRun: false,
			fetchAdapter: this.fetchAdapter,
			fileAdapter: {
				readFile: this.fileAdapterRead,
				readFileBuffer: this.fileAdapterReadBuffer,
				rename: this.fileAdapterRename,
				stat: this.fileAdapterStat,
				writeFile: this.fileAdapterWrite,
			},
			manageFilenames: settings.manageFilenames.enabled ? settings.manageFilenames.mode : 'off',
			maxFilenameLength: settings.manageFilenames.maxLength,
			// Using vault ID instead of name should be more robust to vault renaming... why is this private?
			// https://forum.obsidian.md/t/is-there-any-way-to-derive-the-vault-id-from-the-vault-directory/5573/4
			// Warning: changing the static components of this value can result in data loss...
			namespace: `Yanki Obsidian - Vault ID ${sanitizeNamespace((this.app as unknown as { appId: string }).appId)}`,
			obsidianVault: this.app.vault.getName(),
			syncMediaAssets: settings.sync.mediaMode,
		}
	}

	/**
	 * Translates YankiPluginSettings into an options object for use in the Yanki library's `renameFiles` function
	 * @param settings - YankiPluginSettings object
	 * @returns RenameFilesOptions object
	 */
	private getRenameFilesOptions(settings: YankiPluginSettings): RenameFilesOptions {
		return this.getSharedOptions(settings)
	}

	/**
	 * Translates YankiPluginSettings into an options object for use in the Yanki library's `syncFiles` function
	 * @param settings - YankiPluginSettings object
	 * @returns SyncFilesOptions object
	 */
	private getSyncFilesOptions(settings: YankiPluginSettings): SyncFilesOptions {
		return {
			...this.getSharedOptions(settings),
			ankiConnectOptions: {
				autoLaunch: false,
				fetchAdapter: this.fetchAdapter,
				host: settings.ankiConnect.host,
				key: settings.ankiConnect.key,
				port: settings.ankiConnect.port,
				version: 6,
			},
			ankiWeb: settings.sync.pushToAnkiWeb,
		}
	}

	async saveSettings() {
		await this.saveData(this.settings)
	}

	async fileAdapterRead(path: string): Promise<string> {
		const file = this.app.vault.getFileByPath(path)
		if (file === null) {
			throw new Error(`File not found: ${path}`)
		}

		return this.app.vault.read(file)
	}

	async fileAdapterReadBuffer(path: string): Promise<Uint8Array> {
		const file = this.app.vault.getFileByPath(path)
		if (file === null) {
			throw new Error(`File not found: ${path}`)
		}

		const content = await this.app.vault.readBinary(file)
		return new Uint8Array(content)
	}

	async fileAdapterStat(path: string): Promise<{ ctimeMs: number; mtimeMs: number; size: number }> {
		const file = this.app.vault.getFileByPath(path)
		if (file === null) {
			throw new Error(`File not found: ${path}`)
		}

		return new Promise((resolve) => {
			resolve({
				ctimeMs: file.stat.ctime,
				mtimeMs: file.stat.mtime,
				size: file.stat.size,
			})
		})
	}

	async fileAdapterWrite(path: string, data: string): Promise<void> {
		const file = this.app.vault.getFileByPath(path)
		if (file === null) {
			throw new Error(`File not found: ${path}`)
		}

		return this.app.vault.modify(file, data)
	}

	async fileAdapterRename(oldPath: string, newPath: string): Promise<void> {
		const file = this.app.vault.getFileByPath(oldPath)

		if (file === null) {
			throw new Error(`File not found: ${oldPath}`)
		}

		return this.app.vault.rename(file, newPath)
	}

	async fetchAdapter(
		input: Parameters<FetchAdapter>[0],
		init: Parameters<FetchAdapter>[1],
	): ReturnType<FetchAdapter> {
		const response = await requestUrl({
			body: init?.body,
			headers: init?.headers,
			method: init?.method,
			url: input,
		})

		return {
			headers: response.headers,
			async json() {
				// Wrapped to satisfy fetch definition
				return new Promise((resolve) => {
					resolve(response.json)
				})
			},
			status: response.status,
		}
	}

	// This never seems to fire, even after manually editing the settings file?
	async onExternalSettingsChange() {
		if (this.settings.verboseNotices) {
			// TODO when is this called?
			// new Notice('External settings changed')
		}

		const originalSettings = structuredClone(this.settings)
		await this.loadSettings()
		await this.settingsChangeSyncCheck(originalSettings)
	}

	/**
	 * Certain settings changes should trigger a sync to Anki, (but only fires if auto sync is enabled)
	 * @param previousSettings
	 */
	public async settingsChangeSyncCheck(previousSettings: YankiPluginSettings) {
		// This could be more concise...

		// Local file names have no effect on Anki's database,
		// so just update them without syncing if settings have changed
		if (!objectsEqual(previousSettings.manageFilenames, this.settings.manageFilenames)) {
			await this.updateNoteFilenames(false)
		}

		if (
			!objectsEqual(previousSettings.ankiConnect, this.settings.ankiConnect) ||
			!objectsEqual(previousSettings.sync, this.settings.sync) ||
			!arraysEqual(previousSettings.folders, this.settings.folders) ||
			previousSettings.ignoreFolderNotes !== this.settings.ignoreFolderNotes
		) {
			await this.syncFlashcardNotesToAnki(false)
		}
	}

	public async updateNoteFilenames(userInitiated = true): Promise<void> {
		if (this.settings.folders.length === 0 || !this.settings.manageFilenames.enabled) {
			return
		}

		const files: TFile[] = this.getWatchedFiles()

		if (files.length === 0) {
			return
		}

		const filePaths = files.map((file) => file.path)

		const report = await renameFiles(filePaths, this.getRenameFilesOptions(this.settings))

		if (userInitiated || this.settings.verboseNotices) {
			new Notice(formatRenameResult(report), 5000)
		}
	}

	syncFlashcardNotesToAnki = sindreDebounce(async (userInitiated): Promise<void> => {
		if (!userInitiated && !this.settings.sync.autoSyncEnabled) {
			return
		}

		if (userInitiated || this.settings.verboseNotices) {
			new Notice(
				sanitizeHTMLToDom(
					html`<strong>${userInitiated ? '' : 'Automatic '}Anki sync starting...</strong>`,
				),
			)
		}

		if (this.settings.folders.length === 0) {
			if (userInitiated || this.settings.verboseNotices) {
				new Notice(
					sanitizeHtmlToDomWithFunction(
						html`<strong>Anki sync failed:</strong><br />No flashcard folders to sync. You can
							specify flashcard folders in Yanki's <a class="settings">settings tab</a>.`,
						'settings',
						this.openSettingsTab,
					),
				)
			}

			this.settings.stats.sync.invalid++
			return
		}

		// This.syncInProgress = true

		const files: TFile[] = this.getWatchedFiles()

		if (files.length === 0) {
			if (userInitiated || this.settings.verboseNotices) {
				sanitizeHtmlToDomWithFunction(
					html`<strong>Anki sync failed:</strong><br />No flashcard notes found. Check your
						flashcard folders in Yanki's <a class="settings">settings tab</a>.`,
					'settings',
					this.openSettingsTab,
				)
			}

			this.settings.stats.sync.invalid++
			// This.syncInProgress = false
			return
		}

		const filePaths = files.map((file) => file.path)

		try {
			const report = await syncFiles(filePaths, this.getSyncFilesOptions(this.settings))

			if (userInitiated || this.settings.verboseNotices) {
				new Notice(formatSyncResult(report), 15_000)
			}

			// Dev stats
			this.settings.stats.sync.latestSyncTime = moment().unix()
			this.settings.stats.sync.duration =
				this.settings.stats.sync.duration === 0
					? report.duration
					: (this.settings.stats.sync.duration + report.duration) / 2

			for (const syncedFile of report.synced) {
				this.settings.stats.sync.notes[syncedFile.action] += 1
			}

			if (userInitiated) {
				this.settings.stats.sync.manual++
			} else {
				this.settings.stats.sync.auto++
			}
		} catch (error) {
			this.settings.stats.sync.errors++

			// Connection errors are caught in the Yanki library, and surfaced to Obsidian in the sync report
			// by detecting `ankiUnreachable` sync actions

			// Always notice on weird errors
			const fragment = sanitizeHtmlToDomWithFunction(
				html`<strong>Anki sync failed:</strong>
					<pre style="white-space: pre-wrap;">${String(error)}</pre>
					Please check <a class="settings">the plugin settings</a>, review the
					<a href="https://github.com/kitschpatrol/yanki-obsidian">documentation</a>, and try again.
					If trouble persists, you can open
					<a href="https://github.com/kitschpatrol/yanki-obsidian/issues">open an issue</a> in the
					Yanki plugin repository.`,
				'settings',
				this.openSettingsTab,
			)
			new Notice(fragment, 15_000)
		}

		// Save stats and update the settings tab
		await this.saveSettings()
		this.settingsTab.render()

		// This.syncInProgress = false
	}, this.settings.sync.autoSyncDebounceInterval)

	// Watch for changes, but only folders!
	private async handleRename(fileOrFolder: TAbstractFile, oldPath: string) {
		// If (this.syncInProgress) {
		// 	return
		// }

		if (fileOrFolder instanceof TFile) {
			return
		}

		const watchedFolders = this.getSanitizedFolders()
		if (watchedFolders.includes(oldPath)) {
			const updatedFolders = watchedFolders.map((folder) => {
				if (folder.startsWith(oldPath)) {
					return fileOrFolder.path + folder.slice(oldPath.length)
				}

				return folder
			})
			this.settings.folders = updatedFolders
			await this.saveSettings()
			await this.syncFlashcardNotesToAnki(false)
		} else if (this.isInsideWatchedFolders(fileOrFolder)) {
			//
			await this.syncFlashcardNotesToAnki(false)
		}
	}

	private async handleCreate(fileOrFolder: TAbstractFile) {
		// If (this.syncInProgress) {
		// 	return
		// }

		// Don't care about folders
		if (fileOrFolder instanceof TFile && this.isInsideWatchedFolders(fileOrFolder)) {
			await this.syncFlashcardNotesToAnki(false)
		}
	}

	private async handleDelete(fileOrFolder: TAbstractFile) {
		if (this.isInsideWatchedFolders(fileOrFolder)) {
			// Remove from settings if it was a watched folder
			if (fileOrFolder instanceof TFolder) {
				const watchedFolders = this.getSanitizedFolders()
				const initialLength = watchedFolders.length
				this.settings.folders = watchedFolders.filter((folder) => folder !== fileOrFolder.path)
				if (this.settings.folders.length !== initialLength) {
					await this.saveSettings()
				}
			}

			await this.syncFlashcardNotesToAnki(false)
		}
	}

	private async handleModify(fileOrFolder: TAbstractFile) {
		// If (this.syncInProgress) {
		// 	return
		// }

		if (this.isInsideWatchedFolders(fileOrFolder)) {
			// Rename right away
			await this.updateNoteFilenames(false)
			await this.syncFlashcardNotesToAnki(false)
		}
	}

	private isInsideWatchedFolders(fileOrFolder: TAbstractFile): boolean {
		// Use dirname to find parent folder even if file has been deleted
		const folderPath = `${fileOrFolder instanceof TFolder ? fileOrFolder.path : fileOrFolder.parent?.path ?? path.dirname(fileOrFolder.path)}/`
		return this.getSanitizedFolders().some((watchedFolder) => folderPath.startsWith(watchedFolder))
	}

	public getWatchedFiles(): TFile[] {
		const { ignoreFolderNotes } = this.settings

		const files: TFile[] = []
		for (const folderPath of this.getSanitizedFolders()) {
			const folder = this.app.vault.getAbstractFileByPath(folderPath)

			if (folder instanceof TFolder) {
				Vault.recurseChildren(folder, (file) => {
					// Optionally ignore folder notes
					if (
						file instanceof TFile &&
						(!ignoreFolderNotes || file.parent?.name !== file.basename)
					) {
						files.push(file)
					}
				})
			}
		}

		return files
	}

	public getSanitizedFolders(): string[] {
		return [...new Set(this.settings.folders.filter((folder) => folder.trim().length > 0))]
	}
}
