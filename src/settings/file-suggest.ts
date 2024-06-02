/**
 * Via https://github.com/liamcain/obsidian-periodic-notes/blob/f3d7266cdeb59b6f17a18a728c04219e19bac07d/src/ui/file-suggest.ts
 *
 * MIT License
 *
 * Copyright (c) 2021 Liam Cain
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import { TextInputSuggest } from './suggest'
import { TFile, TFolder } from 'obsidian'

export class FileSuggest extends TextInputSuggest<TFile> {
	getSuggestions(inputString: string): TFile[] {
		const abstractFiles = this.app.vault.getAllLoadedFiles()
		const files: TFile[] = []
		const lowerCaseInputString = inputString.toLowerCase()

		for (const file of abstractFiles) {
			if (
				file instanceof TFile &&
				file.extension === 'md' &&
				file.path.toLowerCase().contains(lowerCaseInputString)
			) {
				files.push(file)
			}
		}

		return files
	}

	renderSuggestion(file: TFile, element: HTMLElement): void {
		element.setText(file.path)
	}

	selectSuggestion(file: TFile): void {
		this.inputEl.value = file.path
		this.inputEl.trigger('input')
		this.close()
	}
}

export class FolderSuggest extends TextInputSuggest<TFolder> {
	getSuggestions(inputString: string): TFolder[] {
		const abstractFiles = this.app.vault.getAllLoadedFiles()
		const folders: TFolder[] = []
		const lowerCaseInputString = inputString.toLowerCase()

		for (const folder of abstractFiles) {
			if (folder instanceof TFolder && folder.path.toLowerCase().contains(lowerCaseInputString)) {
				folders.push(folder)
			}
		}

		return folders
	}

	renderSuggestion(file: TFolder, element: HTMLElement): void {
		element.setText(file.path)
	}

	selectSuggestion(file: TFolder): void {
		this.inputEl.value = file.path
		this.inputEl.trigger('input')
		this.close()
	}
}
