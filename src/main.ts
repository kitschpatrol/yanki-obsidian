/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable no-new */
/* eslint-disable perfectionist/sort-classes */

import {
	YankiPluginSettingTab,
	type YankiPluginSettings,
	yankiPluginDefaultSettings,
} from './settings/settings'
import { arraysEqual, formatSyncReport } from './utilities'
import { Notice, Plugin, type TAbstractFile, TFile, TFolder, Vault, debounce } from 'obsidian'
import throttle from 'throttleit'
// Import { YankiConnect } from 'yanki-connect'
import { syncFiles } from 'yanki-md'

export default class YankiPlugin extends Plugin {
	public settings: YankiPluginSettings = yankiPluginDefaultSettings

	// Throttle fires on the leading edge, unlike Obsidian's built-in debounce which fires on the
	// trailing edge. Users should get the throttled experience, but automated syncs should get the
	// the debounced implementation due to event noise.
	public syncFlashcardsToAnkiExternal = throttle(this.syncFlashcardsToAnki, 5000)
	private syncFlashcardsToAnkiInternal = debounce(this.syncFlashcardsToAnki, 5000)

	async onload() {
		this.syncFlashcardsToAnki = this.syncFlashcardsToAnki.bind(this)
		this.syncFlashcardsToAnkiInternal = this.syncFlashcardsToAnkiInternal.bind(this)
		this.syncFlashcardsToAnkiExternal = this.syncFlashcardsToAnkiExternal.bind(this)
		this.fileAdapterWrite = this.fileAdapterWrite.bind(this)
		this.fileAdapterRead = this.fileAdapterRead.bind(this)

		await this.loadSettings()
		this.addSettingTab(new YankiPluginSettingTab(this.app, this))

		this.addCommand({
			callback: async () => {
				await this.syncFlashcardsToAnkiExternal(true)
			},
			id: 'sync-yanki-obsidian',
			name: 'Sync flashcards to Anki',
		})

		// Spot any changes since last session
		this.app.workspace.onLayoutReady(async () => {
			await this.syncFlashcardsToAnki()
			this.registerEvent(this.app.vault.on('create', this.handleCreate.bind(this)))
		})

		// Create is also called when the vault is first loaded for each existing file
		this.registerEvent(this.app.vault.on('delete', this.handleDelete.bind(this)))

		// Still necessary in case files are dragged in
		this.registerEvent(this.app.vault.on('modify', this.handleModify.bind(this)))
		this.registerEvent(this.app.vault.on('rename', this.handleRename.bind(this)))
	}

	onunload() {
		// Anything to do?
	}

	// Typed override
	async loadData(): Promise<YankiPluginSettings> {
		return super.loadData() as Promise<YankiPluginSettings>
	}

