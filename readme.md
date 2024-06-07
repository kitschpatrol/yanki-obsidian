<!--+ Warning: Content inside HTML comment blocks was generated by mdat and may be overwritten. +-->

<!-- title -->

# yanki-obsidian

<!-- /title -->

<!-- badges {
  custom: {
    "GitHub Release": {
      image: "https://img.shields.io/github/v/release/kitschpatrol/yanki-obsidian?label=Release",
      link: "https://github.com/kitschpatrol/yanki-obsidian/releases/latest",
    },
  },
} -->

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub Release](https://img.shields.io/github/v/release/kitschpatrol/yanki-obsidian?label=Release)](https://github.com/kitschpatrol/yanki-obsidian/releases/latest)

<!-- /badges -->

<!-- short-description -->

**An Obsidian plugin for ultra-simple automated flashcard syncing from a folder in your vault to Anki. Pure Markdown syntax. Minimal configuration. No fuss.**

<!-- /short-description -->

> \[!IMPORTANT]
> The Yanki Obsidian plugin is feature-complete but will remain zero-versioned until it's been thoroughly tested. Please Exercise caution and make backups of your Vault and Anki notes until the 1.0.0 release.
>
> The plugin currently available for download and installation directly from GitHub for advanced users. It will be submitted for review and potential inclusion as an Obsidian community plugin once I am completely confident in its design and reliability. _(Expected in July, 2024.)_
>
> Any testing and feedback by adventurous users is extremely welcome.

## Overview

The Yanki plugin automatically syncs a folder (or folders) of notes from your Obsidian vault to Anki.

The primary novelty of its approach is in how Markdown is translated into Anki notes, and how folders are translated into Anki decks:

- The **structure** of a Markdown note determines the **type** of Anki note it becomes, so no extra syntax or Anki-specific markup is required — just pure Markdown.

  This also means that your flashcard notes remain nice and legible in Obsidian, and you don't have to deal with the cognitive switch of ` ```fenced``` ` regions and Anki's rather noisy templating syntax.

- The **parent folder** of your notes in your Obsidian vault determines their **deck name** in Anki, with any intermediate hierarchies created as needed.

## Quick start

1. **Prerequisites**

- The [Anki desktop app](https://apps.ankiweb.net)
- The [Anki-Connect](https://foosoft.net/projects/anki-connect/) add-on

  If you need to install it, select _Tools → Add-ons_ from the menu, click _Get Add-ons..._, and then enter the code `2055492159` in the field to get Anki-Connect.

  Once installed, Anki-Connect requires some one-time setup to accept connections from Obsidian.

  In Anki, select _Tools → Add-ons_ from the menu, then select _AnkiConnect_ from the list, and click the _Config_ button in the lower right. In the ensuing modal, add `"app://obsidian.md"` to the `webCorsOriginList` array, like so:

  ```json
  {
    "apiKey": null,
    "apiLogPath": null,
    "ignoreOriginList": [],
    "webBindAddress": "127.0.0.1",
    "webBindPort": 8765,
    "webCorsOrigin": "http://localhost",
    "webCorsOriginList": ["http://localhost", "app://obsidian.md"]
  }
  ```

2. **Plugin installation**

   For now, download the latest release from GitHub and drag it in your vault's `.obsidian/plugins`.

   Restart Obsidian.

3. **Setup**

   Enable the plugin, and go to its settings tab to select which folders of notes you'd like to sync to Anki. See the section \[Markdown note types]]\(#markdown-note-types) on how to format your notes to create different Anki card types.

4. **Sync**

   Syncing happens automatically by default whenever files in your watched flashcard folders change. Or you can force a sync using `Yanki: Sync flashcards to Anki` command or the button in the Yanki settings tab.

5. **Study**

   Pop over to the Anki app, and you should see the Obsidian notes from your selected folders organized into decks in Anki that match your vault's folder hierarchy.

## Features

### One Obsidian note = one Anki note

Avoid the complexity of mixing and matching multi-note and single-note syntaxes. One note in Obsidian always yields one Anki note.

### Vault folder hierarchy = Anki deck hierarchy

Yanki uses your note's parent directory name as the deck name. Complex folder hierarchies are also supported — Anki decks will be created and nested as needed to match the structure of your vault.

### Embrace of Anki's default note types

More note types, more problems.

Yanki _only_ supports turning Markdown into the "Basic", "Basic (and reversed card)", "Basic (type in the answer)", and "Cloze" note types that ship as defaults in the Anki App.

### Infer Anki note type from Markdown structure

Since the number of supported note types is small, the type of Anki note to create from a given Obsidian note can be inferred from a few simple rules about the structure of the Markdown.

For example, a Basic note is any Markdown file with a `---` horizontal rule splitting the front and back of the card:

```md
I'm the front.

---

I'm the back.
```

That's it, no extra metadata or Anki-specific markup is required. You can add whatever additional Markdown syntax you'd like to style the note.

The structural cues for all four supported note types are described [later in this document](#markdown-note-types).

### Tag support

The values in the `tags` array of your note's properties will be added as tags in Anki. This gives nice interoperability with Obsidian's tag system, which treats frontmatter `tags` as first-class tag citizens.

Detecting Obsidian `#tags` in the document body is not currently supported, but plugins like Victor Tao's [Obsidian Linter](https://github.com/platers/obsidian-linter) can automate tag migration from the document body to frontmatter, where Yanki (and thus Anki) can see it.

### Support for Obsidian WikiLinks

Jump back to sources in Obsidian while studying in Anki.

The Yanki plugin detects your vault's name, and automatically turns any internal `[[WikiLinks]]` in your notes into `obsidian://` protocol links, which you can click through in Anki to get back to the source in Obsidian.

### Fancy markdown

An extended palette of markdown syntax is available out of the box:

- [GitHub Flavored Markdown](https://github.github.com/gfm/), including `| tables |`, `~~strike-throughs~~`, `- [x] task lists`, and autolinks.
- Syntax highlighting via [Shiki](https://shiki.style).
- GitHub-style [Alerts](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax#alerts).
- The aforementioned [WikiLinks](https://github.com/Python-Markdown/markdown/blob/master/docs/extensions/wikilinks.md).
- [LaTeX formatted mathematical expressions](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/writing-mathematical-expressions) via [MathJax](https://www.mathjax.org).
- Support for the [`==highlights==`](https://github.com/ipikuka/remark-flexible-markers) syntax.

### Intelligent synchronization

Your local Obsidian markdown files are the single point of truth for what will and up in Anki, but Yanki knows to leave your other Anki notes alone.

When you edit a local Obsidian note, Yanki makes every effort to update rather than delete it in the Anki database so that review progress is preserved.

But when you do want to delete something, it's as simple as deleting it from Obsidian, and it will be removed from the Anki database on the next sync. Protections are in place to prevent deleting Anki notes that weren't initially created by Yanki.

If you use [AnkiWeb](https://ankiweb.net/) to sync your notes to the cloud, Yanki will also trigger this next step in the sync, automating the flow from Markdown → Anki → AnkiWeb in one shot. (Configurable via a [setting](#push-to-ankiweb).)

### Existing notes are untouched

Yanki tags the notes it's in charge of with a hidden field, so it will never touch your existing Anki notes. (_But please exercise caution until the 1.0 release..._)

## Markdown note types

Yanki automatically infers the _type_ of Note you'd like to create in Anki based on the presence or absence of certain element in your Markdown files.

The rules were designed with the semantic and visual nature of Markdown in mind.

The most minimal examples to "trigger" different note types are shown below, but the implementation can handle additional weirdness and will generally do the right thing if it encounters elements that might indicate conflicting note types.

You're free to use additional Markdown in your note files to style and structure the front and back of your flashcards. Image markup will work, but currently assets must be hosted externally and are not copied into Anki's media storage system.

### Basic

A **basic** card is created from any file with a `---`:

```md
This is the front of the card

---

This is the back of the card
```

### Basic (and reversed card)

Doubling up the `---` identifies the note as being **reversible** (and will result in the generation of two cards in Anki).

_Mnemonic: Twice the `---` for twice the cards._

```md
Sometimes the answer is the question

---

---

Sometimes the question is the answer
```

<em>Mnemonic: The syntax resembles a `_blank to be filled in_`.</em>

### Basic (type in the answer)

If the last statement in the Markdown file is `_emphasized like this_`, it becomes the type-in-the-answer text in Anki.

```md
Jazz isn't dead

_It just smells funny_
```

---

### Cloze

Text that is `~~struck through~~` with the [somewhat esoteric double-tilde syntax](https://github.github.com/gfm/#strikethrough-extension-) will be hidden in the resulting _cloze_ card:

_Mnemonic: The `~~strike through~~` implies redaction._

```md
All will be ~~revealed~~.
```

Multiple clozes are supported, which will create additional cards. You can add a `---` to include back-of-card information as well. Hints are also supported, and are indicated by giving the hint text `_emphasis_` at the end of the cloze strike-through:

```md
~~All~~ will be ~~revealed _but here's a hint_~~.

---

Additional revelations on the back of the card.
```

Clozing a block element is not currently supported.

## Usage

### Commands

The Yanki plugin provides a single command, which works as advertised:

**`Yanki: Sync flashcards to Anki`**

But you shouldn't need to sync manually if automatic sync is enabled.

### Settings

#### Anki flashcard folders

##### Watched folder list

Yanki will sync files in the vault folders specified here to Anki.

_Folder syncing is always recursive._

Anki decks will be created automatically to match the hierarchy of your Obsidian folders.

Selecting multiple folders from different parts of your vault is fine, they'll just end up in different Anki decks.

Use care when editing or deleting folders from this list, since notes will be deleted from Anki (along with their review statistics) on the next sync.

##### Ignore folder notes

When enabled, notes matching the name of their parent folder will not be synced. This is useful if you use the [folder notes](https://github.com/LostPaul/obsidian-folder-notes) plugin to keep a top-level note per folder.

#### Sync settings

##### Automatic sync

Yanki watches the notes in your flashcard folders for changes, additions, deletions, etc, and will trigger a sync to Anki (almost) immediately after it sees a change.

If you disable this, syncing must be initiated manually either via [a command](#commands) or the "Sync now" button in the setting tab.

_Default: Enabled_

##### Push to AnkiWeb

There are (potentially) three places your note data lives:

1. Obsidian — Markdown files, the single source of truth.
2. Anki Desktop App — The local database of notes.
3. AnkiWeb — Anki's first-party note syncing service, which brings your notes to the browser and the Anki mobile app.

"Syncing" in Yanki is focused on going from 1 → 2, but when the "Push to AnkiWeb" option is enabled, Yanki will ask the Anki Desktop app to take care of syncing from 2 → 3. (Basically the equivalent of pushing the "Sync" button in the Anki Desktop app.)

This happens on a best-effort basis, and Yanki doesn't get any feedback on whether syncing forward to AnkiWeb worked or not, so your mileage may vary.

_Default: Enabled_

#### Anki-Connect settings

These are advanced settings to accommodate custom Anki-Connect configurations. The defaults are almost certainly fine.

## FAQ

### Why do I have to come up with a title for every card

You don't. Check out Rey Christian's [Auto Filename](https://github.com/rcsaquino/obsidian-auto-filename) plugin.

### Does Yanki work on Obsidian's mobile apps?

No, and it probably never will since it needs to communicate with a running instance of the Anki desktop app. (It's technically feasible with some network contortions, but that's not anything I'd wish on anyone.)

### Do I really have to have to launch Anki for syncing to work?

Yes, unfortunately. There are other ways to talk to the Anki database, but none are as robust as what's provided by [Anki-Connect](https://foosoft.net/projects/anki-connect/), which is where this requirement comes from.

### Can I move cards in Obsidian?

Yes, as long as they stay within a folder registered in the Yanki plugin's settings, they will continue to sync. Yanki simply moves the cards to whatever deck reflects the new parent folder in Obsidian on the next sync.

### How many notes can I sync?

Not sure, let me know. There's room for optimization in the current sync implementation.

### How do I delete a note?

Just delete it from Obsidian, or move it to a folder than Yanki isn't set up to watch. It will be deleted from Anki on the next sync. (You can re-add it, but any history about the note in Anki will have been lost.)

### Can I edit notes in the Anki app?

No, Obsidian is the source of truth. Any changes to or deletions of Yanki-managed notes in in Anki will be overwritten on the next sync.

### Can I embed images in my notes?

Not yet, at least not using Obsidian's asset model. Remote-linked images work fine for the time being.

### Can I create custom note types / models?

No, Yanki only supports the four note types described in the [Markdown note types](#markdown-note-types) section. If you need fancy note types and custom templates, the [other Obsidian Anki plugins](#other-obsidian-anki-plugins) have you covered.

### Does Yanki take over my entire Anki library?

No, it only touches the notes it creates. However, it's recommended to avoid deck name collisions between your existing Anki notes and notes synced by Yanki. (Though even then Yanki should leave your existing notes alone.)

### What's the `noteId` property added to my Obsidian notes?

It's Anki's internal ID for the note, which is saved after the first sync.

### Can I delete the `noteId`?

Don't. If it goes missing, Yanki will consider the ID-less note in Anki to be an orphan, and it will be deleted on the next sync, and a new ID will be created. You won't lose your note, because it's safe in Obsidian, but you _will_ lose stats in Anki, so touching the noteID is not recommended.

### Seeing `noteId` everywhere is annoying...

Shield your eyes with a [CSS snippet](https://help.obsidian.md/Extending+Obsidian/CSS+snippets):

```css
div.metadata-property[data-property-key='noteId'] {
  display: none;
}
```

### Can I add other properties?

Yes, frontmatter is fine, as long as it's valid YAML. Yanki just ignores all of it except for the `tags` and `noteId` fields.

### What happens if I duplicate a note that has a `noteId`?

Yanki will try to preserve the `noteId` of the note that matches what's been synced to Anki in the past, and will create new `noteId`s for the remaining duplicates. But this is a bit risky and not super-recommended.

### If I use the [folder notes](https://github.com/LostPaul/obsidian-folder-notes) plugin, will my folder notes become Anki notes?

The Yanki Plugin has a settings option to ignore folder notes. It's enabled by default.

## The future

A few features are under consideration:

- [ ] Integration with Obsidian's image asset system.
- [ ] Links back to the Obsidian source note on each card in Anki.
- [ ] Nicer stylesheets / theming for notes in both Anki and Obsidian.
- [ ] Synchronize Anki's review statistics back to Obsidian.
- [ ] Render Markdown → HTML with Obsidian's pipeline + stylesheets.

If you have others in mind, feel free to [open an issue](https://github.com/kitschpatrol/yanki-obsidian/issues) with a suggestion.

## Background

### Implementation notes

The Yanki plugin is built on [`yanki`](https://github.com/kitschpatrol/yanki), a command line tool and TypeScript library that handles all the Markdown wrangling and communication with Anki. If you want to sync Markdown like the Yanki plugin does from outside of Obsidian, `yanki` implements the same features (plus a few extras). Using the `yanki` CLI tool will not interfere with syncing from the Yanki Obsidian plugin.

In turn, `yanki` is built on top of [`yanki-connect`](https://github.com/kitschpatrol/yanki-connect), which is a layer of TypeScript over the [Anki-Connect](https://foosoft.net/projects/anki-connect/) API.

### Other Obsidian Anki plugins

- [Export to Anki / Obsidian_to_Anki](https://github.com/ObsidianToAnki/Obsidian_to_Anki)
- [AnkiBridge](https://github.com/JeppeKlitgaard/ObsidianAnkiBridge)
- [Flashcards](https://github.com/reuseman/flashcards-obsidian)
- [Anki Sync](https://github.com/debanjandhar12/Obsidian-Anki-Sync)
- [Note Synchronizer](https://github.com/tansongchen/obsidian-note-synchronizer)
- [Awesome Flashcard](https://github.com/AwesomeDog/obsidian-awesome-flashcard)
- [Auto Anki](https://github.com/ad2969/obsidian-auto-anki)
- [text2anki-openai](https://github.com/manibatra/obsidian-text2anki-openai)
- [AnkiSync+](https://github.com/RochaG07/anki-sync-plus)

## Maintainers

[@kitschpatrol](https://github.com/kitschpatrol)

## Acknowledgements

Thanks to Alex Yatskov for creating [Anki-Connect](https://foosoft.net/projects/anki-connect/).

PJ Eby's [Hot-Reload](https://github.com/pjeby/hot-reload) Obsidian plugin is a huge help during development.

Figuring out Obsidian's \[AbstractInputSuggest] for the folder selection settings depended on examples in projects by [Daniel Rodríguez Rivero](https://github.com/danielo515) and [Liam Cain](https://github.com/liamcain).

<!-- contributing -->

## Contributing

[Issues](https://github.com/kitschpatrol/yanki-obsidian/issues) and pull requests are welcome.

<!-- /contributing -->

<!-- license -->

## License

[MIT](license.txt) © Eric Mika

<!-- /license -->
