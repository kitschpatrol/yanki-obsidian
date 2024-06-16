/* eslint-disable unicorn/consistent-function-scoping */
/* eslint-disable @typescript-eslint/unbound-method */

import {
	YankiPluginSettingTab,
	type YankiPluginSettings,
	yankiDebounceInterval,
	yankiPluginDefaultSettings,
} from './settings/settings'
import {
	arraysEqual,
	formatRenameReport,
	formatSyncReport,
	html,
	sanitizeHtmlToDomWithFunction,
	sanitizeNamespace,
} from './utilities'
import sindreDebounce from 'debounce'
import path from 'node:path'
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
import { renameFiles, syncFiles } from 'yanki'

export default class YankiPlugin extends Plugin {
	public settings: YankiPluginSettings = yankiPluginDefaultSettings
	private readonly settingsTab: YankiPluginSettingTab = new YankiPluginSettingTab(this.app, this)

	// Where is "unregisterEvent"?
	// private readonly syncInProgress = false

	async onload() {
		this.fileAdapterWrite = this.fileAdapterWrite.bind(this)
		this.fileAdapterRead = this.fileAdapterRead.bind(this)
		this.fileAdapterRename = this.fileAdapterRename.bind(this)
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
				this.syncFlashcardNotesToAnki.trigger()
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
		this.settings.syncOptions.obsidianVault = this.app.vault.getName()
		// Using vault ID instead of name should be more robust to vault renaming... why is this private?
		// https://forum.obsidian.md/t/is-there-any-way-to-derive-the-vault-id-from-the-vault-directory/5573/4
		// Warning: changing the static components of this value can result in data loss...
		this.settings.syncOptions.namespace = `Yanki Obsidian - Vault ID ${sanitizeNamespace((this.app as unknown as { appId: string }).appId)}`
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

	// This never seems to fire?
	async onExternalSettingsChange() {
		if (this.settings.verboseLogging) {
			new Notice('External settings changed')
		}

		const originalSettings = structuredClone(this.settings)
		await this.loadSettings()
		await this.settingsChangeSyncCheck(originalSettings)
	}

	/**
	 * Certain settings changes require a sync to Anki
	 * @param previousSettings
	 */
	public async settingsChangeSyncCheck(previousSettings: YankiPluginSettings) {
		const {
			ankiConnectOptions: { host: oldHost, key: oldKey, port: oldPort },
			ankiWeb: oldAnkiWeb,
			manageFilenames: oldManageFilenames,
			maxFilenameLength: oldMaxFilenameLength,
		} = previousSettings.syncOptions

		const {
			ankiConnectOptions: { host, key, port },
			ankiWeb,
			manageFilenames,
			maxFilenameLength,
		} = this.settings.syncOptions

		if (
			key !== oldKey ||
			host !== oldHost ||
			port !== oldPort ||
			ankiWeb !== oldAnkiWeb ||
			manageFilenames !== oldManageFilenames ||
			maxFilenameLength !== oldMaxFilenameLength ||
			!arraysEqual(previousSettings.folders, this.settings.folders)
		) {
			await this.syncFlashcardNotesToAnki(false)
		}
	}

	private async updateNoteFilenames(): Promise<void> {
		if (this.settings.folders.length === 0 || this.settings.syncOptions.manageFilenames === 'off') {
			return
		}

		const files: TFile[] = this.getWatchedFiles()

		if (files.length === 0) {
			return
		}

		const filePaths = files.map((file) => file.path)

		const report = await renameFiles(
			filePaths,
			{
				...this.settings.syncOptions,
			},
			this.fileAdapterRead,
			this.fileAdapterWrite,
			this.fileAdapterRename,
		)

		if (this.settings.verboseLogging) {
			new Notice(formatRenameReport(report), 5000)
		}
	}

	syncFlashcardNotesToAnki = sindreDebounce(async (userInitiated = true): Promise<void> => {
		if (!userInitiated && !this.settings.autoSyncEnabled) {
			return
		}

		if (userInitiated || this.settings.verboseLogging) {
			new Notice(
				sanitizeHTMLToDom(
					html`<strong>${userInitiated ? '' : 'Automatic '}Anki sync starting...</strong>`,
				),
			)
		}

		if (this.settings.folders.length === 0) {
			if (userInitiated || this.settings.verboseLogging) {
				new Notice(
					sanitizeHtmlToDomWithFunction(
						html`<strong>Anki sync failed:</strong> No flashcard folders to sync. You can specify
							flashcard folders in the Yanki plugin's <a class="settings">settings tab</a>.`,
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
			if (userInitiated || this.settings.verboseLogging) {
				sanitizeHtmlToDomWithFunction(
					html`<strong>Anki sync failed:</strong> No flashcard notes found. Check your flashcard
						folders in the Yanki plugin's <a class="settings">settings tab</a>.`,
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
			const report = await syncFiles(
				filePaths,
				{
					...this.settings.syncOptions,
					ankiConnectOptions: {
						// Use Obsidian's fetch implementation
						async customFetch(input, init) {
							const response = await requestUrl({
								body: init.body,
								headers: init.headers,
								method: init.method,
								url: input,
							})

							return {
								async json() {
									// Wrapped to satisfy fetch definition
									return new Promise((resolve) => {
										resolve(response.json)
									})
								},
								status: response.status,
							}
						},
					},
				},
				this.fileAdapterRead,
				this.fileAdapterWrite,
				this.fileAdapterRename,
			)

			if (userInitiated || this.settings.verboseLogging) {
				new Notice(formatSyncReport(report), 15_000)
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
	}, yankiDebounceInterval)

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
			await this.updateNoteFilenames()
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
