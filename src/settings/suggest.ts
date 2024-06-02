/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/member-ordering */
/* eslint-disable @typescript-eslint/parameter-properties */
//

/**
 * Via https://github.com/liamcain/obsidian-periodic-notes/blob/f3d7266cdeb59b6f17a18a728c04219e19bac07d/src/ui/suggest.ts
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

import { type Instance as PopperInstance, createPopper } from '@popperjs/core'
import { type App, type ISuggestOwner, Scope } from 'obsidian'

// Via https://github.com/liamcain/obsidian-periodic-notes/blob/main/src/settings/utils.ts
const wrapAround = (value: number, size: number): number => ((value % size) + size) % size

class Suggest<T> {
	private readonly containerEl: HTMLElement
	private readonly owner: ISuggestOwner<T>
	private selectedItem!: number
	private suggestions!: HTMLDivElement[]
	private values!: T[]

	constructor(owner: ISuggestOwner<T>, containerElement: HTMLElement, scope: Scope) {
		this.owner = owner
		this.containerEl = containerElement

		containerElement.on('click', '.suggestion-item', (this as any).onSuggestionClick.bind(this))
		containerElement.on(
			'mousemove',
			'.suggestion-item',
			(this as any).onSuggestionMouseover.bind(this),
		)

		scope.register([], 'ArrowUp', (event) => {
			if (!event.isComposing) {
				this.setSelectedItem(this.selectedItem - 1, true)
				return false
			}
		})

		scope.register([], 'ArrowDown', (event) => {
			if (!event.isComposing) {
				this.setSelectedItem(this.selectedItem + 1, true)
				return false
			}
		})

		scope.register([], 'Enter', (event) => {
			if (!event.isComposing) {
				this.useSelectedItem(event)
				return false
			}
		})
	}

	onSuggestionClick(event: MouseEvent, element: HTMLDivElement): void {
		event.preventDefault()

		const item = this.suggestions.indexOf(element)
		this.setSelectedItem(item, false)
		this.useSelectedItem(event)
	}

	onSuggestionMouseover(_event: MouseEvent, element: HTMLDivElement): void {
		const item = this.suggestions.indexOf(element)
		this.setSelectedItem(item, false)
	}

	setSelectedItem(selectedIndex: number, scrollIntoView: boolean) {
		const normalizedIndex = wrapAround(selectedIndex, this.suggestions.length)
		const previousSelectedSuggestion = this.suggestions[this.selectedItem]
		const selectedSuggestion = this.suggestions[normalizedIndex]

		previousSelectedSuggestion?.removeClass('is-selected')
		selectedSuggestion?.addClass('is-selected')

		this.selectedItem = normalizedIndex

		if (scrollIntoView) {
			selectedSuggestion.scrollIntoView(false)
		}
	}

	setSuggestions(values: T[]) {
		this.containerEl.empty()
		const suggestionEls: HTMLDivElement[] = []

		for (const value of values) {
			const suggestionElement = this.containerEl.createDiv('suggestion-item')
			this.owner.renderSuggestion(value, suggestionElement)
			suggestionEls.push(suggestionElement)
		}

		this.values = values
		this.suggestions = suggestionEls
		this.setSelectedItem(0, false)
	}

	useSelectedItem(event: KeyboardEvent | MouseEvent) {
		const currentValue = this.values[this.selectedItem]
		if (currentValue) {
			this.owner.selectSuggestion(currentValue, event)
		}
	}
}

export abstract class TextInputSuggest<T> implements ISuggestOwner<T> {
	private popper!: PopperInstance
	private readonly scope: Scope
	private readonly suggest: Suggest<T>
	private readonly suggestEl: HTMLElement
	protected app: App
	protected inputEl: HTMLInputElement

	constructor(app: App, inputElement: HTMLInputElement) {
		this.app = app
		this.inputEl = inputElement
		this.scope = new Scope()

		this.suggestEl = createDiv('suggestion-container')
		const suggestion = this.suggestEl.createDiv('suggestion')
		this.suggest = new Suggest(this, suggestion, this.scope)

		this.scope.register([], 'Escape', this.close.bind(this))

		this.inputEl.addEventListener('input', this.onInputChanged.bind(this))
		this.inputEl.addEventListener('focus', this.onInputChanged.bind(this))
		this.inputEl.addEventListener('blur', this.close.bind(this))
		this.suggestEl.on('mousedown', '.suggestion-container', (event: MouseEvent) => {
			event.preventDefault()
		})
	}

	close(): void {
		;(this.app as any).keymap.popScope(this.scope)

		this.suggest.setSuggestions([])
		this.popper.destroy()
		this.suggestEl.detach()
	}

	onInputChanged(): void {
		const inputString = this.inputEl.value
		const suggestions = this.getSuggestions(inputString)

		if (suggestions.length > 0) {
			this.suggest.setSuggestions(suggestions)

			this.open((this.app as any).dom.appContainerEl, this.inputEl)
		}
	}

	open(container: HTMLElement, inputElement: HTMLElement): void {
		;(this.app as any).keymap.pushScope(this.scope)

		container.append(this.suggestEl)
		this.popper = createPopper(inputElement, this.suggestEl, {
			modifiers: [
				{
					enabled: true,
					fn({ instance, state }) {
						// Note: positioning needs to be calculated twice -
						// first pass - positioning it according to the width of the popper
						// second pass - position it with the width bound to the reference element
						// we need to early exit to avoid an infinite loop
						const targetWidth = `${state.rects.reference.width}px`
						if (state.styles.popper.width === targetWidth) {
							return
						}

						state.styles.popper.width = targetWidth
						void instance.update()
					},
					name: 'sameWidth',
					phase: 'beforeWrite',
					requires: ['computeStyles'],
				},
			],
			placement: 'bottom-start',
		})
	}

	abstract getSuggestions(inputString: string): T[]
	abstract renderSuggestion(item: T, element: HTMLElement): void
	abstract selectSuggestion(item: T): void
}
