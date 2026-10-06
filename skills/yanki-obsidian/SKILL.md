---
name: yanki-obsidian
description: Create and edit Markdown flashcards in an Obsidian vault and sync them to Anki with the Yanki plugin. Use when turning study material into Yanki cards, choosing card syntax, or troubleshooting the plugin's watched folders, links, media, and synchronization. For standalone CLI or library workflows, use yanki; for direct AnkiConnect API access, use yanki-connect.
license: MIT
---

# Yanki Obsidian

Yanki syncs Markdown notes from selected folders in an Obsidian vault to Anki. Each file is one Anki note; reversed and cloze notes can generate multiple cards. Markdown structure determines the note type, and folders determine the deck hierarchy. Obsidian Markdown is the source of truth.

## Choose the right project

| Project                                                          | When to use it                                                                                                                                                                                                                |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `yanki-obsidian`                                                 | Author flashcards in an Obsidian vault and use the Yanki plugin's settings and commands to sync them. Follow this skill for card syntax and vault behavior.                                                                   |
| [`yanki`](https://github.com/kitschpatrol/yanki)                 | Sync Markdown folders outside Obsidian with the CLI, or embed Markdown conversion and synchronization in a JavaScript or TypeScript application. It provides the underlying card syntax and sync engine.                      |
| [`yanki-connect`](https://github.com/kitschpatrol/yanki-connect) | Query Anki notes, manage decks or custom note models, change scheduling, or build an integration through a typed AnkiConnect API client. It provides direct API access without Markdown conversion or folder synchronization. |

For an existing Obsidian workflow, edit the source files and use the plugin's sync command. Do not introduce a separate CLI sync for the same notes. Direct changes to Yanki-managed note content through Anki or `yanki-connect` can be overwritten on the next plugin sync.

## Work in the vault

Inspect the user's existing flashcard notes and Yanki settings before creating files. Follow their watched folders, naming conventions, tags, and attachment locations. The plugin ID is `yanki`; its settings normally live at `<vault>/.obsidian/plugins/yanki/data.json`, though Obsidian's configuration directory can be customized. Relevant settings include `folders`, `ignoreFolderNotes`, `namespace`, `sync`, and `manageFilenames`.

- Create one `.md` file per Anki note inside an already watched folder or its subfolders. Every Markdown file there is eligible for sync; a special tag is not required. Keep source articles, indexes, and other supporting documents outside watched folders unless they should also become flashcards.
- **Ignore folder notes** is enabled by default: a file whose basename matches its parent folder, such as `Biology/Biology.md`, is skipped. Avoid this filename pattern for cards unless the user has disabled that setting.
- Write a descriptive filename, but include all context needed to answer the card in its body: filenames are not automatically displayed on cards. Respect **Automatic note names** if configured; the plugin may rename files from their prompt or response.
- Choose decks through folders. Do not invent `deck`, `deckName`, or `type` properties: Yanki reads `tags` and `noteId` and ignores other frontmatter for card configuration.
- Folder hierarchy becomes deck hierarchy, but a watched parent folder containing only subfolders can be omitted from deck names. Adding a note directly to that parent can introduce it as a parent deck. See the README's [watched folder examples](https://github.com/kitschpatrol/yanki-obsidian#watched-folder-list) before reorganizing an existing collection.

When converting study material, make each prompt test a specific fact or relationship. Include enough context for it to stand alone, keep the expected answer concise, and put explanations and source links on the back. Use reversed cards only when both directions are useful and unambiguous. Preserve the source's meaning and uncertainty. Create separate files for separate questions; multiple separators in one file do not create multiple Anki notes.

## Author cards

The fenced examples below are file contents. Omit the surrounding code fences when writing actual notes. Do not add labels such as `Front:` or `Back:` unless they should appear on the card.

### Basic: one question and answer

Separate the front and back with a horizontal rule. Leave blank lines around `---` so Markdown parses it as a rule rather than a heading underline.

```md
What is the capital of France?

---

Paris.
```

### Reversed: two directions from one note

Use two consecutive horizontal rules, separated by a blank line, to generate two cards with the front and back exchanged. An optional third rule separates extra information shown on the answer side of both cards.

```md
The chemical symbol for oxygen

---

---

O

---

Chemical symbols are case-sensitive.
```

### Type in the answer: final emphasis

Put the answer in the final emphasis span, with a visible prompt before it. Keep the answer plain text inside `_..._`. There must be no horizontal rule in the body and no visible content after the answer. YAML frontmatter delimiters are fine.

```md
What is the chemical symbol for oxygen?

_O_
```

### Cloze: strike through the answer

Use `~~...~~` around the text to hide. An optional final `_emphasis_` inside the strike-through provides a hint. A horizontal rule separates optional back-of-card information.

```md
The capital of France is ~~Paris _city_~~.

---

Paris is on the Seine.
```

Each cloze receives a successive number and creates its own card by default:

```md
~~Paris~~ is the capital of ~~France~~.
```

To hide multiple answers on the same card, prefix them with the same explicit one- or two-digit number:

```md
~~1 Paris~~ is the capital of ~~1 France~~.
```

Use distinct explicit numbers when separate cards need stable identities during later edits. Preserve existing explicit numbers: deleting or reordering implicitly numbered clozes can associate study progress with a different answer. Removing a cloze can leave an empty card in Anki; remove those with Anki's **Tools → Empty Cards** command.

Clozes must occur before the first horizontal rule. They can contain inline formatting, images, or math, but cannot span multiple lines or block elements. A leading number can be interpreted as a cloze number; to hide an answer such as “12 months,” write `~~1 12 months~~`.

### Avoid accidental note types

- Strike-through before the first horizontal rule selects Cloze, even when other type cues are present. Use it intentionally.
- Without a horizontal rule, a final emphasis span with other visible text selects type-in-the-answer. Trailing italic text can therefore change the inferred type.
- A Basic note uses the first horizontal rule as the front/back split. Extra rules do not create additional notes in the same file.
- Plain Markdown without a type cue falls back to Basic with an empty-answer placeholder. Include an explicit answer when creating question-and-answer cards.
- Use Yanki's Markdown syntax rather than native Anki `{{c1::answer}}` markup; mixing them can produce invalid notes. Syntax from other Obsidian flashcard plugins is not a substitute for these formats.

## Supported Markdown in Obsidian cards

Yanki uses its own Markdown renderer, so an Obsidian preview is not an exact preview of the Anki card. Standard Markdown and these extensions are supported; horizontal rules, final emphasis, and strike-through still carry the note-type meanings above.

| Feature                  | Syntax and behavior                                                                                                                                                                                                                                                                                     |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Structure                | Headings such as `## Heading`, paragraphs, ordered and unordered lists, nested lists, and `> blockquotes`.                                                                                                                                                                                              |
| Inline formatting        | `**bold**`, `*italic*` or `_italic_`, and inline code in backticks. Use `~~answer~~` intentionally for clozes; a single `~` does not create strike-through.                                                                                                                                             |
| GitHub Flavored Markdown | Pipe tables with a header separator row, task lists such as `- [x] Done`, and automatic links for bare web URLs and email addresses.                                                                                                                                                                    |
| Code blocks              | Fenced and indented code blocks. Add a language such as `typescript`, `python`, `bash`, or `json` for Shiki syntax highlighting. Unspecified and unsupported languages render as plain code.                                                                                                            |
| Math                     | Inline `$x^2$`, display math with `$$` on separate opening and closing lines, and fenced blocks with the `math` language. Yanki converts these for Anki's built-in MathJax renderer.                                                                                                                    |
| Highlights               | `==important text==`.                                                                                                                                                                                                                                                                                   |
| GitHub alerts            | A blockquote beginning with `> [!NOTE]`, `> [!TIP]`, `> [!IMPORTANT]`, `> [!WARNING]`, or `> [!CAUTION]`, with the message on subsequent `>` lines.                                                                                                                                                     |
| Ruby / furigana          | DenDen syntax such as `{東京\|とうきょう}` adds a reading above the base text.                                                                                                                                                                                                                          |
| Links                    | `[Label](https://example.com)`, `[Label](<path with spaces.md>)`, `[[Note name]]`, and `[[Note name\|Label]]`. Wiki links can include heading anchors (`[[Note#Heading]]`) or block anchors (`[[Note#^abc123]]`). Resolved vault links become `obsidian://` links back to Obsidian, preserving anchors. |
| Media embeds             | `![Diagram](./assets/diagram.png)` or `![[diagram.png]]`. The same syntax supports audio and video, such as `![[audio.mp3]]`. Wiki embeds can specify size: `![[diagram.png\|300]]` or `![[diagram.png\|300x200]]`.                                                                                     |
| HTML                     | Raw HTML is supported, including inline formatting such as `<sup>2</sup>`. Prefer Markdown or wiki syntax for links and images so they participate in normal path resolution.                                                                                                                           |

The plugin follows the vault's **Strict line breaks** setting. When enabled, single newlines inside paragraphs are soft breaks; when disabled, they become visible line breaks. Blank lines separate paragraphs. Two trailing spaces or a backslash before a newline create an explicit hard line break.

Keep these limits in mind when adapting existing vault content:

- `![[Some note]]`, `![[Some note#Heading]]`, and PDF embeds become links; they do not insert the note text or PDF pages into the card. Copy the necessary context into the flashcard and add a source link when useful.
- Mermaid fences render as plain code, not diagrams. Features rendered by other plugins, such as Dataview queries, are not automatically rendered by Yanki. Use the supported alert syntax rather than assuming every Obsidian callout variant works.
- Body text such as `#topic` does not create an Anki tag. Put tags in properties / YAML frontmatter.

## Properties and media

Tags are optional YAML frontmatter at the start of the file:

```md
---
tags:
  - geography/capitals
  - review
---

What is the capital of France?

---

Paris.

Source: [[Geography#France]]
```

Use string values for tags. `/` becomes Anki's `::` hierarchy separator; `::` is also accepted directly. Frontmatter is not displayed on the card.

For new notes, omit `noteId`; Yanki writes the numeric Anki ID after syncing. Preserve existing IDs and unrelated properties when editing. When duplicating a file to create a different note, remove the copied `noteId` before it can sync. Deleting an existing ID or recreating a note can lose its review history.

Use existing attachment locations and verify that wiki links or relative paths resolve from each card. **Sync media assets** defaults to **Local only**, copying local images, audio, and video into Anki's media library. **All** also copies remote assets, **Remote only** copies only remote assets, and **None** leaves local-only attachments unavailable in Anki. Choose formats supported by the user's Anki clients; JPEG, PNG, or SVG images, MP3 audio, and MP4 or GIF video are broadly compatible choices.

## Set up and sync

For a new setup, install and enable **Yanki** from Obsidian's community plugins browser. Install the **AnkiConnect** add-on in Anki desktop (code `2055492159`), restart Anki, and keep it running for synchronization. Add the intended flashcard folders in **Settings → Yanki → Anki flashcard folders**, or use **Add to Yanki** from a folder's context menu. Folder watching is recursive; `/` selects the whole vault, so use it only when every eligible note should become a flashcard.

The plugin syncs from Obsidian desktop. Cards can be studied in Anki's mobile apps after syncing onward through AnkiWeb. Authoring the Markdown itself does not require a running Anki connection.

When synchronization is part of the user's request, run **Yanki: Sync flashcard notes to Anki** from Obsidian's command palette, or use **Sync now** in Yanki's settings. If an available Obsidian integration accepts command IDs, the command is `yanki:sync`. If you cannot operate Obsidian, report the files created or edited and give the user this command; do not claim that a sync occurred. Drafting cards alone does not require a sync.

Before syncing or changing the folder layout, account for the existing configuration:

- A sync processes the full set of watched folders. Removing a watched folder, deleting a note, or moving it outside the watched folders deletes the corresponding Anki note and its review history on the next sync. Moving it within the watched collection can move its cards between decks. Keep all cards generated by one note in the same deck.
- Preserve the saved **Namespace**. Its default is `Yanki Obsidian - Vault ID <vault ID>`, stored when the plugin first runs. It separates this vault's managed notes from other vaults and CLI collections. Namespace changes are a migration task, not routine card authoring; see the README's [namespace guidance](https://github.com/kitschpatrol/yanki-obsidian#namespace) when a migration is requested.
- **Automatic sync** is disabled by default. If enabled, file edits and moves can trigger synchronization without a manual command. Prepare complete card contents before writing into watched folders, and avoid temporarily deleting or moving existing cards out of them.
- **Push to AnkiWeb** is enabled by default. Follow the user's configured workflow when syncing.
- **Automatic note names** defaults to **Off** and is incompatible with Obsidian Sync. Do not enable it for a vault using Obsidian Sync.

For a missing card, check the watched path and **Ignore folder notes** first. For an unexpected card type, check the Markdown cues above. For connection errors, verify that Anki desktop is running with AnkiConnect enabled and that the plugin's host, port, and key match. The default port is `8765`; AnkiConnect may request permission for Obsidian on first use. If needed, follow the README's [connection troubleshooting](https://github.com/kitschpatrol/yanki-obsidian#ive-installed-ankiconnect-but-am-still-getting-connection-errors).

## Further information

See the [Yanki Obsidian README](https://github.com/kitschpatrol/yanki-obsidian#readme) for plugin installation, the full settings reference, deck hierarchy examples, the demo vault, compatibility requirements, and troubleshooting.
