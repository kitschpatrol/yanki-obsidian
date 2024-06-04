/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable no-new */
import {
	YankiPluginSettingTab,
	type YankiPluginSettings,
	yankiPluginDefaultSettings,
} from './settings/settings'
import { Notice, Plugin, type TAbstractFile, TFile, TFolder, Vault } from 'obsidian'
// Import { YankiConnect } from 'yanki-connect'
import { formatSyncReport, syncFiles } from 'yanki-md'

export default class YankiPlugin extends Plugin {
	public settings: YankiPluginSettings = yankiPluginDefaultSettings

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

	async handleRename(file: TAbstractFile, oldPath: string) {
		if (file instanceof TFolder) {
			const renamedFolder = file.path
			const updatedFolders = this.settings.folders.map((folder) => {
				if (folder.startsWith(oldPath)) {
					return renamedFolder + folder.slice(oldPath.length)
				}

				return folder
			})
			this.settings.folders = updatedFolders
			await this.saveSettings()
		}
	}

	// Typed overrides
	async loadData(): Promise<YankiPluginSettings> {
		return super.loadData() as Promise<YankiPluginSettings>
	}

	async loadSettings() {
		this.settings = { ...this.settings, ...(await this.loadData()) }
		this.settings.syncOptions.obsidianVault = this.app.vault.getName()
	}

	async onload() {
		console.log('Loading Yanki plugin')

		this.syncFlashcardsToAnki = this.syncFlashcardsToAnki.bind(this)
		this.fileAdapterRead = this.fileAdapterRead.bind(this)
		this.fileAdapterWrite = this.fileAdapterWrite.bind(this)

		// Listen for file renames
		// this.registerEvent(this.app.vault.on('rename', this.handleRename.bind(this)))

		this.addCommand({
			callback: () => setTimeout(this.syncFlashcardsToAnki, 20),
			id: 'sync-yanki-obsidian',
			name: 'Sync flashcards to Anki',
		})

		await this.loadSettings()

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new YankiPluginSettingTab(this.app, this))
	}

	onunload() {
		console.log('Unloading Yanki plugin')
	}

	async saveSettings() {
		await this.saveData(this.settings)
	}

	async syncFlashcardsToAnki(): Promise<void> {
		console.log('Syncing')

		if (this.settings.folders.length === 0) {
			new Notice("No flashcard folders to sync. You can specify folders in Yanki's settings tab.")
			return
		}

		const files: TFile[] = []
		for (const folderPath of this.settings.folders) {
			console.log(folderPath)

			const folder = this.app.vault.getAbstractFileByPath(folderPath)

			console.log('----------------------------------')
			console.log(folder)

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

		new Notice('Syncing flashcards to Anki...')

		const filePaths = files.map((file) => file.path)
		console.log(filePaths)

		const report = await syncFiles(
			filePaths,
			this.settings.syncOptions,
			this.fileAdapterRead,
			this.fileAdapterWrite,
		)

		const formattedReport = formatSyncReport(report, true)
		new Notice(formattedReport, 15_000)
	}
}
