/* eslint-disable no-new */

import type YankiPlugin from '../main'
import { FolderSuggest } from './folder-suggest'
import { type App, type ButtonComponent, Notice, PluginSettingTab, Setting } from 'obsidian'
import { type SyncOptions, hostAndPortToUrl, urlToHostAndPort } from 'yanki-md'

export type YankiPluginSettings = {
	autoSyncEnabled: boolean
	folders: string[]
	syncOptions: SyncOptions
	verboseLogging: boolean
}

export const yankiPluginDefaultSettings: YankiPluginSettings = {
	autoSyncEnabled: true,
	folders: ['Anki'], // TODO reset
	syncOptions: {
		ankiConnectOptions: {
			autoLaunch: false,
			customFetch: undefined,
			host: 'http://localhost',
			key: undefined,
			port: 8765,
			version: 6,
		},
		ankiWeb: true,
		defaultDeckName: 'Yanki Obsidian Default',
		dryRun: false,
		namespace: 'Yanki Obsidian Plugin', // To be overwritten with deck name
		obsidianVault: undefined,
	},
	verboseLogging: true, // TODO
}

export class YankiPluginSettingTab extends PluginSettingTab {
	initialSettings: YankiPluginSettings = yankiPluginDefaultSettings
	plugin: YankiPlugin

	constructor(app: App, plugin: YankiPlugin) {
		super(app, plugin)
		this.plugin = plugin
	}

	display(): void {
		new Notice('Saving initial settings')
		this.initialSettings = JSON.parse(JSON.stringify(this.plugin.settings)) as YankiPluginSettings
		this.containerEl.addClass('yanki-settings')
		this.render()
	}

	async hide(): Promise<void> {
		let folders = [...new Set(this.plugin.settings.folders)]
		if (folders.length === 0) {
			folders = ['']
		}

		this.plugin.settings.folders = folders
		await this.plugin.saveSettings()
		await this.plugin.settingsChangeSyncCheck(this.initialSettings)
	}

	render(): void {
		this.containerEl.empty()

		// Fake input to catch the automatic focus that was popping the search input.
		// Focus is still just a tab away.
		const focusCatcher = this.containerEl.createEl('input', { type: 'text' })
		focusCatcher.setAttribute('style', 'display: none;')

		// ----------------------------------------------------

		// Folders

		new Setting(this.containerEl)
			.setHeading()
			.setName('Anki flashcard folders')
			.setDesc(
				'Yanki will sync files in the folders specified to Anki. Folder syncing is always recursive, and Anki decks will be created to match the hierarchy of your Obsidian folders.',
			)

		for (const [index, folder] of this.plugin.settings.folders.entries()) {
			new Setting(this.containerEl)
				.addSearch((callback) => {
					new FolderSuggest(callback.inputEl, this.app)
					callback
						.setPlaceholder('Select a folder')
						.setValue(folder)
						.onChange(async (value) => {
							this.plugin.settings.folders[index] = value
							await this.plugin.saveSettings()
						})
				})
				.addExtraButton((callback) => {
					callback
						.setIcon('cross')
						.setTooltip('Delete')
						.onClick(async () => {
							this.plugin.settings.folders.splice(index, 1)
							await this.plugin.saveSettings()
							this.render()
						})
				})
				.infoEl.remove()
		}

		new Setting(this.containerEl).addButton((button: ButtonComponent) => {
			button
				.setTooltip('Add Folder')
				.setButtonText('Add Folder')
				.setCta()
				// .setIcon('plus')
				.onClick(async () => {
					this.plugin.settings.folders.push('')
					await this.plugin.saveSettings()
					this.render()
				})
		})

		// ----------------------------------------------------

		// Sync

		new Setting(this.containerEl).setName('Sync settings').setHeading()

		new Setting(this.containerEl)
			.setName('Automatic sync')
			.setDesc('Sync to the local Anki database whenever flashcard files are changed.')
			.addToggle((toggle) => {
				toggle.setValue(this.plugin.settings.autoSyncEnabled)
				toggle.onChange(async (value) => {
					this.plugin.settings.autoSyncEnabled = value
					await this.plugin.saveSettings()
				})
			})

		new Setting(this.containerEl)
			.setName('Push to AnkiWeb')
			.setDesc(
				'Sync changes to the AnkiWeb "cloud" in addition to the local Anki database. This is like pressing the "Sync" button in the Anki desktop app.',
			)
			.addToggle((toggle) => {
				toggle.setValue(this.plugin.settings.syncOptions.ankiWeb)
				toggle.onChange(async (value) => {
					this.plugin.settings.syncOptions.ankiWeb = value
					await this.plugin.saveSettings()
				})
			})

		new Setting(this.containerEl).addButton((button) => {
			button.setButtonText('Sync now')
			button.onClick(async () => {
				await this.plugin.syncFlashcardsToAnkiExternal(true)
			})
		})

		// ----------------------------------------------------

		// Anki-Connect

		const ankiConnectSetting = new Setting(this.containerEl)
			.setName('Anki-Connect settings')
			.setHeading()

		ankiConnectSetting.descEl.innerHTML =
			'Anki-Connect is the Anki add-on that enables communication between Obsidian and Anki. See the <a href="https://foosoft.net/projects/anki-connect/">Anki-Connect documentation</a> for more information. The default settings below are usually fine.'

		new Setting(this.containerEl)
			.setName('Host')
			.setDesc('Set the host and port to match your Anki-Connect configuration.')
			.addText((text) => {
				text.setPlaceholder('Host Name and Port')
				const { host, port } = this.plugin.settings.syncOptions.ankiConnectOptions
				text.setValue(hostAndPortToUrl(host, port))

				text.onChange(async (value) => {
					const { host, port } = urlToHostAndPort(value)
					this.plugin.settings.syncOptions.ankiConnectOptions.host = host
					this.plugin.settings.syncOptions.ankiConnectOptions.port = port
					await this.plugin.saveSettings()
				})
			})

		new Setting(this.containerEl)
			.setName('Key')
			.setDesc('Optional API security key to match your custom Anki-Connect configuration.')
			.addText((text) => {
				text.setPlaceholder('API Key')

				text.setValue(this.plugin.settings.syncOptions.ankiConnectOptions.key ?? '')
				text.onChange(async (value) => {
					this.plugin.settings.syncOptions.ankiConnectOptions.key =
						value.trim().length > 0 ? value.trim() : undefined
					await this.plugin.saveSettings()
				})
			})

		// Needs Node environment
		// new Setting(this.containerEl)
		// 	.setName('Auto-Launch Anki')
		// 	.setDesc(
		// 		'Experimental Mac-only feature to automatically launch the Anki desktop app when syncing.',
		// 	)
		// 	.addToggle(async (toggle) => {
		// 		const { autoLaunch } = this.plugin.settings.syncOptions.ankiConnectOptions

		// 		toggle.setValue(autoLaunch).onChange(async (enabled) => {
		// 			this.plugin.settings.syncOptions.ankiConnectOptions.autoLaunch = enabled
		// 			await this.plugin.saveSettings()
		// 		})
		// 	})

		new Setting(this.containerEl).addButton((button) => {
			button.setButtonText('Reset to Anki-Connect defaults')
			button.onClick(async () => {
				this.plugin.settings.syncOptions.ankiConnectOptions =
					yankiPluginDefaultSettings.syncOptions.ankiConnectOptions

				await this.plugin.saveSettings()
				this.render()

				new Notice("Reset Yanki's Anki-Connect settings to defaults.")
			})
		})
	}
}
