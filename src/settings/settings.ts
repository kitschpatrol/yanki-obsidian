import {
	type App,
	type ButtonComponent,
	moment,
	Notice,
	PluginSettingTab,
	sanitizeHTMLToDom,
	Setting,
} from 'obsidian'
import prettyMilliseconds from 'pretty-ms'
import { hostAndPortToUrl, urlToHostAndPort } from 'yanki'
import type YankiPlugin from '../main'
import { FolderSuggest } from '../extensions/folder-suggest'
import { capitalize, html, sanitizeNamespace, validateNamespace } from '../utilities'

export type YankiPluginSettings = {
	ankiConnect: {
		host: string
		key: string | undefined
		port: number
	}
	folders: string[]
	ignoreFolderNotes: boolean
	manageFilenames: {
		enabled: boolean
		maxLength: number
		mode: 'prompt' | 'response'
	}
	namespace: string
	showAdvancedSettings: boolean
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
				matched: number
				unchanged: number
				updated: number
			}
		}
	}
	sync: {
		autoSyncDebounceIntervalMs: number // Not exposed in settings
		autoSyncEnabled: boolean
		mediaMode: 'all' | 'local' | 'off' | 'remote'
		pushToAnkiWeb: boolean
	}
	verboseNotices: boolean
}

// TODO bind instead?
export function getYankiPluginDefaultSettings(app: App): YankiPluginSettings {
	return {
		ankiConnect: {
			host: 'http://localhost',
			key: undefined,
			port: 8765,
		},
		folders: [],
		ignoreFolderNotes: true,
		manageFilenames: {
			enabled: false,
			maxLength: 60,
			mode: 'prompt',
		},
		// Defaults to vault ID the first time Yanki is run on a vault, but it may NOT be the actual current vault ID, e.g. when syncing is involved
		// Using vault ID instead of name is more robust to vault renaming
		// But why is the vault ID API private?
		// https://forum.obsidian.md/t/is-there-any-way-to-derive-the-vault-id-from-the-vault-directory/5573/4
		// Warning: changing the static components of this string can result in data loss...
		namespace: `Yanki Obsidian - Vault ID ${sanitizeNamespace(app.appId)}`,
		showAdvancedSettings: false,
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
					matched: 0,
					unchanged: 0,
					updated: 0,
				},
			},
		},
		sync: {
			autoSyncDebounceIntervalMs: 4000,
			autoSyncEnabled: false,
			mediaMode: 'local',
			pushToAnkiWeb: true,
		},
		verboseNotices: false,
	}
}

