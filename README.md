<!--+ Warning: Content inside HTML comment blocks was generated by mdat and may be overwritten. +-->

<!-- title {titleCase: true, postfix: " Plugin"} -->

# Yanki Obsidian Plugin

<!-- /title -->

![Yanki Obsidian Banner](./assets/banner.gif)

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

**An Obsidian plugin for automated flashcard syncing from a folder in your vault to Anki. Pure Markdown syntax. No fuss.**

<!-- /short-description -->

<!-- toc { depth: 2 } -->

## Table of contents

- [Overview](#overview)
- [Quick start](#quick-start)
- [Features](#features)
- [Markdown note types](#markdown-note-types)
- [Usage](#usage)
- [FAQ](#faq)
- [Privacy and security](#privacy-and-security)
- [The future](#the-future)
- [Background](#background)
- [Maintainers](#maintainers)
- [Acknowledgments](#acknowledgments)
- [Contributing](#contributing)
- [License](#license)

<!-- /toc -->

## Overview

Yanki is a plugin for Obsidian that automatically syncs a folder (or folders) of notes from your vault to Anki.

The primary novelty of its approach is in how Markdown is translated into Anki notes, and how folders are translated into Anki decks:

- **One** Obsidian note maps to **one** Anki note.

- The **structure** of the Markdown in your Obsidian notes determine the **types** of Anki notes they become. No extra syntax or Anki-specific markup is required — just pure Markdown.

  This also means that your flashcard notes remain nice and legible in Obsidian, and you don't have to deal with the cognitive switch of ` ```fenced``` ` regions and Anki's rather noisy templating syntax.

- The **parent folder** of your notes in your Obsidian vault determines their **deck name** in Anki, with any intermediate hierarchies created as needed.

## Quick start

1. **Prerequisites**

- The [Obsidian desktop application](https://obsidian.md/download)
- The [Anki desktop application](https://apps.ankiweb.net)
- The [Anki-Connect](https://foosoft.net/projects/anki-connect/) add-on

  To install the Anki-Connect add-on, open the Anki desktop application and select _Tools → Add-ons_ from the menu, click _Get Add-ons..._, and then enter the code `2055492159` in the field to get Anki-Connect.

  Anki-Connect may ask for your permission in the Anki application to connect to Obsidian on the first sync.

  If you encounter trouble with Anki-Connect, please see [the manual configuration procedure](#ive-installed-anki-connect-but-am-still-getting-connection-errors).

2. **Plugin installation**

   Search for `yanki` in Obsidian's community plugins browser, then click the "Install". Or, install it from [the Obsidian website](https://obsidian.md/plugins?id=yanki).

3. **Setup**

   Enable the plugin, and go to its settings tab to select which folders of notes you'd like to sync to Anki. See the section [Markdown note types](#markdown-note-types) on how to format your notes to create different types of Anki cards.

4. **Sync**

   Initiate a sync from Obsidian to Anki using the `Yanki: Sync flashcard notes to Anki` command. You can also trigger a sync manually via the button in the Yanki settings tab, or enable automatic syncing to sync whenever notes in your watched vault folders change.

5. **Study**

   Pop over to the Anki app, and you should see the Obsidian notes from your selected folders organized into decks in Anki that match your vault's folder hierarchy.

## Features

### One Obsidian note = one Anki note

Avoid the complexity of mixing and matching multi-note and single-note syntaxes. One note in Obsidian always yields one Anki note.

### Vault folder hierarchy = Anki deck hierarchy

Yanki uses your Obsidian note's parent folder name as the deck name. Complex folder hierarchies are also supported — Anki decks will be created and nested as needed to match the structure of your vault.

### Embrace of Anki's default note types

More note types, more problems.

Yanki _only_ supports turning Markdown into the "Basic", "Basic (and reversed card)", "Basic (type in the answer)", and "Cloze" note types that ship as defaults in the Anki App.

### Infer Anki note type from Markdown structure

Since the number of supported note types is small, the type of Anki note to create from a given Obsidian note can be inferred from a few simple rules about the structure of the Markdown.

For example, a Basic note is any Markdown file with a `---` thematic break splitting the front and back of the card:

```md
I'm the front of the card.

---

I'm the back of the card.
```

That's it, no extra metadata or Anki-specific markup is required. You're free to use additional Markdown syntax to style the note to your liking.

The structural cues for all four supported note types are described [later in this document](#markdown-note-types).

### Tag support

The values in the `tags` array of your note's properties will be added as tags in Anki. This gives nice interoperability with Obsidian's tag system, which also recognizes the frontmatter `tags` array.

Detecting Obsidian `#tags` in the document body is not currently supported, but plugins like Victor Tao's [Obsidian Linter](https://github.com/platers/obsidian-linter) can automate tag migration from the document body to frontmatter, where Yanki (and thus Anki) can see them.

### Support for Obsidian WikiLinks

Easily jump back to source notes in Obsidian while studying in the Anki desktop application.

The Yanki plugin detects your vault's name, and automatically turns any internal `[[WikiLinks]]` in your notes into `obsidian://` protocol links, which you can click through in Anki to get back to the source in Obsidian.

### Fancy Markdown

An extended palette of Markdown syntax is available out of the box, mirroring (almost) all the features supported by Obsidian:

- [GitHub Flavored Markdown](https://github.github.com/gfm/), including `| tables |`, `~~strike-throughs~~`, `- [x] task lists`, and autolinks.
- Syntax highlighting via [Shiki](https://shiki.style).
- GitHub-style [Alerts](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax#alerts).
- The aforementioned [WikiLinks](https://github.com/Python-Markdown/markdown/blob/master/docs/extensions/wikilinks.md).
- [LaTeX formatted mathematical expressions](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/writing-mathematical-expressions) via [MathJax](https://www.mathjax.org).
- Support for the [`==highlights==`](https://github.com/ipikuka/remark-flexible-markers) syntax.

### Intelligent syncing

Your local Obsidian Markdown notes are the single point of truth for what will and up in Anki, but Yanki knows to leave your other Anki notes alone.

When you edit a local Obsidian note, Yanki makes every effort to update rather than delete it in the Anki database so that review progress is preserved.

But when you _do_ want to delete something, it's as simple as deleting it from Obsidian, and it will be removed from the Anki database on the next sync. Protections are in place to prevent deleting Anki notes that weren't initially created by Yanki.

If you use [AnkiWeb](https://ankiweb.net/) to sync your notes to the cloud, Yanki will also trigger this next step in the sync, automating the flow from Markdown → Anki → AnkiWeb in one shot. (Configurable via a [setting](#push-to-ankiweb).)

### Automatic syncing

When the Automatic Sync option is enabled, Yanki will automatically updated notes to Anki whenever flashcard notes are created, deleted, or updated in Obsidian.

### Existing notes are untouched

Yanki tags the notes it's in charge of with a hidden field, so it will never touch your existing Anki notes. Yanki also creates and manages the note types it needs in Anki, so your existing note types and customizations remain untouched.

### Note name management

The "one Obsidian note = one Anki note" premise can make for a lot of individual note files, and thinking up and renaming notes as their content is revised can be tedious. So, if you want, Yanki can manage the names of your note files based on their content.

Yanki looks inside each note, and extracts either the text of the "prompt" (e.g. the front of the card in most cases), or the "response" (e.g. the back of the card in most cases) to use as the filename. Truncation, deduplication, and sanitization are all taken care of.

Edge cases are carefully managed to ensure that there's always _some kind_ of best-effort semantically valuable file name assigned.

### Media asset sync

Yanki can sync images, videos, and audio files embedded in your Obsidian notes to Anki's media asset management system. At your option, it can sync local assets, or assets linked via URL, or both, or none.

Yanki automatically manages change detection when you revise assets, and also manages clean-up of synced media assets in Anki when you delete either entire notes or embedded assets in Obsidian.

Both wiki-style `![[something.png]]` and `![markdown](style.png)` asset embedding syntaxes are supported.

## Markdown note types

Yanki automatically infers the _type_ of Note you'd like to create in Anki based on the presence or absence of certain element in your Markdown notes.

The rules were designed with Markdown's semantic precedents and visual nature in mind.

The most minimal examples to "trigger" different note types are shown below, but the implementation can handle additional weirdness and will generally do the right thing if it encounters elements that might indicate conflicting note types.

You're free to use additional Markdown in your notes to style and structure the front and back of your flashcard notes.

The four supported note types are described below. See the [Demo Vault](https://github.com/kitschpatrol/yanki-obsidian/blob/main/examples/Demo%20Vault) for additional examples.

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

### Basic (type in the answer)

If the last statement in the Markdown file is `_emphasized like this_`, it becomes the type-in-the-answer text in Anki.

<em>Mnemonic: The syntax resembles a `_blank to be filled in_`.</em>

```md
Jazz isn't dead

_It just smells funny_
```

### Cloze

Text that is `~~struck through~~` with the [somewhat esoteric double-tilde syntax](https://github.github.com/gfm/#strikethrough-extension-) will be hidden in the resulting _cloze_ card:

_Mnemonic: The `~~strike through~~` implies redaction._

```md
All will be ~~revealed~~.
```

Multiple clozes are supported, which will create additional cards.

You can add a `---` to include back-of-card information as well.

Hints are also supported, and are indicated by giving the hint text `_emphasis_` at the end of the cloze strike-through:

```md
~~All~~ will be ~~revealed _but here's a hint_~~.

---

Additional revelations on the back of the card.
```

Clozing a block element is not currently supported.

## Usage

### Commands

The Yanki plugin provides a single command, which works as advertised:

**`Yanki: Sync flashcard notes to Anki`**

If [automatic sync](#automatic-sync) is enabled, you shouldn't need to use the command manually.

### Settings

#### Anki flashcard folders

##### Watched folder list

Yanki will sync notes in the vault folders specified here to Anki.

_Folder syncing is always recursive._

Anki decks will be created automatically to match the hierarchy of your Obsidian folders.

Selecting multiple folders from different parts of your vault is fine, they'll just end up in different Anki decks.

Use care when editing or deleting folders from this list, since notes will be deleted from Anki (along with their review statistics) on the next sync.

##### Ignore folder notes

When enabled, notes matching the name of their parent folder will not be synced. This is useful if you use the [folder notes](https://github.com/LostPaul/obsidian-folder-notes) plugin to keep a top-level note per folder.

_Default: Enabled_

#### Sync settings

##### Automatic sync

When enabled, Yanki will observe the notes in your [watched folders](#watched-folder-list) for changes, additions, deletions, etc, and trigger a sync to Anki (almost) immediately after it sees a change.

When disabled, syncing must be initiated manually either via [a command](#commands) or the "Sync now" button in the setting tab.

_Default: Disabled_

##### Push to AnkiWeb

There are (potentially) three places your note data lives:

1. The Obsidian application — Markdown notes, the single source of truth.
2. The Anki application — The local database of notes.
3. AnkiWeb — Anki's first-party note syncing service, which brings your notes to the browser and the Anki mobile app.

"Syncing" in Yanki is focused on going from 1 → 2, but when the "Push to AnkiWeb" option is enabled, Yanki will ask the Anki Desktop application to take care of syncing from 2 → 3. (Basically the equivalent of pushing the "Sync" button in the Anki Desktop app.)

This happens on a best-effort basis, since Yanki doesn't get any feedback on whether syncing forward to AnkiWeb worked or not, so your mileage may vary.

_Default: Enabled_

##### Sync media assets

Copy any images, videos, or audio file assets linked in your Obsidian notes to Anki's media asset library. This option allows your Obsidian media to appear in the Anki desktop application, and to sync to the Anki mobile app.

A "media asset" is any file referenced via the wiki-style `![[something.png]]` or `![markdown](style.png)` asset embedding syntax in your notes.

Internally, Yanki hashes assets before they're copied into Anki to make sure they're only copied as necessary. Yanki also takes care of cleaning up and unreferenced media assets automatically on every sync.

Options:

- **All**\
  Sync all media assets linked in your notes, including local and remote media links.

- **Local only** _(Default)_\
  Only sync assets from your vault's attachments directory or other local paths. This includes any assets linked with the `file:` protocol, and any `paths/to/local/assets.png` outside your Obsidian vault.

- **Remote only**\
  Only sync assets that are "hot-linked" via a remote URL. This includes any assets linked with the `http:` or `https:` protocols. other local path.

  _Note that syncing remote media assets can slow down the sync process, since each asset has to be downloaded. If you usually have access to the web where / when you're using Anki, syncing remote assets is probably not worth it._

- **None**\
  Don't sync any media assets. Any assets in your vault that are only available locally via a relative path _will not_ appear in the Anki desktop application and mobile app. Hot-linked remote assets _will_ appear assuming you have internet access while using Anki.

Note that the Anki desktop application and mobile apps are somewhat constrained in the types of media they can display. Please see the [document on file formats](https://github.com/kitschpatrol/yanki/blob/main/docs/file-formats.md) from the Yanki CLI tool repository for additional details, recommendations, and a full format compatibility matrix.

_Default: Local only_

#### Automatic note name settings

##### Automatic note names

When enabled, local note files will be renamed to match their content. This is useful if you want to have semantically reasonable note file names without the exertion of managing note titles yourself.

If the prompt or response has multiple lines, only the first line of text is considered.

The file renaming pass runs as part of every sync to Anki, and only affects notes inside a [watched folder](#watched-folder-list). Even if the Anki application is closed, attempting a sync will still update the local flashcard note file names, and modifying the content of a watched flashcard note will update its title immediately.

There are some great community plugins dedicated to content-driven file naming, like Rey Christian's [Auto Filename](https://github.com/rcsaquino/obsidian-auto-filename) plugin, but this feature is built into Yanki since the renaming process can be more precise when the structure of flashcard notes is understood.

_Default: Off_

##### Name mode

If [Automatic note names](#automatic-note-names) is enabled, this setting allows you to prioritize which part of the flashcard note should be used for the automatic note file name.

- **Prompt**\
  This option sets the note title to the first line of text Anki shows you during a review session — usually the front of the card.

- **Response**\
  This option sets the note title to the first line of text revealed in Anki after a tap or click — usually the back of the card, or the elided text of a cloze card, or the answer text of a type in the answer card.

For edge cases, like notes with empty prompt content or no response content, Yanki will fall back to the other parts of the card to try provide a semantically useful title for the note. If, after every effort, no reasonable title can be identified, then "Untitled" will be used as the note title.

Sanitization, truncation, and sequential numbering of duplicate note titles are all handled automatically by Yanki.

_Default: Prompt_

_(But note that the [Automatic note names](#automatic-note-names) toggle must be enabled for this to take effect.)_

##### Maximum note name length

Yanki will truncate long automatic file names with ellipses. This setting allows you to specify, in characters, how long of an automatic title you would like (exclusive of the truncation ellipses and file extension). Note that a (generous) upper limit is enforced to comply with operating system limitations.

_Default: 60 characters_

#### Anki-Connect settings

These are advanced settings to accommodate custom Anki-Connect configurations. The defaults are almost certainly fine.

Please see the [Anki-Connect documentation](https://foosoft.net/projects/anki-connect) for details on the Host and Key options.

#### Advanced settings

Toggle the advanced section to reveal options related to synchronization statistics and verbose logging.

## FAQ

### Why do I have to come up with a name for every note

You don't! Enable the [automatic note naming](#automatic-note-names) setting.

### Does Yanki work with Obsidian's mobile apps?

No, and it probably never will since it needs to communicate with a running instance of the Anki desktop app. (I suppose it's technically feasible with some network contortions, but that's not anything I'd wish on anyone.)

### Does Yanki work with Anki's mobile apps?

Yes, so long as you're syncing your notes to the mobile app through something like [AnkiWeb](https://ankiweb.net/about).

### Do I really have to have to launch Anki for syncing to work?

Yes, unfortunately. There are other ways to talk to the Anki database, but none are as robust as what's provided by [Anki-Connect](https://foosoft.net/projects/anki-connect/), which is where this requirement comes from.

_Note: The stand-alone [Yanki](https://github.com/kitschpatrol/yanki) CLI tool can automatically launch the Anki desktop application on-demand on macOS, but Obsidian's plug-in APIs prevent this from working correctly from inside Obsidian._

### Can I move cards in Obsidian?

Yes, as long as they stay within a folder registered in the Yanki plugin's settings, they will continue to sync. Yanki simply moves the cards to whatever deck reflects the new parent folder in Obsidian on the next sync.

### How many notes can I sync?

Hundreds, at least. Not sure of a practical upper limit yet, [let me know](https://github.com/kitschpatrol/yanki-obsidian/issues) if you hit one.

There's some room for optimization in the current sync implementation.

### How do I delete a note?

Just delete it from Obsidian, or move it to a folder that Yanki isn't set up to watch. It will be deleted from Anki on the next sync. (You can re-add it, but any review history associated with the cards in Anki will have been lost.)

### Can I edit notes in the Anki app?

No, Obsidian is the source of truth.

_Technically_ nothing's stopping you from making edits in Anki, but any changes to or deletions of Yanki-managed notes from inside the Anki desktop application or mobile app will be overwritten on the next sync.

### Can I embed images in my notes?

Yes — and sound, and video. See the [media asset syncing options](#sync-media-assets) for details.

### Can I create custom note types / models?

No, Yanki only supports the four note types described in the [Markdown note types](#markdown-note-types) section, which match the functionality of the default note types that ship with Anki.

If you need fancy note types and advanced templating, the [other Obsidian Anki plugins](#other-obsidian-anki-plugins) offer different trade-offs on the simplicity vs. flexibility continuum, and are likely to cover your desired use-case.

### Does Yanki take over my entire Anki library?

No, it only touches the notes it creates. However, it's recommended to avoid deck name collisions between your existing Anki notes and notes synced by Yanki. (Though even then Yanki should leave your existing notes alone.)

### What's the `noteId` property added to my Obsidian notes?

It's Anki's internal ID for the note, which is saved after the first sync.

### Can I delete the `noteId`?

Don't. If it goes missing, Yanki will consider the ID-less note in Anki to be an orphan, and it will be deleted on the next sync, and a new ID will be created. You won't lose your note, because it's safe in Obsidian, but you _will_ lose stats in Anki, so touch the `noteId` property at your own peril.

### Seeing `noteId` everywhere is annoying...

Shield your eyes with a [CSS snippet](https://help.obsidian.md/Extending+Obsidian/CSS+snippets):

```css
div.metadata-property[data-property-key='noteId'] {
  display: none;
}
```

### What happens if I duplicate a note that has a `noteId`?

Yanki will try to preserve the `noteId` of the note that matches what's been synced to Anki in the past, and will create new `noteId`s for the remaining duplicates. But this is a bit risky due to the limits of the content-matching algorithm, and is therefore not recommended.

### Can I add other properties?

Yes, add all the properties / markdown frontmatter you'd like, as long as it's valid YAML. Yanki will preserve and ignore all of it except for the `tags` and `noteId` fields.

### Can I sync my entire Obsidian vault to Anki?

Yes. Specify `/` as your watched folder path to sync an entire vault. In this case, Yanki will use the name of your vault's containing folder as the top-level deck name in Anki.

### If I use the [folder notes](https://github.com/LostPaul/obsidian-folder-notes) plugin, will my folder notes become Anki notes?

No. The Yanki plugin has a [settings option](#ignore-folder-notes) to ignore folder notes, which is enabled by default.

### I've installed Anki-Connect, but am still getting connection errors

If the automatic permission request fails, you might need to configure Anki-Connect to accept connections from Obsidian.

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

### Will `$SOME_FANCY_PLUGIN` work with Yanki?

It depends, if the plugin parses non-standard Markdown and renders complex or interactive HTML in your notes in Obsidian, then they it not translate correctly to Anki.

Under the hood, Yanki uses its own Markdown → HTML rendering pipeline, and its own CSS stylesheets, so what you see in Obsidian is not always exactly what you'll get in Anki. See the [supported Markdown features](#fancy-markdown) for a sense of what's possible.

## Privacy and security

### Network use

By default, the Yanki Obsidian plugin sends the content and linked media assets of any Obsidian notes in the [watched folders](#watched-folder-list) you've specified to the Anki desktop application via local loopback networking.

From there, both Anki and Obsidian may send this data on to other networks, such as the [AnkiWeb](https://ankiweb.net/about) synchronization service or [Obsidian Sync](https://obsidian.md/sync). Please see AnkiWeb's [terms](https://ankiweb.net/account/terms) and [privacy policy](https://ankiweb.net/account/privacy), and Obsidian's [terms](https://obsidian.md/terms) and [privacy policy](https://obsidian.md/privacy) for more details.

If ["remote" asset syncing](#sync-media-assets) is enabled, Yanki Obsidian will fetch the headers for any linked media URLs in your flashcard notes to detect changes.

Network communication is implemented with Obsidian's [request APIs](https://docs.obsidian.md/Reference/TypeScript+API/requestUrl).

### File access

Yanki Obsidian will only access files outside of your vault when they're explicitly linked as absolute paths inside your flashcard notes. It needs to access these files to check them for changes via a temporary content hash, and for asset syncing.

When [asset syncing](#sync-media-assets) syncing is enabled, the Yanki Obsidian plugin aggregates paths to any asset files linked in your flashcard notes — some of which could be absolute paths to files _outside_ of your local vault on your local filesystem, or links to files on remote servers. These paths and assets may be passed on to other networks, as described in the [Network use](#network-use) section.

File access is implemented with Obsidian's [vault APIs](https://docs.obsidian.md/Reference/TypeScript+API/Vault).

### Local logging

For debugging purposes, Yanki Obsidian maintains simple local counters of how many notes have been synced successfully. Yanki Obsidian doesn't send these statistics anywhere, and they are accessible to you in the [Advanced](#advanced-settings) section of the plugin's setting tab.

## The future

A few features are under consideration:

- [ ] Sync Anki's review statistics back to Obsidian.

- [ ] Optionally add a link back to the Obsidian source note on each card in Anki.

- [ ] Optionally render Markdown → HTML with Obsidian's pipeline + stylesheets.

If you have others in mind, feel free to [open an issue](https://github.com/kitschpatrol/yanki-obsidian/issues) with a suggestion.

- [ ] Nicer stylesheets / theming for notes in both Anki and Obsidian.

## Background

### Implementation notes

The Yanki Obsidian plugin is built on [`yanki`](https://github.com/kitschpatrol/yanki), a command line tool and TypeScript library that handles all the Markdown wrangling and communication with Anki. All functionality not specifically related to Obsidian is managed under the [`yanki`](https://github.com/kitschpatrol/yanki) project repository, including extensive automated tests and additional documentation.

If you want to sync Markdown like the Yanki plugin does from outside of Obsidian, the stand-alone [`yanki`](https://github.com/kitschpatrol/yanki) CLI tool and TypeScript library implements all of the same core features (plus a few extras). Using the `yanki` CLI tool directly will not interfere with syncing from the Yanki Obsidian plugin.

The [`yanki`](https://github.com/kitschpatrol/yanki) CLI tool and library is built on top of [`yanki-connect`](https://github.com/kitschpatrol/yanki-connect), which is a layer of TypeScript over the [Anki-Connect](https://foosoft.net/projects/anki-connect/) API.

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

## Acknowledgments

Thanks to Alex Yatskov for creating [Anki-Connect](https://foosoft.net/projects/anki-connect/).

PJ Eby's [Hot-Reload](https://github.com/pjeby/hot-reload) Obsidian plugin is a huge help during development.

Figuring out Obsidian's [AbstractInputSuggest](https://docs.obsidian.md/Reference/TypeScript+API/AbstractInputSuggest) class for the folder selection settings depended on examples in projects by [Daniel Rodríguez Rivero](https://github.com/danielo515) and [Liam Cain](https://github.com/liamcain).

<!-- contributing -->

## Contributing

[Issues](https://github.com/kitschpatrol/yanki-obsidian/issues) and pull requests are welcome.

<!-- /contributing -->

## License

[MIT](LICENSE) © Eric Mika