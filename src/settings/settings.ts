/* eslint-disable no-new */

// With inspiration from obsidian-auto-note-mover-main

import type YankiPlugin from '../main'
import { FolderSuggest } from './file-suggest'
import { type App, type ButtonComponent, Notice, PluginSettingTab, Setting } from 'obsidian'
// Import { type SyncOptions } from 'yanki-md'

// Import { type SyncOptions, defaultSyncOptions, hostAndPortToUrl, urlToHostAndPort } from 'yanki-md'

export type YankiPluginSettings = {
	folders: string[]
	syncOptions: {
		ankiConnectOptions: {
			autoLaunch: boolean
			host: string
			key: string | undefined
			port: number
			version: 6
		}
		defaultDeckName: string
		dryRun: boolean
		namespace: string
		obsidianVault: string | undefined
	}
}

export const yankiPluginDefaultSettings: YankiPluginSettings = {
	folders: [''],
	syncOptions: {
		ankiConnectOptions: {
			autoLaunch: false,
			host: 'http://localhost',
			key: undefined,
			port: 8765,
			version: 6,
		},
		defaultDeckName: 'Yanki Obsidian Default',
		dryRun: false,
		namespace: 'Yanki Obsidian',
		obsidianVault: undefined,
	},
}

// Export const yankiPluginDefaultSettings: YankiPluginSettings = {
// 	folders: [''],
// 	syncOptions: {
// 		...defaultSyncOptions,
// 		defaultDeckName: 'Yanki Obsidian Default',
// 		namespace: 'Yanki Obsidian',
// 	},
// }

export class YankiPluginSettingTab extends PluginSettingTab {
	plugin: YankiPlugin

	constructor(app: App, plugin: YankiPlugin) {
		super(app, plugin)
		this.plugin = plugin

		console.log('YankiPluginSettingTab constructor')
	}

	display(): void {
		const { containerEl } = this

		containerEl.empty()
		this.containerEl.empty()

		containerEl.addClass('yanki-settings')

		this.containerEl.createEl('h2', { text: 'Yanki Settings' })

		// Const descElement = document.createDocumentFragment()

		new Setting(this.containerEl).setDesc(
			'Auto Note Mover will automatically move the active notes to their respective folders according to the rules.',
		)

		new Setting(this.containerEl)
			.setName('Flashcard Folders')
			.setDesc(
				'Yanki will automatically sync files in these folders from Obsidian to Anki. Folder syncing is always recursive, and Anki decks will be created to match the hierarchy of your Obsidian folders.',
			)

		for (const [index, folder] of this.plugin.settings.folders.entries()) {
			const s = new Setting(this.containerEl).addSearch((callback) => {
				new FolderSuggest(this.app, callback.inputEl)
				callback
					.setPlaceholder('Select a folder')
					.setValue(folder)
					.onChange(async (value) => {
						this.plugin.settings.folders[index] = value
						await this.plugin.saveSettings()
					})
			})

			s.addExtraButton((callback) => {
				callback
					.setIcon('cross')
					.setTooltip('Delete')
					.onClick(async () => {
						this.plugin.settings.folders.splice(index, 1)
						await this.plugin.saveSettings()
						this.display()
					})

				// If (index === 0) {
				// 	callback.extraSettingsEl.style.visibility = 'hidden'
				// }
			})

			s.setClass('yanki-folder')
			s.infoEl.remove()
		}

		new Setting(this.containerEl)
			.addButton((button: ButtonComponent) => {
				button
					.setTooltip('Add Folder')
					.setButtonText('Add Folder')
					.setCta()
					// .setIcon('plus')
					.onClick(async () => {
						this.plugin.settings.folders.push('')
						await this.plugin.saveSettings()
						this.display()
					})
			})
			.infoEl.remove()

		// Anki-Connect

		// utoLaunch?: boolean | "immediately" | undefined;
		// host?: string | undefined;
		// key?: string | undefined;
		// port?: number | undefined;
		// version?:

		new Setting(this.containerEl)
			.setName('Anki-Connect Settings')
			.setDesc('See the <a href="">Anki-Connect documentation</a>.')

		new Setting(this.containerEl)
			.setName('Host')
			.setDesc(
				'Set the host and port to match your Anki-Connect configuration. The default is usually fine.',
			)
			.addText((text) => {
				text.setPlaceholder('Host Name')

				// Const hostAndPort = hostAndPortToUrl(
				// 	this.plugin.settings.syncOptions.ankiConnectOptions.host,
				// 	this.plugin.settings.syncOptions.ankiConnectOptions.port,
				// )

				// text.setValue(hostAndPort)
				// This.display()
				// text.onChange(async (value) => {
				// 	// Const { host, port } = urlToHostAndPort(value)
				// 	// this.plugin.settings.syncOptions.ankiConnectOptions.host = host
				// 	// this.plugin.settings.syncOptions.ankiConnectOptions.port = port
				// 	await this.plugin.saveSettings()
				// })
			})

		new Setting(this.containerEl)
			.setName('Port')
			.setDesc('Change the icon identifier used in notes.')
			.addText((text) => {
				console.log(this.plugin.settings.syncOptions.ankiConnectOptions)
				text.setPlaceholder('Port Name')

				text.setValue(this.plugin.settings.syncOptions.ankiConnectOptions.port?.toString(10) ?? '')
				// This.display()
				text.onChange(async (value) => {
					this.plugin.settings.syncOptions.ankiConnectOptions.port = Number.parseInt(value, 10)
					await this.plugin.saveSettings()
				})
			})

		new Setting(this.containerEl)
			.setName('Auto-Launch Anki')
			.setDesc(
				'Experimental Mac-only feature to automatically launch the Anki desktop app when syncing.',
			)
			.addToggle(async (toggle) => {
				const { autoLaunch } = this.plugin.settings.syncOptions.ankiConnectOptions

				toggle.setValue(autoLaunch).onChange(async (enabled) => {
					this.plugin.settings.syncOptions.ankiConnectOptions.autoLaunch = enabled
					await this.plugin.saveSettings()
				})
			})

		new Setting(this.containerEl).addButton((button) => {
			button.setButtonText('Reset to Defaults')
			button.onClick(async () => {
				this.plugin.settings.syncOptions.ankiConnectOptions =
					yankiPluginDefaultSettings.syncOptions.ankiConnectOptions
				await this.plugin.saveSettings()
				this.display()
				new Notice("Reset Yanki's Anki-Connect settings to defaults.")
			})
		})
	}

	async hide(): Promise<void> {
		let folders = [...new Set(this.plugin.settings.folders)]
		if (folders.length === 0) {
			folders = ['']
		}

		this.plugin.settings.folders = folders
		await this.plugin.saveSettings()
		console.log('YankiPluginSettingTab hide')
	}
}