export class YankiPluginSettingTab extends PluginSettingTab {
	private initialSettings: YankiPluginSettings = getYankiPluginDefaultSettings(this.app)
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
						for details on how to structure the content of your flashcard notes.`,
				),
			)

		if (this.plugin.settings.folders.length === 0) {
			this.plugin.settings.folders.push('')
		}

		for (const [index, folder] of this.plugin.settings.folders.entries()) {
			const searchSetting = new Setting(this.containerEl)
				.addSearch((callback) => {
					new FolderSuggest(callback.inputEl, this.app)
					callback
						.setPlaceholder('Select a folder')
						.setValue(folder)
						.onChange((value) => {
							this.plugin.settings.folders[index] = value
						})

					callback.inputEl.addEventListener('blur', async () => {
						await this.plugin.saveSettings()
						this.render()
					})
				})
				.setClass('folder-setting')

			searchSetting.infoEl.remove()

			if (index > 0) {
				searchSetting.addExtraButton((callback) => {
					callback
						.setIcon('cross')
						.setTooltip('Delete')
						.onClick(async () => {
							this.plugin.settings.folders.splice(index, 1)
							await this.plugin.saveSettings()
							this.render()
						})
				})
			}
		}

		new Setting(this.containerEl)
			.addButton((button: ButtonComponent) => {
				button
					.setTooltip('Add folder')
					.setButtonText('Add folder')
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
			.setName('Sync')
			.setHeading()
			.setDesc(
				sanitizeHTMLToDom(
					html`To manually sync notes to Anki, perform the
						<strong>Sync flashcard notes to Anki</strong> command, or select the
						<strong>Sync now</strong> button below.`,
				),
			)

		new Setting(this.containerEl)
			.setName('Push to AnkiWeb')
			.setDesc(
				'Also sync changes to the AnkiWeb "cloud" in addition to the local Anki database. This is like pressing the "Sync" button in the Anki desktop app.',
			)
			.addToggle((toggle) => {
				toggle.setValue(this.plugin.settings.sync.pushToAnkiWeb)
				toggle.onChange(async (value) => {
					this.plugin.settings.sync.pushToAnkiWeb = value
					await this.plugin.saveSettings()
					this.render()
				})
			})

		new Setting(this.containerEl)
			.setName('Sync media assets')
			.setDesc(
				sanitizeHTMLToDom(
					html`Also sync image, audio, and video assets in your Obsidian notes to Anki's media asset
						library.
						<em
							>Note that syncing remote media may slow down syncing since assets must be
							downloaded.</em
						>`,
				),
			)
			.addDropdown((dropdown) => {
				dropdown
					.addOptions({
						all: 'All',
						local: 'Local only',
						remote: 'Remote only',
						// eslint-disable-next-line perfectionist/sort-objects
						none: 'None',
					})
					.setValue(this.plugin.settings.sync.mediaMode)
					.onChange(async (value) => {
						this.plugin.settings.sync.mediaMode = value as YankiPluginSettings['sync']['mediaMode']
						await this.plugin.saveSettings()
					})
			})

		const { latestSyncTime } = this.plugin.settings.stats.sync
		const syncTime = latestSyncTime === undefined ? 'Never' : moment.unix(latestSyncTime).fromNow()

		new Setting(this.containerEl)
			.addButton((button) => {
				button.setCta()
				button.setButtonText('Sync now')
				button.onClick(() => {
					void this.plugin.syncFlashcardNotesToAnki(true)
					this.plugin.syncFlashcardNotesToAnki.flush()
				})
			})

			.setDesc(sanitizeHTMLToDom(html`Last synced: <em>${capitalize(syncTime)}</em>`))
			.setClass('description-is-button-annotation')

		// ----------------------------------------------------

		// Note filename management

		new Setting(this.containerEl)
			.setName('Automatic note names')
			.setHeading()
			.setDesc(
				sanitizeHTMLToDom(
					html`Yanki can automatically set the file name of flashcard notes to a snippet of text
					derived from the note's contents. If enabled, note file names are updated whenever notes
					are synced to Anki.`,
				),
			)

		new Setting(this.containerEl).setName('Automatic renaming').addToggle((toggle) => {
			toggle.setValue(this.plugin.settings.manageFilenames.enabled)
			toggle.onChange(async (value) => {
				this.plugin.settings.manageFilenames.enabled = value
				await this.plugin.saveSettings()
				this.render()
			})
		})

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
					.setValue(this.plugin.settings.manageFilenames.mode)
					.onChange(async (value) => {
						this.plugin.settings.manageFilenames.mode =
							value as YankiPluginSettings['manageFilenames']['mode']
						await this.plugin.saveSettings()
					})
			})

		new Setting(this.containerEl).setName('Maximum note name length').addText((text) => {
			text.setPlaceholder(String(getYankiPluginDefaultSettings(this.app).manageFilenames.maxLength))
			text.setValue(String(this.plugin.settings.manageFilenames.maxLength))
			text.onChange((value) => {
				this.plugin.settings.manageFilenames.maxLength = Number(value)
			})

			text.inputEl.addEventListener('blur', async () => {
				await this.plugin.saveSettings()
			})
		})

		new Setting(this.containerEl).addButton((button) => {
			button.setButtonText('Rename now')
			button.onClick(async () => {
				await this.plugin.updateNoteFilenames(true)
			})
		})

		// ----------------------------------------------------

		// Anki-Connect

		const ankiConnectSetting = new Setting(this.containerEl).setName('Anki-Connect').setHeading()

		ankiConnectSetting.setDesc(
			sanitizeHTMLToDom(
				html`Anki-Connect is the Anki add-on that enables communication between Obsidian and Anki.
					See the
					<a href="https://github.com/kitschpatrol/yanki-obsidian?tab=readme-ov-file#quick-start"
						>Yanki quick start guide</a
					>
					for instructions on how to set up Anki-Connect, and the
					<a href="https://git.sr.ht/~foosoft/anki-connect">Anki-Connect documentation</a> for more
					information. The default settings below are usually fine.`,
			),
		)

		new Setting(this.containerEl)
			.setName('Host')
			.setDesc('Set the host and port to match your Anki-Connect configuration.')
			.addText((text) => {
				text.setPlaceholder('Host Name and Port')
				const { host, port } = this.plugin.settings.ankiConnect
				text.setValue(hostAndPortToUrl(host, port))

				text.onChange((value) => {
					const parsedUrl = urlToHostAndPort(value)

					if (parsedUrl === undefined) {
						new Notice(
							sanitizeHTMLToDom(
								html`<strong>Yanki:</strong><br />Invalid Anki-Connect host and port.`,
							),
						)
					} else {
						const { host, port } = parsedUrl
						this.plugin.settings.ankiConnect.host = host
						this.plugin.settings.ankiConnect.port = port
					}
				})

				text.inputEl.addEventListener('blur', async () => {
					await this.plugin.saveSettings()
				})
			})

		new Setting(this.containerEl)
			.setName('Key')
			.setDesc('Optional API security key to match your custom Anki-Connect configuration.')
			.addText((text) => {
				text.setPlaceholder('API Key')

				text.setValue(this.plugin.settings.ankiConnect.key ?? '')
				text.onChange((value) => {
					this.plugin.settings.ankiConnect.key = value.trim().length > 0 ? value.trim() : undefined
				})

				text.inputEl.addEventListener('blur', async () => {
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
		// 		const { autoLaunch } = this.plugin.settings.ankiConnect

		// 		toggle.setValue(autoLaunch).onChange(async (enabled) => {
		// 			this.plugin.settings.syncOptions.ankiConnect.autoLaunch = enabled
		// 			await this.plugin.saveSettings()
		// 		})
		// 	})

		new Setting(this.containerEl).addButton((button) => {
			button.setButtonText('Reset to Anki-Connect defaults')
			button.onClick(async () => {
				this.plugin.settings.ankiConnect = structuredClone(
					getYankiPluginDefaultSettings(this.app).ankiConnect,
				)

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

		new Setting(this.containerEl)
			.setName('Advanced')
			.setHeading()
			.setDesc(
				sanitizeHTMLToDom(
					html`Show advanced settings below to accommodate certain edge cases and to facilitate
						development and debugging of early releases of Yanki.<br />Trouble with the plugin?
						Please
						<a href="https://github.com/kitschpatrol/yanki-obsidian/issues">open an issue</a>.`,
				),
			)
			.addToggle((toggle) => {
				toggle.setValue(this.plugin.settings.showAdvancedSettings)
				toggle.onChange(async (value) => {
					this.plugin.settings.showAdvancedSettings = value
					await this.plugin.saveSettings()
					this.render()
				})
			})

		if (this.plugin.settings.showAdvancedSettings) {
			new Setting(this.containerEl).setName('Verbose notices').addToggle((toggle) => {
				toggle.setValue(this.plugin.settings.verboseNotices)
				toggle.onChange(async (value) => {
					this.plugin.settings.verboseNotices = value
					await this.plugin.saveSettings()
				})
			})

			const { auto, duration, errors, invalid, manual } = this.plugin.settings.stats.sync
			const { ankiUnreachable, created, deleted, matched, unchanged, updated } =
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
									<li>Matched: ${String(matched)}</li>
									<li>Unchanged: ${String(unchanged)}</li>
									<li>Updated: ${String(updated)}</li>
									<li>Anki Unreachable: ${String(ankiUnreachable)}</li>
								</ul>
							</div>`,
					),
				)

			new Setting(this.containerEl).setClass('stats-reset').addButton((button) => {
				button.setButtonText('Reset sync stats')
				button.onClick(async () => {
					this.plugin.settings.stats.sync = structuredClone(
						getYankiPluginDefaultSettings(this.app).stats.sync,
					)
					await this.plugin.saveSettings()
					this.render()

					new Notice(
						sanitizeHTMLToDom(html`<strong>Yanki:</strong><br />Reset Yanki's sync stats.`),
					)
				})
			})

			new Setting(this.containerEl)
				.setName('Automatic sync')
				.setDesc(
					sanitizeHTMLToDom(html`
						<strong>Deprecated. Will be removed from future versions.</strong><br />Sync to the
						local Anki database whenever flashcard notes are changed and the Anki desktop
						application is open.
					`),
				)
				.addToggle((toggle) => {
					toggle.setValue(this.plugin.settings.sync.autoSyncEnabled)
					toggle.onChange(async (value) => {
						this.plugin.settings.sync.autoSyncEnabled = value
						await this.plugin.saveSettings()
						this.render()
					})
				})

			new Setting(this.containerEl)
				.setName('Namespace')
				.setDesc(
					sanitizeHTMLToDom(
						html`<strong>Do not change this value unless you know what you're doing.</strong
							><br />Customize the "namespace" used to correlate flashcard notes in this Obsidian
							vault with notes in Yanki. This can be useful in rare cases like vault migration or
							vault synchronization. Backup both Obsidian and Anki first. See the
							<a href="https://github.com/kitschpatrol/yanki-obsidian?tab=readme-ov-file#namespace"
								>Yanki documentation</a
							>
							for more details on how namespaces work.`,
					),
				)
				.addText((text) => {
					text.setPlaceholder('Namespace')
					text.setValue(this.plugin.settings.namespace)

					text.onChange((value) => {
						if (validateNamespace(value)) {
							this.plugin.settings.namespace = value
						} else {
							new Notice(sanitizeHTMLToDom(html`<strong>Yanki:</strong><br />Invalid namespace.`))
						}
					})

					text.inputEl.addEventListener('blur', async () => {
						await this.plugin.saveSettings()
					})
				})

			new Setting(this.containerEl).setClass('namespace-reset').addButton((button) => {
				button.setWarning()
				button.setButtonText('Reset namespace to vault ID')
				button.onClick(async () => {
					this.plugin.settings.namespace = getYankiPluginDefaultSettings(this.app).namespace
					await this.plugin.saveSettings()
					this.render()

					new Notice(
						sanitizeHTMLToDom(
							html`<strong>Yanki:</strong><br />Reset Yanki's namespace to default.`,
						),
					)
				})
			})

			new Setting(this.containerEl).addButton((button) => {
				button.setButtonText('Reset all settings')
				button.onClick(async () => {
					// TODO warn!

					this.plugin.settings = structuredClone(getYankiPluginDefaultSettings(this.app))
					await this.plugin.saveSettings()
					this.render()

					new Notice(sanitizeHTMLToDom(html`<strong>Yanki:</strong><br />Reset Yanki's settings.`))
				})
			})
		}

		// Restore scroll position
		this.containerEl.scrollTop = scrollPosition
	}
}