	async loadSettings() {
		this.settings = { ...this.settings, ...(await this.loadData()) }
		this.settings.syncOptions.obsidianVault = this.app.vault.getName()
		this.settings.syncOptions.namespace = `Yanki Obsidian - ${this.app.vault.getName()}`
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

	// This never seems to fire?
	async onExternalSettingsChange() {
		new Notice('External settings changed')
		const originalSettings = JSON.parse(JSON.stringify(this.settings)) as YankiPluginSettings
		await this.loadSettings()
		await this.settingsChangeSyncCheck(originalSettings)
	}

	public async settingsChangeSyncCheck(previousSettings: YankiPluginSettings) {
		const {
			host: oldHost,
			key: oldKey,
			port: oldPort,
		} = previousSettings.syncOptions.ankiConnectOptions
		const { host, key, port } = this.settings.syncOptions.ankiConnectOptions

		if (
			key !== oldKey ||
			host !== oldHost ||
			port !== oldPort ||
			!arraysEqual(previousSettings.folders, this.settings.folders)
		) {
			new Notice('Settings changed warranting sync')
			await this.syncFlashcardsToAnkiExternal(false)
		}
	}

	private async syncFlashcardsToAnki(userInitiated = false): Promise<void> {
		if (!userInitiated && !this.settings.autoSyncEnabled) {
			return
		}

		if (userInitiated) {
			new Notice('User initiated')
		}

		if (userInitiated || this.settings.verboseLogging) {
			new Notice('Anki sync started...')
		}

		if (this.settings.folders.length === 0) {
			new Notice("No flashcard folders to sync. You can specify folders in Yanki's settings tab.")
			return
		}

		const files: TFile[] = []
		for (const folderPath of this.settings.folders) {
			const folder = this.app.vault.getAbstractFileByPath(folderPath)

			if (folder instanceof TFolder) {
				Vault.recurseChildren(folder, (file) => {
					if (file instanceof TFile) {
						files.push(file)
					}
				})
			}
		}

		if (files.length === 0) {
			new Notice('No flashcard files found.')
			return
		}

		const filePaths = files.map((file) => file.path)

		try {
			const report = await syncFiles(
				filePaths,
				this.settings.syncOptions,
				this.fileAdapterRead,
				this.fileAdapterWrite,
			)

			if (userInitiated || this.settings.verboseLogging) {
				new Notice(formatSyncReport(report), 15_000)
			}
		} catch (error) {
			if (userInitiated || this.settings.verboseLogging) {
				const errorNoticeFragment = new DocumentFragment()
				const errorMessage = errorNoticeFragment.createEl('span')

				errorMessage.innerHTML =
					error instanceof Error && error.message === 'Failed to fetch'
						? '<strong>Anki sync failed:</strong> Could not connect to Anki<br>Make sure that Anki is running, and that it has the <a href="https://foosoft.net/projects/anki-connect/">Anki-Connect</a> add-on installed.'
						: '<strong>Anki sync failed:</strong> Unknown error.<br>Please check your settings, review the <a href="https://github.com/kitschpatrol/yanki-obsidian">documentation</a>, and try again. If trouble persists, you can open <a href="https://github.com/kitschpatrol/yanki-obsidian/issues">open an issue</a> in the Yanki plugin repository.'

				new Notice(errorNoticeFragment, 15_000)
			}
		}
	}

	// Watch for changes
	private async handleRename(fileOrFolder: TAbstractFile, oldPath: string) {
		if (this.settings.folders.includes(oldPath)) {
			new Notice('Watched folder renamed')
			const updatedFolders = this.settings.folders.map((folder) => {
				if (folder.startsWith(oldPath)) {
					return fileOrFolder.path + folder.slice(oldPath.length)
				}

				return folder
			})
			this.settings.folders = updatedFolders
			await this.saveSettings()
			this.syncFlashcardsToAnkiInternal()
		} else if (this.isInsideWatchedFolders(fileOrFolder)) {
			new Notice('Renamed')
			this.syncFlashcardsToAnkiInternal()
		}
	}

	private handleCreate(fileOrFolder: TAbstractFile) {
		// Don't care about folders
		if (fileOrFolder instanceof TFile && this.isInsideWatchedFolders(fileOrFolder)) {
			new Notice('Create')
			this.syncFlashcardsToAnkiInternal()
		}
	}

	private async handleDelete(fileOrFolder: TAbstractFile) {
		if (this.isInsideWatchedFolders(fileOrFolder)) {
			// Remove from settings if it was a watched folder
			if (fileOrFolder instanceof TFolder) {
				const initialLength = this.settings.folders.length
				this.settings.folders = this.settings.folders.filter(
					(folder) => folder !== fileOrFolder.path,
				)
				if (this.settings.folders.length !== initialLength) {
					new Notice('Delete Watched Folder')
					await this.saveSettings()
				}
			} else {
				new Notice('Delete')
			}

			this.syncFlashcardsToAnkiInternal()
		}
	}

	private handleModify(fileOrFolder: TAbstractFile) {
		if (this.isInsideWatchedFolders(fileOrFolder)) {
			new Notice('Modified')
			this.syncFlashcardsToAnkiInternal()
		}
	}

	private isInsideWatchedFolders(fileOrFolder: TAbstractFile): boolean {
		const folderPath = `${fileOrFolder instanceof TFolder ? fileOrFolder.path : fileOrFolder.parent?.path}/`
		return this.settings.folders.some((watchedFolder) => folderPath.startsWith(watchedFolder))
	}
}
