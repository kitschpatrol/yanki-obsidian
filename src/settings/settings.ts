import type { App, ButtonComponent, SettingDefinitionRender } from 'obsidian'
import {
	moment,
	Notice,
	PluginSettingTab,
	requireApiVersion,
	sanitizeHTMLToDom,
	Setting,
} from 'obsidian'
import prettyMilliseconds from 'pretty-ms'
import { hostAndPortToUrl, urlToHostAndPort } from 'yanki'
import type YankiPlugin from '../main'
import { FolderSuggest } from '../extensions/folder-suggest'
import { capitalize, html, sanitizeNamespace, validateNamespace } from '../utilities'

/**
 * Debug flag: set to `true` to force the pre-1.13 imperative settings
 * rendering, even on Obsidian 1.13+.
 */
const FORCE_LEGACY_SETTINGS = false

type YankiSettingDefinition = Omit<SettingDefinitionRender, 'render'> & {
	render: (setting: Setting) => void
}

type YankiSettingGroup = {
	heading: string
	items: YankiSettingDefinition[]
	type: 'group'
}

export type YankiPluginSettings = {
	ankiConnect: {
		host: string
		key: string | undefined
		port: number
	}
	folders: string[]
	ignoreFolderNotes: boolean
	manageFilenames: {
		autoRenameDebounceIntervalMs: number // Not exposed in settings
		autoRenameTrigger: 'before-sync' | 'file-changed' | 'off'
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

/**
 * Default plugin settings TODO bind instead?
 */
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
			// Obsidian already debounces this!
			autoRenameDebounceIntervalMs: 300,
			autoRenameTrigger: 'off',
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
	override plugin: YankiPlugin
	private folderAddSetting: Setting | undefined
	private initialSettings: YankiPluginSettings = getYankiPluginDefaultSettings(this.app)
	private isSettingsOpen = false

	constructor(app: App, plugin: YankiPlugin) {
		super(app, plugin)
		this.plugin = plugin
	}

	override display(): void {
		this.startSettingsSession()
		this.renderLegacySettings()
	}

	override getSettingDefinitions(): YankiSettingGroup[] {
		// eslint-disable-next-line ts/no-unnecessary-condition -- `FORCE_LEGACY_SETTINGS` is a hard-coded debug flag.
		if (FORCE_LEGACY_SETTINGS) {
			// With no definitions, Obsidian 1.13+ falls back to the `display()` code path.
			return []
		}

		return this.getSettingGroups()
	}

	override hide(): void {
		this.isSettingsOpen = false

		// Normalize folders.
		this.plugin.settings.folders = this.plugin.getSanitizedFolders()
		void this.plugin.settingsChangeSyncCheck(this.initialSettings)

		// Obsidian 1.13+ renders reopened tabs from cached setting definitions, so
		// rebuild them to match the folders normalized above. Deferred because
		// `hide()` runs while the tab is still active, and `update()` re-renders
		// the active tab mid-teardown.
		// eslint-disable-next-line unicorn/prefer-global-this -- `obsidianmd/prefer-window-timers` wants `window` timers for popout window compatibility.
		window.setTimeout(() => {
			if (requireApiVersion('1.13.0')) {
				this.update()
			}
		}, 0)
	}

	public render(): void {
		if (requireApiVersion('1.13.0')) {
			// eslint-disable-next-line unicorn/no-lonely-if, ts/no-unnecessary-condition -- `FORCE_LEGACY_SETTINGS` is a hard-coded debug flag, and the `if` nesting keeps the `requireApiVersion` guard visible to `obsidianmd/no-unsupported-api`.
			if (!FORCE_LEGACY_SETTINGS) {
				this.update()
				return
			}
		}

		this.renderLegacySettings()
	}

	private getSettingGroups(): YankiSettingGroup[] {
		const advancedVisible = () => this.plugin.settings.showAdvancedSettings
		const folders = this.plugin.settings.folders.length === 0 ? [''] : this.plugin.settings.folders
		const { latestSyncTime } = this.plugin.settings.stats.sync
		const syncTime = latestSyncTime === undefined ? 'Never' : moment.unix(latestSyncTime).fromNow()
		const { auto, duration, errors, invalid, manual } = this.plugin.settings.stats.sync
		const { ankiUnreachable, created, deleted, matched, unchanged, updated } =
			this.plugin.settings.stats.sync.notes

		const folderItems: YankiSettingDefinition[] = [
			{
				desc: sanitizeHTMLToDom(
					html`Yanki will sync notes in the folders specified to Anki. Folder syncing is always
						recursive, and Anki decks will be created to match the hierarchy of your Obsidian
						folders. See the
						<a
							href="https://github.com/kitschpatrol/yanki-obsidian?tab=readme-ov-file#markdown-note-types"
							>Yanki documentation</a
						>
						for details on how to structure the content of your flashcard notes.`,
				),
				name: '',
				render: (setting) => {
					if (requireApiVersion('1.13.0')) {
						this.startSettingsSession()
					}

					this.prepareSettingsDisplay()
					setting.setClass('section-description')
				},
				searchable: false,
			},
		]

		for (const index of folders.keys()) {
			folderItems.push({
				name: `Anki flashcard folder ${String(index + 1)}`,
				render: (setting) => {
					if (this.plugin.settings.folders.length === 0) {
						this.plugin.settings.folders.push('')
					}

					setting
						.addSearch((search) => {
							new FolderSuggest(search.inputEl, this.app)
							search
								.setPlaceholder('Select a folder')
								// Obsidian 1.13+ re-renders from cached definitions, so the value
								// must come from live settings rather than the closure.
								.setValue(this.plugin.settings.folders[index] ?? '')
								.onChange((value) => {
									this.plugin.settings.folders[index] = value
									// Selecting a suggestion keeps focus in the input, so the count
									// can't wait for the blur listener below.
									this.updateNotesFoundCount()
								})

							search.inputEl.addEventListener('blur', () => {
								void this.plugin.saveSettings()
							})
						})
						.setClass('folder-setting')

					setting.infoEl.remove()

					if (index > 0) {
						setting.addExtraButton((button) => {
							button
								.setIcon('cross')
								.setTooltip('Delete')
								.onClick(async () => {
									this.plugin.settings.folders.splice(index, 1)
									await this.plugin.saveSettings()
									this.render()
								})
						})
					}
				},
			})
		}

		folderItems.push(
			{
				desc: 'Add another folder to sync with Anki.',
				name: 'Add folder',
				render: (setting) => {
					this.folderAddSetting = setting
					setting
						.setName('')
						.addButton((button: ButtonComponent) => {
							button
								.setTooltip('Add folder')
								.setButtonText('Add folder')
								.onClick(async () => {
									this.plugin.settings.folders.push('')
									await this.plugin.saveSettings()
									this.render()
								})
						})
						.setClass('description-is-button-annotation')
					this.updateNotesFoundCount()
				},
			},
			{
				desc: sanitizeHTMLToDom(
					html`Exclude notes with the same name as their parent folder from syncing. Useful in
						combination with the
						<a href="https://lostpaul.github.io/obsidian-folder-notes/">Folder notes</a> plugin.`,
				),
				name: 'Ignore folder notes',
				render: (setting) => {
					setting.addToggle((toggle) => {
						toggle.setValue(this.plugin.settings.ignoreFolderNotes)
						toggle.onChange(async (value) => {
							this.plugin.settings.ignoreFolderNotes = value
							await this.plugin.saveSettings()
							this.render()
						})
					})
				},
			},
		)

		return [
			{
				heading: 'Anki flashcard folders',
				items: folderItems,
				type: 'group',
			},
			{
				heading: 'Sync',
				items: [
					{
						desc: sanitizeHTMLToDom(
							html`To manually sync notes to Anki, perform the
								<strong>Sync flashcard notes to Anki</strong> command, or select the
								<strong>Sync now</strong> button below.`,
						),
						name: '',
						render(setting) {
							setting.setClass('section-description')
						},
						searchable: false,
					},
					{
						desc: 'Also sync changes to the AnkiWeb “cloud” in addition to the local Anki database. This is like pressing the “Sync” button in the Anki desktop app.',
						name: 'Push to AnkiWeb',
						render: (setting) => {
							setting.addToggle((toggle) => {
								toggle.setValue(this.plugin.settings.sync.pushToAnkiWeb)
								toggle.onChange(async (value) => {
									this.plugin.settings.sync.pushToAnkiWeb = value
									await this.plugin.saveSettings()
									this.render()
								})
							})
						},
					},
					{
						desc: sanitizeHTMLToDom(
							html`Also sync image, audio, and video assets in your Obsidian notes to Anki’s media
								asset library.
								<em
									>Note that syncing remote media may slow down syncing since assets must be
									downloaded.</em
								>`,
						),
						name: 'Sync media assets',
						render: (setting) => {
							setting.addDropdown((dropdown) => {
								dropdown
									.addOptions({
										all: 'All',
										local: 'Local only',
										remote: 'Remote only',
										// eslint-disable-next-line perfectionist/sort-objects -- "None" is intentionally last in the dropdown order
										none: 'None',
									})
									.setValue(this.plugin.settings.sync.mediaMode)
									.onChange(async (value) => {
										this.plugin.settings.sync.mediaMode =
											value as YankiPluginSettings['sync']['mediaMode']
										await this.plugin.saveSettings()
									})
							})
						},
					},
					{
						desc: sanitizeHTMLToDom(html`Last synced: <em>${capitalize(syncTime)}</em>`),
						name: 'Sync now',
						render: (setting) => {
							setting
								.setName('')
								.addButton((button) => {
									button.setCta()
									button.setButtonText('Sync now')
									button.onClick(() => {
										void this.plugin.syncFlashcardNotesToAnki(true)
										this.plugin.syncFlashcardNotesToAnki.flush()
									})
								})
								.setClass('description-is-button-annotation')
						},
					},
				],
				type: 'group',
			},
			{
				heading: 'Automatic note names',
				items: [
					{
						desc: sanitizeHTMLToDom(
							html`Yanki can set the file name of flashcard notes to a snippet of text derived from
								the note’s contents. This feature is
								<strong>not compatible with Obsidian Sync</strong>.`,
						),
						name: '',
						render(setting) {
							setting.setClass('section-description')
						},
						searchable: false,
					},
					{
						desc: 'Choose when note file names should be automatically updated.',
						name: 'Automatic renaming',
						render: (setting) => {
							setting.addDropdown((dropdown) => {
								dropdown
									.addOptions({
										/* eslint-disable perfectionist/sort-objects -- options are ordered from least to most aggressive auto-rename behavior */
										off: 'Off',
										'before-sync': 'On Sync',
										'file-changed': 'On Change',
										/* eslint-enable perfectionist/sort-objects -- restore default sorting for surrounding object literals */
									})
									.setValue(this.plugin.settings.manageFilenames.autoRenameTrigger)
									.onChange(async (value) => {
										this.plugin.settings.manageFilenames.autoRenameTrigger =
											value as YankiPluginSettings['manageFilenames']['autoRenameTrigger']
										await this.plugin.saveSettings()
										this.render()
									})
							})
						},
					},
					{
						desc: sanitizeHTMLToDom(
							html`Derive the automatic note file name from either the <em>prompt</em> or
								<em>response</em> portion of the note.`,
						),
						name: 'Name mode',
						render: (setting) => {
							setting.addDropdown((dropdown) => {
								dropdown
									.addOptions({ prompt: 'Prompt', response: 'Response' })
									.setValue(this.plugin.settings.manageFilenames.mode)
									.onChange(async (value) => {
										this.plugin.settings.manageFilenames.mode =
											value as YankiPluginSettings['manageFilenames']['mode']
										await this.plugin.saveSettings()
									})
							})
						},
					},
					{
						name: 'Maximum note name length',
						render: (setting) => {
							setting.addText((text) => {
								text.setPlaceholder(
									String(getYankiPluginDefaultSettings(this.app).manageFilenames.maxLength),
								)
								text.setValue(String(this.plugin.settings.manageFilenames.maxLength))
								text.onChange((value) => {
									this.plugin.settings.manageFilenames.maxLength = Number(value)
								})
								text.inputEl.addEventListener('blur', () => {
									void this.plugin.saveSettings()
								})
							})
						},
					},
					{
						name: 'Rename now',
						render: (setting) => {
							setting.setName('').addButton((button) => {
								button.setButtonText('Rename now')
								button.onClick(() => {
									void this.plugin.updateNoteFilenames(true)
									this.plugin.updateNoteFilenames.flush()
								})
							})
						},
					},
				],
				type: 'group',
			},
			{
				heading: 'AnkiConnect',
				items: [
					{
						desc: sanitizeHTMLToDom(
							html`AnkiConnect is the Anki add-on that enables communication between Obsidian and
								Anki. See the
								<a
									href="https://github.com/kitschpatrol/yanki-obsidian?tab=readme-ov-file#quick-start"
									>Yanki quick start guide</a
								>
								for instructions on how to set up AnkiConnect, and the
								<a href="https://git.sr.ht/~foosoft/anki-connect">AnkiConnect documentation</a> for
								more information. The default settings below are usually fine.`,
						),
						name: '',
						render(setting) {
							setting.setClass('section-description')
						},
						searchable: false,
					},
					{
						desc: 'Set the host and port to match your AnkiConnect configuration.',
						name: 'Host',
						render: (setting) => {
							setting.addText((text) => {
								text.setPlaceholder('Host name and port')
								const { host, port } = this.plugin.settings.ankiConnect
								text.setValue(hostAndPortToUrl(host, port))
								text.onChange((value) => {
									const parsedUrl = urlToHostAndPort(value)

									if (parsedUrl === undefined) {
										new Notice(
											sanitizeHTMLToDom(
												html`<strong>Yanki:</strong><br />Invalid AnkiConnect host and port.`,
											),
										)
									} else {
										this.plugin.settings.ankiConnect.host = parsedUrl.host
										this.plugin.settings.ankiConnect.port = parsedUrl.port
									}
								})
								text.inputEl.addEventListener('blur', () => {
									void this.plugin.saveSettings()
								})
							})
						},
					},
					{
						desc: 'Optional API security key to match your custom AnkiConnect configuration.',
						name: 'Key',
						render: (setting) => {
							setting.addText((text) => {
								text.setPlaceholder('API key')
								text.setValue(this.plugin.settings.ankiConnect.key ?? '')
								text.onChange((value) => {
									this.plugin.settings.ankiConnect.key =
										value.trim().length > 0 ? value.trim() : undefined
								})
								text.inputEl.addEventListener('blur', () => {
									void this.plugin.saveSettings()
								})
							})
						},
					},
					{
						name: 'Reset to AnkiConnect defaults',
						render: (setting) => {
							setting.setName('').addButton((button) => {
								button.setButtonText('Reset to AnkiConnect defaults')
								button.onClick(async () => {
									this.plugin.settings.ankiConnect = structuredClone(
										getYankiPluginDefaultSettings(this.app).ankiConnect,
									)
									await this.plugin.saveSettings()
									this.render()
									new Notice(
										sanitizeHTMLToDom(
											html`<strong>Yanki:</strong><br />Reset Yanki’s AnkiConnect settings to
												defaults.`,
										),
									)
								})
							})
						},
					},
				],
				type: 'group',
			},
			{
				heading: 'Advanced',
				items: [
					{
						desc: sanitizeHTMLToDom(
							html`Show advanced settings below to accommodate certain edge cases and to facilitate
								development and debugging of early releases of Yanki.<br />Trouble with the plugin?
								Please
								<a href="https://github.com/kitschpatrol/yanki-obsidian/issues">open an issue</a>.`,
						),
						name: 'Show advanced settings',
						render: (setting) => {
							setting.addToggle((toggle) => {
								toggle.setValue(this.plugin.settings.showAdvancedSettings)
								toggle.onChange(async (value) => {
									this.plugin.settings.showAdvancedSettings = value
									await this.plugin.saveSettings()
									this.render()
								})
							})
						},
					},
					{
						name: 'Verbose notices',
						render: (setting) => {
							setting.addToggle((toggle) => {
								toggle.setValue(this.plugin.settings.verboseNotices)
								toggle.onChange(async (value) => {
									this.plugin.settings.verboseNotices = value
									await this.plugin.saveSettings()
								})
							})
						},
						visible: advancedVisible,
					},
					{
						desc: sanitizeHTMLToDom(
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
						name: 'Sync stats',
						render(setting) {
							setting.setClass('stats')
						},
						visible: advancedVisible,
					},
					{
						name: 'Reset sync stats',
						render: (setting) => {
							setting
								.setName('')
								.setClass('stats-reset')
								.addButton((button) => {
									button.setButtonText('Reset sync stats')
									button.onClick(async () => {
										this.plugin.settings.stats.sync = structuredClone(
											getYankiPluginDefaultSettings(this.app).stats.sync,
										)
										await this.plugin.saveSettings()
										this.render()
										new Notice(
											sanitizeHTMLToDom(
												html`<strong>Yanki:</strong><br />Reset Yanki’s sync stats.`,
											),
										)
									})
								})
						},
						visible: advancedVisible,
					},
					{
						desc: sanitizeHTMLToDom(html`
							<strong>This can be dangerous. Enable with care.</strong><br />Sync to the local Anki
							database whenever flashcard notes are changed and the Anki desktop application is
							open.
							<em
								>If you temporarily delete or remove a note from Anki’s flashcard folders, it will
								be deleted immediately from Anki along with its learning progress metadata.</em
							>
						`),
						name: 'Automatic sync',
						render: (setting) => {
							setting.addToggle((toggle) => {
								toggle.setValue(this.plugin.settings.sync.autoSyncEnabled)
								toggle.onChange(async (value) => {
									this.plugin.settings.sync.autoSyncEnabled = value
									await this.plugin.saveSettings()
									this.render()
								})
							})
						},
						visible: advancedVisible,
					},
					{
						desc: sanitizeHTMLToDom(
							html`<strong>Do not change this value unless you know what you’re doing.</strong
								><br />Customize the “namespace” used to correlate flashcard notes in this Obsidian
								vault with notes in Yanki. This can be useful in rare cases like vault migration or
								vault synchronization. Backup both Obsidian and Anki first. See the
								<a
									href="https://github.com/kitschpatrol/yanki-obsidian?tab=readme-ov-file#namespace"
									>Yanki documentation</a
								>
								for more details on how namespaces work.`,
						),
						name: 'Namespace',
						render: (setting) => {
							setting.addText((text) => {
								text.setPlaceholder('Namespace')
								text.setValue(this.plugin.settings.namespace)
								text.onChange((value) => {
									if (validateNamespace(value)) {
										this.plugin.settings.namespace = value
									} else {
										new Notice(
											sanitizeHTMLToDom(html`<strong>Yanki:</strong><br />Invalid namespace.`),
										)
									}
								})
								text.inputEl.addEventListener('blur', () => {
									void this.plugin.saveSettings()
								})
							})
						},
						visible: advancedVisible,
					},
					{
						name: 'Reset namespace to vault ID',
						render: (setting) => {
							setting
								.setName('')
								.setClass('namespace-reset')
								.addButton((button) => {
									if (requireApiVersion('1.13.0')) {
										button.setDestructive()
									} else {
										// eslint-disable-next-line ts/no-deprecated -- `setDestructive` does not exist before Obsidian 1.13.0.
										button.setWarning()
									}

									button.setButtonText('Reset namespace to vault ID')
									button.onClick(async () => {
										this.plugin.settings.namespace = getYankiPluginDefaultSettings(
											this.app,
										).namespace
										await this.plugin.saveSettings()
										this.render()
										new Notice(
											sanitizeHTMLToDom(
												html`<strong>Yanki:</strong><br />Reset Yanki’s namespace to default.`,
											),
										)
									})
								})
						},
						visible: advancedVisible,
					},
					{
						name: 'Reset all settings',
						render: (setting) => {
							setting.setName('').addButton((button) => {
								button.setButtonText('Reset all settings')
								button.onClick(async () => {
									// TODO warn!

									this.plugin.settings = structuredClone(getYankiPluginDefaultSettings(this.app))
									await this.plugin.saveSettings()
									this.render()
									new Notice(
										sanitizeHTMLToDom(html`<strong>Yanki:</strong><br />Reset Yanki’s settings.`),
									)
								})
							})
						},
						visible: advancedVisible,
					},
				],
				type: 'group',
			},
		]
	}

	private prepareSettingsDisplay(): void {
		this.containerEl.addClass('yanki-settings')
		this.containerEl.setAttr('id', 'yanki-settings')
		this.plugin.syncFlashcardNotesToAnki.clear()
		this.plugin.updateNoteFilenames.clear()
	}

	private renderLegacySetting(definition: YankiSettingDefinition): void {
		const { visible = true } = definition
		const isVisible = typeof visible === 'function' ? visible() : visible

		if (!isVisible) {
			return
		}

		const setting = new Setting(this.containerEl).setName(definition.name)

		if (definition.desc !== undefined) {
			setting.setDesc(definition.desc)
		}

		definition.render(setting)
	}

	private renderLegacySettings(): void {
		const scrollPosition = this.containerEl.scrollTop

		this.containerEl.empty()
		this.prepareSettingsDisplay()

		// Catch the automatic first-input focus without opening the first folder search.
		this.containerEl.createEl('input', { cls: 'focus-catcher', type: 'text' })

		for (const group of this.getSettingGroups()) {
			new Setting(this.containerEl).setName(group.heading).setHeading()

			for (const definition of group.items) {
				this.renderLegacySetting(definition)
			}
		}

		this.containerEl.scrollTop = scrollPosition
	}

	private startSettingsSession(): void {
		if (this.isSettingsOpen) {
			return
		}

		this.initialSettings = structuredClone(this.plugin.settings)
		this.isSettingsOpen = true
	}

	private updateNotesFoundCount(): void {
		this.folderAddSetting?.setDesc(
			sanitizeHTMLToDom(
				html`Notes found: <em>${String(this.plugin.getWatchedFiles().length)}</em>`,
			),
		)
	}
}
