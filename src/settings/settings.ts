/* eslint-disable @typescript-eslint/member-ordering */
/* eslint-disable no-new */

import { FolderSuggest } from '../extensions/folder-suggest'
import type YankiPlugin from '../main'
import { capitalize } from '../utilities'
import {
	type App,
	type ButtonComponent,
	Notice,
	PluginSettingTab,
	Setting,
	moment,
	sanitizeHTMLToDom,
} from 'obsidian'
import prettyMilliseconds from 'pretty-ms'
import { type SyncOptions, hostAndPortToUrl, urlToHostAndPort } from 'yanki'

export const yankiDebounceInterval = 5000

export type YankiPluginSettings = {
	autoSyncEnabled: boolean
	folders: string[]
	ignoreFolderNotes: boolean
	stats: {
		sync: {
			auto: number
			duration: number
			errors: number
			invalid: number
			latestSyncTime: number | undefined
			manual: number
			notes: {
				created: number
				deleted: number
				recreated: number
				unchanged: number
				updated: number
			}
		}
	}
	syncOptions: SyncOptions
	verboseLogging: boolean
}

export const yankiPluginDefaultSettings: YankiPluginSettings = {
	autoSyncEnabled: true,
	folders: [],
	ignoreFolderNotes: true,
	stats: {
		sync: {
			auto: 0,
			duration: 0,
			errors: 0,
			invalid: 0,
			latestSyncTime: undefined,
			manual: 0,
			notes: {
				created: 0,
				deleted: 0,
				recreated: 0,
				unchanged: 0,
				updated: 0,
			},
		},
	},
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
	verboseLogging: false,
}

export class YankiPluginSettingTab extends PluginSettingTab {
	private initialSettings: YankiPluginSettings = yankiPluginDefaultSettings
	plugin: YankiPlugin

	constructor(app: App, plugin: YankiPlugin) {
		super(app, plugin)
		this.plugin = plugin
	}

	display(): void {
		this.initialSettings = JSON.parse(JSON.stringify(this.plugin.settings)) as YankiPluginSettings
		this.containerEl.addClass('yanki-settings')
		this.containerEl.setAttr('id', 'yanki-settings')
		this.render()
	}

	async hide(): Promise<void> {
		// Normalize folders
		this.plugin.settings.folders = this.plugin.getSanitizedFolders()
		await this.plugin.settingsChangeSyncCheck(this.initialSettings)
	}

	public render(): void {
		this.containerEl.empty()

		// Cancel any pending syncs
		this.plugin.syncFlashcardsToAnki.clear()

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

		if (this.plugin.settings.folders.length === 0) {
			this.plugin.settings.folders.push('')
		}

		for (const [index, folder] of this.plugin.settings.folders.entries()) {
			new Setting(this.containerEl)
				.addSearch((callback) => {
					new FolderSuggest(callback.inputEl, this.app)
					callback
						.setPlaceholder('Select a folder')
						.setValue(folder)
						.onChange((value) => {
							this.plugin.settings.folders[index] = value
							// Only really update on blur
						})

					callback.inputEl.addEventListener('blur', async () => {
						await this.plugin.saveSettings()
						this.render()
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

					if (index === 0) {
						callback.extraSettingsEl.style.visibility = 'hidden'
					}
				})
				.infoEl.remove()
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
						this.render()
					})
			})
			.setDesc(
				sanitizeHTMLToDom(
					`Flashcard files found: <em>${this.plugin.getWatchedFiles().length}</em>`,
				),
			)

		new Setting(this.containerEl)
			.setName('Ignore folder notes')
			.setDesc(
				'Exclude notes with the same name as their parent folder from syncing. Useful in combination with the Folder notes plugin.',
			)
			.addToggle((toggle) => {
				toggle.setValue(this.plugin.settings.ignoreFolderNotes)
				toggle.onChange(async (value) => {
					this.plugin.settings.ignoreFolderNotes = value
					await this.plugin.saveSettings()
					this.render()
				})
			})

		// ----------------------------------------------------

		// Sync

		new Setting(this.containerEl).setName('Sync settings').setHeading()

		new Setting(this.containerEl)
			.setName('Automatic sync')
			.setDesc(
				'Sync to the local Anki database whenever flashcard files are changed and the Anki desktop app is open.',
			)
			.addToggle((toggle) => {
				toggle.setValue(this.plugin.settings.autoSyncEnabled)
				toggle.onChange(async (value) => {
					this.plugin.settings.autoSyncEnabled = value
					await this.plugin.saveSettings()
					this.render()
				})
			})

		new Setting(this.containerEl)
			.setName('Push to AnkiWeb')
			.setDesc(
				'Sync changes to the AnkiWeb "cloud" in addition to the local Anki database. This is like pressing the "Sync" button in the Anki desktop app.',
			)
			.addToggle((toggle) => {
				toggle.setValue(
					this.plugin.settings.autoSyncEnabled ? this.plugin.settings.syncOptions.ankiWeb : false,
				)
				toggle.onChange(async (value) => {
					this.plugin.settings.syncOptions.ankiWeb = value
					await this.plugin.saveSettings()
					this.render()
				})
			})
			.setDisabled(!this.plugin.settings.autoSyncEnabled)

		const { latestSyncTime } = this.plugin.settings.stats.sync
		const syncTime = latestSyncTime === undefined ? 'Never' : moment.unix(latestSyncTime).fromNow()

		new Setting(this.containerEl)
			.addButton((button) => {
				button.setButtonText('Sync now')
				button.onClick(() => {
					this.plugin.syncFlashcardsToAnki.trigger()
				})
			})
			.setDesc(sanitizeHTMLToDom(`Last synced: <em>${capitalize(syncTime)}</em>`))

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

		// ----------------------------------------------------

		// Development (temporary)
		new Setting(this.containerEl)
			.setName('Development')
			.setDesc('Options to facilitate development and debugging.')
			.setHeading()

		new Setting(this.containerEl).setName('Verbose notices').addToggle((toggle) => {
			toggle.setValue(this.plugin.settings.verboseLogging)
			toggle.onChange(async (value) => {
				this.plugin.settings.verboseLogging = value
				await this.plugin.saveSettings()
			})
		})

		const { auto, duration, errors, invalid, manual } = this.plugin.settings.stats.sync
		const { created, deleted, recreated, unchanged, updated } =
			this.plugin.settings.stats.sync.notes

		new Setting(this.containerEl).setName('Sync stats').setClass('stats').descEl.innerHTML =
			`<div><p>Overall</p>
		<ul>
			<li>Total syncs: ${auto + manual}</li>
			<ul>
				<li>Auto: ${auto}</li>
				<li>Manual: ${manual}</li>
				<li>Errors: ${errors}</li>
				<li>Invalid: ${invalid}</li>
				<li>Duration: ${prettyMilliseconds(duration)} (average)</li>
			</ul>
		</ul>
		</div>
		<div>
		<p>Note actions</p>
		<ul>
			<li>Created: ${created}</li>
			<li>Deleted: ${deleted}</li>
			<li>Recreated: ${recreated}</li>
			<li>Unchanged: ${unchanged}</li>
			<li>Updated: ${updated}</li>
			</ul>
		</div>`

		new Setting(this.containerEl).addButton((button) => {
			button.setButtonText('Reset stats')
			button.onClick(async () => {
				this.plugin.settings.stats.sync = JSON.parse(
					JSON.stringify(yankiPluginDefaultSettings.stats.sync),
				) as YankiPluginSettings['stats']['sync']
				await this.plugin.saveSettings()
				this.render()
			})
		})
	}
}
