/* eslint-disable no-new */
import {
	YankiPluginSettingTab,
	type YankiPluginSettings,
	yankiPluginDefaultSettings,
} from './settings/settings'
import {
	type Editor,
	type MarkdownFileInfo,
	MarkdownView,
	Modal,
	Notice,
	Plugin,
	type TAbstractFile,
	TFolder,
} from 'obsidian'
import { YankiConnect } from 'yanki-connect'

export default class YankiPlugin extends Plugin {
	public settings: YankiPluginSettings = yankiPluginDefaultSettings

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
		await this.loadSettings()

		const client = new YankiConnect(this.settings.syncOptions.ankiConnectOptions)

		const results = await client.deck.deckNamesAndIds()

		console.log('----------------------------------')
		console.log(`results: ${JSON.stringify(results, undefined, 2)}`)

		// Listen for file renames
		this.registerEvent(this.app.vault.on('rename', this.handleRename.bind(this)))

		// This creates an icon in the left ribbon.
		const ribbonIconElement = this.addRibbonIcon('dice', 'Yanki Plugin', () => {
			// Called when the user clicks the icon.
			new Notice('This is a notice!')
		})
		// Perform additional things with the ribbon
		ribbonIconElement.addClass('yanki-plugin-ribbon-class')

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemElement = this.addStatusBarItem()
		statusBarItemElement.setText('Status Bar Text from Yanki Plugin')

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			callback: () => {
				new SampleModal(this.app).open()
			},
			id: 'open-sample-modal-simple',
			name: 'Open sample modal (simple)',
		})

		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			editorCallback(editor: Editor, view: MarkdownFileInfo | MarkdownView): undefined {
				console.log(view)
				console.log(editor.getSelection())
				editor.replaceSelection('Sample Editor Command')

				//
			},
			id: 'sample-editor-command',
			name: 'Sample editor command',
		})

		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView)
				if (markdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						new SampleModal(this.app).open()
					}

					// This command will only show up in Command Palette when the check function returns true
					return true
				}
			},
			id: 'open-sample-modal-complex',
			name: 'Open sample modal (complex)',
		})

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new YankiPluginSettingTab(this.app, this))

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (event: MouseEvent) => {
			console.log('click', event)
		})

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(
			window.setInterval(
				() => {
					console.log('setInterval')
				},
				5 * 60 * 1000,
			),
		)
	}

	onunload() {
		console.log('Unloading Yanki plugin')
	}

	async saveSettings() {
		await this.saveData(this.settings)
	}
}

class SampleModal extends Modal {
	// "Useless" constructor?
	// constructor(app: App) {
	// 	super(app)
	// }

	onClose() {
		const { contentEl } = this
		contentEl.empty()
	}

	onOpen() {
		const { contentEl } = this
		contentEl.setText('Hi from Yanki plugin!!!!!!!!!!!!!!!!!!!')
	}
}

// Class SampleSettingTab extends PluginSettingTab {
// 	plugin: YankiPlugin

// 	constructor(app: App, plugin: YankiPlugin) {
// 		super(app, plugin)
// 		this.plugin = plugin
// 	}

// 	display(): void {
// 		const { containerEl } = this

// 		containerEl.empty()

// 		new Setting(containerEl)
// 			.setName('Setting #1')
// 			.setDesc("It's a secret!")
// 			.addText((text) =>
// 				text
// 					.setPlaceholder('Enter your secret')
// 					.setValue(this.plugin.settings.mySetting)
// 					.onChange(async (value) => {
// 						this.plugin.settings.mySetting = value
// 						await this.plugin.saveSettings()
// 					}),
// 			)
// 	}
// }
