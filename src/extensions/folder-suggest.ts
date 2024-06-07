// Via Daniel Rodríguez Rivero's Modal Form Plugin: https://github.com/danielo515/obsidian-modal-form
// Via Liam Cain's Periodic Notes Plugin: https://github.com/liamcain/obsidian-periodic-notes
import { AbstractInputSuggest, type App, type TAbstractFile, TFolder } from 'obsidian'

export class FolderSuggest extends AbstractInputSuggest<TFolder> {
	constructor(
		public inputElement: HTMLInputElement,
		public app: App,
	) {
		super(app, inputElement)
	}

	getSuggestions(inputString: string): TFolder[] {
		const abstractFiles = this.app.vault.getAllLoadedFiles()
		const lowerCaseInputString = inputString.toLowerCase()

		const folders: TFolder[] = abstractFiles.reduce<TFolder[]>((acc, folder: TAbstractFile) => {
			if (folder instanceof TFolder && folder.path.toLowerCase().contains(lowerCaseInputString)) {
				acc.push(folder)
			}

			return acc
		}, [])

		return folders
	}

	renderSuggestion(file: TFolder, element: HTMLElement): void {
		element.setText(file.path)
	}

	selectSuggestion(file: TFolder): void {
		this.inputElement.value = file.path
		this.inputElement.trigger('input')
		this.close()
	}
}
