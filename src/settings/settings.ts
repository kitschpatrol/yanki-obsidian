import { FolderSuggest } from '../extensions/folder-suggest'
import type YankiPlugin from '../main'
import { capitalize, html } from '../utilities'
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

export const yankiDebounceInterval = 4000

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
				ankiUnreachable: number
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
				ankiUnreachable: 0,
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
		filenameMode: 'prompt',
		manageFilenames: false,
		maxFilenameLength: 60,
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
		this.initialSettings = structuredClone(this.plugin.settings)
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
		// Save scroll position, so the settings don't jump around on re-renders
		const scrollPosition = this.containerEl.scrollTop

		this.containerEl.empty()

		// Cancel any pending syncs
		this.plugin.syncFlashcardNotesToAnki.clear()

		// Fake input to catch the automatic first-input focus that was popping the search input.
		// Focus is still just a tab away.
		const focusCatcher = this.containerEl.createEl('input', { type: 'text' })
		focusCatcher.setAttribute('style', 'display: none;')

		// ----------------------------------------------------

		// Folders

		new Setting(this.containerEl)
			.setName('Anki flashcard folders')
			.setHeading()
			.setDesc(
				sanitizeHTMLToDom(
					html`Yanki will sync notes in the folders specified to Anki. Folder syncing is always
						recursive, and Anki decks will be created to match the hierarchy of your Obsidian
						folders. See the
						<a
							href="https://github.com/kitschpatrol/yanki-obsidian?tab=readme-ov-file#markdown-note-types"
							>Yanki documentation</a
						>
						for details on how to structure your flashcard notes.`,
				),
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
					.setTooltip('Add folder')
					.setButtonText('Add folder')
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
					html`Flashcard notes found: <em>${String(this.plugin.getWatchedFiles().length)}</em>`,
				),
			)
			.setClass('description-is-button-annotation')

		new Setting(this.containerEl)
			.setName('Ignore folder notes')
			.setDesc(
				sanitizeHTMLToDom(
					html`Exclude notes with the same name as their parent folder from syncing. Useful in
						combination with the
						<a href="https://lostpaul.github.io/obsidian-folder-notes/">Folder notes</a> plugin.`,
				),
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

		new Setting(this.containerEl)
			.setName('Sync settings')
			.setHeading()
			.setDesc(
				sanitizeHTMLToDom(
					html`To manually sync notes to Anki, perform the
						<strong>Sync flashcard notes to Anki</strong> command, or select the
						<strong>Sync now</strong> button below.`,
				),
			)

		new Setting(this.containerEl)
			.setName('Automatic sync')
			.setDesc(
				'Sync to the local Anki database whenever flashcard notes are changed and the Anki desktop application is open.',
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
					void this.plugin.syncFlashcardNotesToAnki(true)
					this.plugin.syncFlashcardNotesToAnki.flush()
				})
			})
			.setDesc(sanitizeHTMLToDom(html`Last synced: <em>${capitalize(syncTime)}</em>`))
			.setClass('description-is-button-annotation')

		// ----------------------------------------------------

		// Anki-Connect

		const ankiConnectSetting = new Setting(this.containerEl)
			.setName('Anki-Connect settings')
			.setHeading()

		ankiConnectSetting.setDesc(
			sanitizeHTMLToDom(
				html`Anki-Connect is the Anki add-on that enables communication between Obsidian and Anki.
					See the
					<a href="https://github.com/kitschpatrol/yanki-obsidian?tab=readme-ov-file#quick-start"
						>Yanki quick start guide</a
					>
					for instructions on how to set up Anki-Connect, and the
					<a href="https://foosoft.net/projects/anki-connect/">Anki-Connect documentation</a> for
					more information. The default settings below are usually fine.`,
			),
		)

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
		// 		'Experimental Mac-only feature to automatically launch the Anki desktop application when syncing.',
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

				new Notice(
					sanitizeHTMLToDom(
						html`<strong>Yanki:</strong><br />Reset Yanki's Anki-Connect settings to defaults.`,
					),
				)
			})
		})

		// ----------------------------------------------------

		// Note filename management

		new Setting(this.containerEl)
			.setName('Automatic note name settings')
			.setHeading()
			.setDesc(
				sanitizeHTMLToDom(
					html`Yanki can automatically set the file name of flashcard notes to a snippet of text
					derived from the note's contents. If enabled, note file names are updated whenever notes
					are synced to Anki.`,
				),
			)

		new Setting(this.containerEl)
			.setName('Automatic note names')
			.addToggle((toggle) => {
				toggle.setValue(this.plugin.settings.syncOptions.manageFilenames)
				toggle.onChange(async (value) => {
					this.plugin.settings.syncOptions.manageFilenames = value
					await this.plugin.saveSettings()
					this.render()
				})
			})
			.setDisabled(!this.plugin.settings.autoSyncEnabled)

		new Setting(this.containerEl)
			.setName('Name mode')
			.setDesc(
				sanitizeHTMLToDom(
					html`Derive the automatic note file name from either the <em>prompt</em> or
						<em>response</em> portion of the note.`,
				),
			)
			.addDropdown((dropdown) => {
				dropdown
					.addOptions({
						prompt: 'Prompt',
						response: 'Response',
					})
					.setValue(this.plugin.settings.syncOptions.filenameMode)
					.onChange(async (value) => {
						this.plugin.settings.syncOptions.filenameMode =
							value as YankiPluginSettings['syncOptions']['filenameMode']
						await this.plugin.saveSettings()
					})
			})

		new Setting(this.containerEl).setName('Maximum note name length').addText((text) => {
			text.setPlaceholder(String(yankiPluginDefaultSettings.syncOptions.maxFilenameLength))
			text.setValue(String(this.plugin.settings.syncOptions.maxFilenameLength))
			text.onChange(async (value) => {
				this.plugin.settings.syncOptions.maxFilenameLength = Number(value)
				await this.plugin.saveSettings()
			})
		})

		new Setting(this.containerEl)
			.addButton((button) => {
				button.setButtonText('Rename now')
				button.onClick(async () => {
					await this.plugin.updateNoteFilenames(true)
				})
			})
			.setDisabled(!this.plugin.settings.syncOptions.manageFilenames)

		// ----------------------------------------------------

		// Development (temporary)
		new Setting(this.containerEl)
			.setName('Development')
			.setHeading()
			.setDesc(
				sanitizeHTMLToDom(
					html`Options to facilitate development and debugging of Yanki.<br />Trouble with the
						plugin? Please
						<a href="https://github.com/kitschpatrol/yanki-obsidian/issues">open an issue</a>.`,
				),
			)

		new Setting(this.containerEl).setName('Verbose notices').addToggle((toggle) => {
			toggle.setValue(this.plugin.settings.verboseLogging)
			toggle.onChange(async (value) => {
				this.plugin.settings.verboseLogging = value
				await this.plugin.saveSettings()
			})
		})

		const { auto, duration, errors, invalid, manual } = this.plugin.settings.stats.sync
		const { ankiUnreachable, created, deleted, recreated, unchanged, updated } =
			this.plugin.settings.stats.sync.notes

		new Setting(this.containerEl)
			.setName('Sync stats')
			.setClass('stats')
			.setDesc(
				sanitizeHTMLToDom(
					html`<div>
							<p>Overall</p>
							<ul>
								<li>Total syncs: ${String(auto + manual)}</li>
								<ul>
									<li>Auto: ${String(auto)}</li>
									<li>Manual: ${String(manual)}</li>
									<li>Errors: ${String(errors)}</li>
									<li>Invalid: ${String(invalid)}</li>
									<li>Duration: ${prettyMilliseconds(duration)} (average)</li>
								</ul>
							</ul>
						</div>
						<div>
							<p>Note actions</p>
							<ul>
								<li>Created: ${String(created)}</li>
								<li>Deleted: ${String(deleted)}</li>
								<li>Recreated: ${String(recreated)}</li>
								<li>Unchanged: ${String(unchanged)}</li>
								<li>Updated: ${String(updated)}</li>
								<li>Anki Unreachable: ${String(ankiUnreachable)}</li>
							</ul>
						</div>`,
				),
			)

		new Setting(this.containerEl).addButton((button) => {
			button.setButtonText('Reset sync stats')
			button.onClick(async () => {
				this.plugin.settings.stats.sync = structuredClone(yankiPluginDefaultSettings.stats.sync)
				await this.plugin.saveSettings()
				this.render()

				new Notice(sanitizeHTMLToDom(html`<strong>Yanki:</strong><br />Reset Yanki's sync stats.`))
			})
		})

		// Restore scroll position
		this.containerEl.scrollTop = scrollPosition
	}
}
