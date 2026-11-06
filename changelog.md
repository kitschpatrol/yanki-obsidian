# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

(Node.js support requirements have sometimes increased in minor or patch releases.)

## [1.14.2] - 2026-11-02

### Documentation

- Correct a typo in the contributor guide.

### Maintenance

- Refresh Yanki, shared configuration, build and test dependencies, and workflow actions; replace the standalone skill-sync preparation script with pnpm-managed skills.
- Fix desktop-test CI by disabling Vitest's problematic filesystem module cache and preventing user-level Python resolver cutoffs from invalidating the test lockfile.

## [1.14.1] - 2026-10-16

### Fixed

- Resolve filtered-deck errors with the AnkiConnect 26.x add-on.
- Report AnkiConnect HTTP errors as synchronization errors instead of incorrectly treating Anki as unreachable.

### Documentation

- Correct the recommended AnkiConnect version to 26.10.14.0 or newer and describe media synchronization test coverage.

### Maintenance

- Add end-to-end media-upload and connection-error tests, improve synchronization test waits, and standardize dependency-update pull-request titles.

## [1.14.0] - 2026-10-14

### Fixed

- Restore compatibility with the AnkiConnect 26.x add-on and Anki 26.9.3.

### Documentation

- Update recommended Anki and AnkiConnect versions, clarify older-version compatibility, and correct connection configuration guidance.

### Maintenance

- Refresh dependencies and CI actions, align builds with Node.js 22, update desktop test fixtures to Anki 26.9.3, and run dependency-update automation monthly.

## [1.13.0] - 2026-10-06

### Added

- Provide an installable agent skill for authoring Markdown flashcards and using Yanki's Obsidian synchronization workflow.

### Documentation

- Document agent-skill installation and its supported authoring and troubleshooting workflows.
- Correct troubleshooting guidance to require both Obsidian app and installer versions 1.9.12 or newer.

### Maintenance

- Add scheduled dependency-update pull-request automation.
- Refresh Yanki and development dependencies, update contributor runtime ranges, integrate skill synchronization, and mark the package private.

## [1.12.2] - 2026-09-15

### Documentation

- Explain how an outdated Obsidian installer can cause synchronization TypeErrors and add installer-update guidance to error notices.
- Document desktop test setup, commands, isolation, diagnostics, and supported Obsidian runtime combinations.

### Maintenance

- Add automated tests using real Obsidian and Anki, with Linux, macOS, and Windows CI covering minimum and latest supported Obsidian apps.
- Upgrade to Yanki 3 and Vitest 5, refresh development dependencies, and separate bundle building from type checking for desktop tests.

## [1.12.1] - 2026-08-28

### Fixed

- Resolve media-asset hash collisions through an updated Yanki dependency.

### Maintenance

- Refresh development dependencies and workflow actions and improve website sitemap discovery and link-check configuration.

## [1.12.0] - 2026-08-02

### Added

- Make Yanki settings searchable through Obsidian 1.13's declarative settings system while retaining the legacy settings interface.

### Fixed

- Keep folder settings and note counts current across settings refreshes and save focused-input edits when the settings panel closes.

### Documentation

- Correct links to Obsidian help, the demo vault, and alternative plugins.

### Maintenance

- Add scheduled and pull-request link checking for repository documentation and the configured website.
- Refresh Yanki and development dependencies and replace deprecated settings-button API usage.

## [1.11.10] - 2026-07-21

### Fixed

- Correct links to notes with slashes in their names.

### Maintenance

- Refresh shared configuration and TypeScript execution tooling and remove the temporary pnpm lockfile-helper override.

## [1.11.9] - 2026-07-19

### Fixed

- Correct links to notes whose filenames contain `?`.

### Maintenance

- Pin the pnpm lockfile helper to avoid an incompletely published version breaking contributor tooling.

## [1.11.8] - 2026-07-16

### Maintenance

- Simplify release automation, verify that release tags belong to main, and pin release actions.

## [1.11.7] - 2026-07-16

### Changed

- **Breaking:** Rename the synchronization command ID from `yanki:sync-yanki-obsidian` to `yanki:sync`; existing custom hotkeys must be rebound.

## [1.11.6] - 2026-07-16

### Fixed

- Handle AnkiConnect configurations using port 80 or 443 correctly.
- Keep synchronization-statistics columns within the available settings width.

### Maintenance

- Refresh development dependencies and CI actions and simplify TypeScript project configuration.

## [1.11.5] - 2026-07-12

### Maintenance

- Exclude the unused `open` package from the distributed plugin bundle for Obsidian's automated plugin review.
- Refresh shared configuration and development dependencies and adapt source code to stricter type checks.

## [1.11.4] - 2026-07-08

### Changed

- **Breaking:** Require Obsidian 1.9.12 or newer.

### Documentation

- Add a contributing guide covering issue reports, pull requests, development setup, and code standards.
- Explain incompatibility with native Anki syntax and availability of older plugin releases for older Obsidian versions; correct FAQ wording.

### Maintenance

- Refresh Yanki and development dependencies, migrate through shared-config 8 and TypeScript 6, and update contributor runtimes and CI actions.

## [1.11.3] - 2026-05-12

### Changed

- Reduce the distributed bundle size by limiting built-in syntax-highlighting languages.
- Distribute individual plugin files in GitHub releases without ZIP archives or `versions.json` downloads.

### Documentation

- Update community-plugin installation links and standardize AnkiConnect naming in documentation and settings help.

### Maintenance

- Add build-provenance attestations for release artifacts.
- Add Obsidian-specific lint checks and explicit development dependencies, refine callback and helper types, and override a vulnerable contributor dependency.

## [1.11.2] - 2026-05-11

### Fixed

- Handle `}}` characters inside clozed MathJax expressions correctly.

### Documentation

- Update license links and contribution guidance in the README.

### Maintenance

- Harden the release workflow with pinned actions, disabled credential persistence, and frozen dependency installation.
- Refresh dependencies and use shx for portable build, development, cleanup, and deployment scripts.

## [1.11.1] - 2026-04-06

### Fixed

- Handle numeric values in frontmatter tags without synchronization errors.

### Maintenance

- Add build and lint CI across Linux, macOS, and Windows.
- Refresh development dependencies and contributor runtime requirements, enforce LF line endings, and harden repository-metadata workflow permissions.

## [1.11.0] - 2026-03-05

### Added

- Add file-explorer context menu actions to add or remove folders from Yanki's watched-folder list.

### Documentation

- Explain recursive folder selection, context menu actions, and the Basic-note fallback for ambiguous Markdown structure.

## [1.10.1] - 2026-03-01

### Fixed

- Match watched-folder rename paths on directory boundaries instead of matching similarly prefixed folder names.

### Documentation

- Correct block-link and remote-media wording in the README.

### Maintenance

- Refresh Yanki and shared configuration, update metadata actions, simplify lint exceptions, and use standard JavaScript for folder suggestions.

## [1.10.0] - 2026-02-19

### Changed

- **Breaking:** Require Obsidian 1.6.5 or newer.

### Documentation

- Update the documented Obsidian compatibility requirement.

### Maintenance

- Upgrade to Yanki 2, refresh dependencies, align build and contributor requirements with Node.js 20, and include plugin-version compatibility metadata in builds.

## [1.9.6] - 2026-01-20

### Maintenance

- Refresh Yanki, pnpm, shared configuration, build tools, and development dependencies.

## [1.9.5] - 2025-12-08

### Maintenance

- Refresh Yanki and development dependencies and fix pnpm hoisting for shared configuration tools.

## [1.9.4] - 2025-11-25

### Documentation

- Document support for wiki links targeting Obsidian headings and blocks.

### Maintenance

- Refresh Yanki, pnpm, shared configuration, and cleanup tooling and pin Obsidian typings.

## [1.9.3] - 2025-11-04

### Documentation

- Warn in the README and settings that automatic note naming is incompatible with Obsidian Sync.

### Maintenance

- Refresh Yanki, pnpm, shared configuration, and build dependencies and pin the Obsidian type dependency.

## [1.9.2] - 2025-10-24

### Fixed

- Correct automatic filenames generated from Cloze responses.

## [1.9.1] - 2025-10-23

### Fixed

- Correct cloze processing through an updated Yanki dependency.

### Documentation

- Correct filtered-deck wording in the FAQ.

## [1.9.0] - 2025-10-21

### Added

- Offer Off, On Sync, and On Change automatic-renaming modes, preserving existing enabled settings during migration.

### Documentation

- Explain automatic-renaming triggers and update the naming-settings reference.

### Maintenance

- Update Yanki and pnpm.

## [1.8.1] - 2025-10-18

### Documentation

- Add Linux Flatpak media troubleshooting, including network permissions and read-only vault access through Flatseal.

### Maintenance

- Refresh Yanki, pnpm, Obsidian typings, and development dependencies.

## [1.8.0] - 2025-09-30

### Added

- Allow synchronization to coexist with manually created Anki filtered decks.

### Changed

- Compare tags without regard to their order during synchronization.

### Documentation

- Document filtered-deck support and warn against splitting cards from one managed note across multiple decks.

### Maintenance

- Refresh development dependencies and switch lint and fix scripts to the renamed ksc CLI.

## [1.7.0] - 2025-09-06

### Added

- Enable automatic Anki database checks to clean up after note-type changes.

### Documentation

- Explain empty cards after cloze removal, review-history implications of renumbering, and caveats when changing note types.

### Maintenance

- Refresh development type definitions and the Mermaid override.

## [1.6.19] - 2025-09-01

### Maintenance

- Refresh Yanki, TypeScript, and shared configuration, override Mermaid for contributor dependency security alerts, and migrate dependency build permissions to workspace configuration.

## [1.6.18] - 2025-08-31

### Changed

- Delay automatic filename updates briefly after note edits, while keeping manually requested renaming immediate.

### Fixed

- Recognize note changes when the vault root is a watched folder.
- Deduplicate notes collected from overlapping watched folders.

### Documentation

- Describe the automatic-renaming delay and clarify link-update behavior.

### Maintenance

- Update Obsidian typings and TypeScript execution tooling.

## [1.6.17] - 2025-08-20

### Maintenance

- Update the Yanki dependency to 1.0.1.

## [1.6.16] - 2025-08-20

### Maintenance

- Upgrade Yanki to 1.0 and refresh pnpm and development dependencies.

## [1.6.15] - 2025-07-12

### Documentation

- Correct the example default namespace to `Yanki Obsidian - Vault ID $YOUR_VAULT_ID`.

### Maintenance

- Refresh pnpm, shared configuration, and development dependencies.

## [1.6.14] - 2025-06-10

### Fixed

- Treat tags as case-insensitive during synchronization.

### Maintenance

- Refresh development dependencies and simplify repository metadata synchronization with the updated action.

## [1.6.13] - 2025-06-02

### Maintenance

- Update Yanki to 0.18.16, refresh development dependencies, and adjust source lint annotations.

## [1.6.12] - 2025-05-08

### Documentation

- Document Linux Flatpak problems affecting Obsidian links and media, with official Anki installation and URI registration guidance.

### Maintenance

- Refresh Yanki and development dependencies.

## [1.6.11] - 2025-04-28

### Fixed

- Correct media synchronization during note updates and include assets referenced in the Extra field.

### Maintenance

- Generate manifests within the build process, build during release versioning, and refresh development dependencies.

## [1.6.10] - 2025-04-24

### Maintenance

- Refresh Yanki, pnpm, TypeScript, and development dependencies and update allowed dependency build scripts.

## [1.6.9] - 2025-03-30

### Fixed

- Update links to flashcard notes when automatic naming renames their files.
- Prevent folder-search controls from stealing focus when settings counts refresh.

### Documentation

- Explain automatic link updates and their dependence on Obsidian's link-update settings.

### Maintenance

- Refresh dependencies, declare an explicit Obsidian type requirement, and rebuild and copy the development plugin into the demo vault with Hot Reload support.

## [1.6.8] - 2025-03-25

### Fixed

- Preserve wiki-link labels inside Markdown tables.

## [1.6.7] - 2025-03-24

### Fixed

- Correct a cloze-numbering edge case through an updated Yanki dependency.

### Maintenance

- Update Node.js and utility type dependencies.

## [1.6.6] - 2025-03-22

### Changed

- Withdraw the planned removal of automatic synchronization while retaining its advanced setting and cautionary guidance.

### Fixed

- Prevent an edge case that creates duplicate Anki notes.

### Documentation

- Update AnkiConnect links, rename the example to Yanki Demo Vault, and correct README instructions and syntax descriptions.

### Maintenance

- Refresh dependencies, correct repository metadata, and update development scripts for the renamed demo vault.

## [1.6.5] - 2025-03-02

### Documentation

- Correct synchronization-statistics and automatic-sync wording in the README.

### Maintenance

- Migrate to shared-config 5 and pnpm 10, refresh dependencies, and align contributor and build configuration with Node.js 18.15.

## [1.6.4] - 2025-02-04

### Fixed

- Resolve a synchronization error through an updated Yanki dependency.

## [1.6.3] - 2025-02-03

### Fixed

- Correct automatic filenames generated from Cloze responses.

### Documentation

- Explain how to create an otherwise noteless parent deck using a suspended placeholder card.

### Maintenance

- Refresh pnpm, release tooling, and Obsidian type dependencies.

## [1.6.2] - 2025-01-22

### Documentation

- Correct README admonition formatting and automatic-sync deprecation wording.

### Maintenance

- Refresh Yanki, pnpm, and development dependencies.

## [1.6.1] - 2024-12-23

### Fixed

- Handle absent or incomplete saved settings during migration so fresh installations load successfully.

## [1.6.0] - 2024-12-23

### Added

- Expose the synchronization namespace in advanced settings and persist it for vault migrations and synchronization across installations.
- Recover missing note IDs by matching unchanged Markdown content to previously synchronized Anki notes.

### Deprecated

- Deprecate automatic synchronization, move its control to advanced settings, and announce possible removal in a future major release.

### Fixed

- Escape regular-expression characters in vault paths before converting absolute file paths.
- Restore the intended minimum Obsidian requirement of 1.5.0.

### Documentation

- Document namespaces, vault migration, shared settings, missing-ID recovery, and automatic-sync risks.

### Maintenance

- Refresh Yanki and development dependencies, migrate synchronization statistics, and update demo-vault configuration and metadata workflow naming.

## [1.5.1] - 2024-11-19

### Changed

- **Breaking:** Raise the minimum Obsidian version declared in the plugin manifest to 1.5.1.

### Fixed

- Resolve a tag-related synchronization issue through an updated Yanki dependency.

### Documentation

- Add download statistics and guidance for submitting focused bug reports with a reproducible vault.

### Maintenance

- Refresh pnpm and development dependencies.

## [1.5.0] - 2024-09-19

### Added

- Support DenDen Markdown furigana and ruby annotation syntax.

### Documentation

- Add furigana examples and explain the project's Markdown portability goals and rendering tradeoffs.

## [1.4.4] - 2024-09-15

### Documentation

- Explain how notes and otherwise empty parent folders determine Anki deck hierarchies.
- Clarify Android compatibility and the risks of editing Yanki-managed note models, and add another tutorial video.

### Maintenance

- Refresh Yanki and development dependencies, refine repository scripts, and update plugin author metadata.

## [1.4.3] - 2024-09-02

### Documentation

- Add a demo-vault example explaining Unicode normalization and Anki's text representation.

### Maintenance

- Update the Yanki dependency to 0.15.1.

## [1.4.2] - 2024-08-30

### Fixed

- Respect Obsidian's Strict line breaks editor setting when rendering notes.

### Maintenance

- Add Obsidian type augmentations for settings and internal API access.

## [1.4.1] - 2024-08-29

### Fixed

- Correct synchronization of notes containing block-embedding wiki links.

### Documentation

- Clarify managed note types, add an embedded-block example, and expand tutorial-video links.

### Maintenance

- Refresh development dependencies and add scripts for switching between local and published Yanki dependencies.

## [1.4.0] - 2024-08-15

### Added

- Allow optional extra content on the answer side of both cards generated from a reversed note.

### Fixed

- Correct note-type inference for notes containing many thematic breaks.

### Documentation

- Add advanced examples for reversed-card extra content and explicit cloze numbering.

### Maintenance

- Update pnpm.

## [1.3.0] - 2024-08-14

### Added

- Support explicit one- or two-digit cloze numbering to group multiple deletions on the same card.

### Documentation

- Document manual cloze numbering with README and demo-vault examples and link Mandarin-language tutorial videos.

### Maintenance

- Update the release-version tooling dependency.

## [1.2.1] - 2024-08-11

### Fixed

- Fix a regression in mathematical-expression rendering on Anki Mobile.

### Documentation

- Update the feature reference to describe autolinks and Anki's native MathJax rendering.

## [1.2.0] - 2024-08-11

### Added

- Support GitHub Flavored Markdown autolinks.

### Changed

- Use Anki's native MathJax rendering for mathematical expressions.

### Fixed

- Resolve model-not-found synchronization errors.

### Documentation

- Correct the automatic synchronization description.

### Maintenance

- Refresh pnpm and development dependencies.

## [1.1.1] - 2024-08-03

### Changed

- Include unsuccessful rename attempts in verbose notices.

### Fixed

- Preserve HTML markup embedded in Obsidian notes.

### Documentation

- Correct the README to state that GFM autolinks are not yet supported.

### Maintenance

- Refresh pnpm and development dependencies and declare the HTML entities dependency.

## [1.1.0] - 2024-08-01

### Added

- Resolve wiki links against files throughout the vault.
- Support storing linked PDF and Markdown assets in Anki.

### Changed

- Improve file-error handling during synchronization.

### Fixed

- Allow Rename now to work with automatic renaming disabled and report when no eligible notes exist.
- Handle invalid AnkiConnect host and port input without using an unsuccessful parse result.

### Documentation

- Expand the demo vault with working links and media examples and document tested desktop platforms.

## [1.0.6] - 2024-07-21

### Fixed

- Restore correct spacing in notification text.

### Documentation

- Configure the example collection as an Obsidian demo vault and correct README wording.

### Maintenance

- Point development plugin-linking scripts at the bundled demo vault and include Hot Reload for development.

## [1.0.5] - 2024-07-21

### Fixed

- Suppress a Markdown markline error through an updated Yanki dependency.

### Documentation

- Correct plugin installation links and synchronization wording, and explain limitations when other plugins render custom Markdown.

### Maintenance

- Refresh development dependencies and revise internal HTML template formatting.

## [1.0.4] - 2024-07-09

### Documentation

- Document installation through Obsidian's community plugin browser and correct the Markdown note-type guide link.

## [1.0.3] - 2024-07-09

### Documentation

- Rename `readme.md` to `README.md` so Obsidian detects the plugin documentation.

## [1.0.2] - 2024-07-09

### Documentation

- Rename the license file to `LICENSE` and correct its README link.

### Maintenance

- Adjust lint exclusions for uppercase README and license filenames.

## [1.0.1] - 2024-07-09

### Documentation

- Expand usage guidance for note types, media compatibility, automatic naming, mobile study, advanced settings, and AnkiConnect troubleshooting.

### Maintenance

- Refresh Yanki and development dependencies, require pnpm 9 for contributors, and refine cleanup scripts.

## [1.0.0] - 2024-06-26

### Changed

- **Breaking:** Change the Obsidian plugin ID from `yanki-obsidian` to `yanki`.

### Fixed

- Normalize watched-folder paths and reject blank folder entries before normalization.
- Restrict flashcard synchronization to Markdown files.
- Correct vault-path normalization and media synchronization on Windows.
- Restore the no-notes-found notice and correct local note counts in synchronization reports.

### Documentation

- Add an example vault and banner, revise the README, and correct the documented automatic-sync default.

### Maintenance

- Improve Windows compatibility of repository scripts with rimraf and declare TypeScript explicitly.

## [0.8.2] - 2024-06-25

### Fixed

- Allow synchronization with the local Anki database while offline.

## [0.8.1] - 2024-06-25

### Added

- Support selecting the vault root for synchronization.
- Add a reset-all-settings control and a toggle that reveals development diagnostics.

### Changed

- Enable onward synchronization to AnkiWeb by default.

### Documentation

- Document network use, file access, local diagnostic logging, and supported media synchronization.

### Maintenance

- Refactor synchronization adapters and settings organization.

## [0.8.0] - 2024-06-25

### Added

- Synchronize embedded images, audio, and video to Anki, with local, remote, combined, or disabled modes and automatic cleanup of unused media.

### Changed

- Disable automatic synchronization and AnkiWeb uploads by default in the reorganized synchronization settings.

### Fixed

- Trigger synchronization when folder-note exclusions change.

### Documentation

- Document media synchronization modes and cleanup, and distinguish Anki notes from cards in synchronization notices.

### Maintenance

- Adapt file and network integrations to the updated Yanki interfaces and refresh development dependencies.

## [0.7.1] - 2024-06-19

### Fixed

- Correct synchronization of cards whose fronts contain only MathJax expressions.

### Maintenance

- Update Node.js type definitions.

## [0.7.0] - 2024-06-19

### Changed

- Preserve existing Anki notes when changing their note model through an updated Yanki synchronization engine.

### Documentation

- Explain automatic synchronization and improve manual-sync instructions and reset notices.

### Maintenance

- Update Node.js type definitions.

## [0.6.0] - 2024-06-18

### Added

- Add a Rename now button for updating note filenames from settings.

### Changed

- Separate the automatic-renaming toggle from prompt/response selection and apply naming-setting changes without an unnecessary Anki synchronization.

### Fixed

- Treat the first manual synchronization as user-initiated and execute it without delay.
- Preserve the settings panel's scroll position when controls refresh.

### Documentation

- Update automatic-naming instructions and clarify synchronization, renaming, and reset notices.

### Maintenance

- Refresh Yanki, pnpm, and development dependencies.

## [0.5.0] - 2024-06-16

### Changed

- Update automatic note names immediately after content edits while delaying Anki synchronization by four seconds.

### Fixed

- Detect deleted notes even when Obsidian no longer provides their parent-folder reference.

### Maintenance

- Update Yanki and shared development configuration.

## [0.4.0] - 2024-06-14

### Changed

- Stop displaying a separate notice for every automatically renamed file.

### Fixed

- Allow automatic note filenames to update when Anki is closed and report unreachable Anki connections through synchronization results.
- Trigger synchronization after changes to AnkiWeb and automatic filename settings.

### Documentation

- Revise AnkiConnect setup guidance and explain filename updates while Anki is closed.

### Maintenance

- Update Yanki and remove the unused throttling dependency.

## [0.3.0] - 2024-06-13

### Added

- Automatically derive note filenames from their prompt or response, with configurable maximum length, sanitization, truncation, and duplicate-name handling.

### Changed

- Reduce the automatic synchronization delay from four seconds to 2.5 seconds.

### Documentation

- Document automatic note naming, naming modes, fallback behavior, and filename-length settings.

### Maintenance

- Update Yanki and the TypeScript execution tooling.

## [0.2.4] - 2024-06-13

### Changed

- Send AnkiConnect requests through Obsidian's request API and recognize connection-refused errors in synchronization notices.

### Fixed

- Remove surplus whitespace from HTML used in settings and notices.

### Maintenance

- Update Yanki, remove the external HTML template helper, and consolidate lint configuration.

## [0.2.3] - 2024-06-12

### Changed

- Right-align settings button annotations and adjust description widths for readability.

### Documentation

- Add a README table of contents and contextual documentation links throughout settings.

### Maintenance

- Consolidate HTML template handling and sanitize settings descriptions and statistics.

## [0.2.2] - 2024-06-12

### Maintenance

- Use structured cloning for settings snapshots and synchronization-statistics resets.

## [0.2.1] - 2024-06-12

### Documentation

- Standardize references to flashcard notes across documentation, settings, commands, and notices; correct README wording and a missing API reference link.

### Maintenance

- Update release and repository-metadata actions and remove duplicate release archive generation.
- Refresh pnpm, shared configuration, build tools, and development dependencies.

## [0.2.0] - 2024-06-07

### Added

- Add an enabled-by-default option to exclude notes named after their parent folder.
- Show watched-note counts and the last synchronization time in settings, with actionable links in synchronization error notices.

### Changed

- Run manual synchronization requests immediately and reduce the automatic synchronization delay to four seconds.
- Derive synchronization namespaces from the vault ID instead of its name.
- Start new installations without preselected flashcard folders and disable verbose notices by default.

### Documentation

- Document AnkiConnect installation and CORS configuration, folder-note exclusions, note duplication, and alternative Obsidian–Anki plugins.

### Maintenance

- Replace temporary synchronization interval controls with shared debounce scheduling and update Yanki and development dependencies.

## [0.1.2] - 2024-06-06

### Added

- Introduce a desktop plugin for Obsidian 1.5.0+ that syncs selected folders recursively to Anki, automatically or through a command and settings button.
- Infer Basic, reversed, type-in-the-answer, and Cloze notes from Markdown structure, including multiple clozes and hints.
- Map vault folders to Anki decks, persist Anki note IDs in frontmatter, and synchronize edits, moves, and deletions while preserving review progress where possible.
- Transfer frontmatter tags and convert wiki links into links back to the Obsidian vault.
- Render extended Markdown features including tables, task lists, syntax highlighting, alerts, mathematical expressions, and highlights.
- Save plugin preferences and provide configurable AnkiConnect host, port, API key, and optional onward synchronization to AnkiWeb.
- Display synchronization summaries and persistent diagnostic statistics, with verbose notices and development controls for synchronization intervals.

### Documentation

- Provide manual installation instructions, Anki prerequisites, Markdown card examples, a settings reference, and synchronization FAQs.

### Maintenance

- Establish TypeScript builds, shared lint configuration, generated plugin manifests, and automated GitHub releases using the published Yanki dependency.

[0.1.2]: https://github.com/kitschpatrol/yanki-obsidian/releases/tag/0.1.2
[0.2.0]: https://github.com/kitschpatrol/yanki-obsidian/compare/0.1.2...0.2.0
[0.2.1]: https://github.com/kitschpatrol/yanki-obsidian/compare/0.2.0...0.2.1
[0.2.2]: https://github.com/kitschpatrol/yanki-obsidian/compare/0.2.1...0.2.2
[0.2.3]: https://github.com/kitschpatrol/yanki-obsidian/compare/0.2.2...0.2.3
[0.2.4]: https://github.com/kitschpatrol/yanki-obsidian/compare/0.2.3...0.2.4
[0.3.0]: https://github.com/kitschpatrol/yanki-obsidian/compare/0.2.4...0.3.0
[0.4.0]: https://github.com/kitschpatrol/yanki-obsidian/compare/0.3.0...0.4.0
[0.5.0]: https://github.com/kitschpatrol/yanki-obsidian/compare/0.4.0...0.5.0
[0.6.0]: https://github.com/kitschpatrol/yanki-obsidian/compare/0.5.0...0.6.0
[0.7.0]: https://github.com/kitschpatrol/yanki-obsidian/compare/0.6.0...0.7.0
[0.7.1]: https://github.com/kitschpatrol/yanki-obsidian/compare/0.7.0...0.7.1
[0.8.0]: https://github.com/kitschpatrol/yanki-obsidian/compare/0.7.1...0.8.0
[0.8.1]: https://github.com/kitschpatrol/yanki-obsidian/compare/0.8.0...0.8.1
[0.8.2]: https://github.com/kitschpatrol/yanki-obsidian/compare/0.8.1...0.8.2
[1.0.0]: https://github.com/kitschpatrol/yanki-obsidian/compare/0.8.2...1.0.0
[1.0.1]: https://github.com/kitschpatrol/yanki-obsidian/compare/1.0.0...1.0.1
[1.0.2]: https://github.com/kitschpatrol/yanki-obsidian/compare/1.0.1...1.0.2
[1.0.3]: https://github.com/kitschpatrol/yanki-obsidian/compare/1.0.2...1.0.3
[1.0.4]: https://github.com/kitschpatrol/yanki-obsidian/compare/1.0.3...1.0.4
[1.0.5]: https://github.com/kitschpatrol/yanki-obsidian/compare/1.0.4...1.0.5
[1.0.6]: https://github.com/kitschpatrol/yanki-obsidian/compare/1.0.5...1.0.6
[1.1.0]: https://github.com/kitschpatrol/yanki-obsidian/compare/1.0.6...1.1.0
[1.1.1]: https://github.com/kitschpatrol/yanki-obsidian/compare/1.1.0...1.1.1
[1.2.0]: https://github.com/kitschpatrol/yanki-obsidian/compare/1.1.1...1.2.0
[1.2.1]: https://github.com/kitschpatrol/yanki-obsidian/compare/1.2.0...1.2.1
[1.3.0]: https://github.com/kitschpatrol/yanki-obsidian/compare/1.2.1...1.3.0
[1.4.0]: https://github.com/kitschpatrol/yanki-obsidian/compare/1.3.0...1.4.0
[1.4.1]: https://github.com/kitschpatrol/yanki-obsidian/compare/1.4.0...1.4.1
[1.4.2]: https://github.com/kitschpatrol/yanki-obsidian/compare/1.4.1...1.4.2
[1.4.3]: https://github.com/kitschpatrol/yanki-obsidian/compare/1.4.2...1.4.3
[1.4.4]: https://github.com/kitschpatrol/yanki-obsidian/compare/1.4.3...1.4.4
[1.5.0]: https://github.com/kitschpatrol/yanki-obsidian/compare/1.4.4...1.5.0
[1.5.1]: https://github.com/kitschpatrol/yanki-obsidian/compare/1.5.0...1.5.1
[1.6.0]: https://github.com/kitschpatrol/yanki-obsidian/compare/1.5.1...1.6.0
[1.6.1]: https://github.com/kitschpatrol/yanki-obsidian/compare/1.6.0...1.6.1
[1.6.2]: https://github.com/kitschpatrol/yanki-obsidian/compare/1.6.1...1.6.2
[1.6.3]: https://github.com/kitschpatrol/yanki-obsidian/compare/1.6.2...1.6.3
[1.6.4]: https://github.com/kitschpatrol/yanki-obsidian/compare/1.6.3...1.6.4
[1.6.5]: https://github.com/kitschpatrol/yanki-obsidian/compare/1.6.4...1.6.5
[1.6.6]: https://github.com/kitschpatrol/yanki-obsidian/compare/1.6.5...1.6.6
[1.6.7]: https://github.com/kitschpatrol/yanki-obsidian/compare/1.6.6...1.6.7
[1.6.8]: https://github.com/kitschpatrol/yanki-obsidian/compare/1.6.7...1.6.8
[1.6.9]: https://github.com/kitschpatrol/yanki-obsidian/compare/1.6.8...1.6.9
[1.6.10]: https://github.com/kitschpatrol/yanki-obsidian/compare/1.6.9...1.6.10
[1.6.11]: https://github.com/kitschpatrol/yanki-obsidian/compare/1.6.10...1.6.11
[1.6.12]: https://github.com/kitschpatrol/yanki-obsidian/compare/1.6.11...1.6.12
[1.6.13]: https://github.com/kitschpatrol/yanki-obsidian/compare/1.6.12...1.6.13
[1.6.14]: https://github.com/kitschpatrol/yanki-obsidian/compare/1.6.13...1.6.14
[1.6.15]: https://github.com/kitschpatrol/yanki-obsidian/compare/1.6.14...1.6.15
[1.6.16]: https://github.com/kitschpatrol/yanki-obsidian/compare/1.6.15...1.6.16
[1.6.17]: https://github.com/kitschpatrol/yanki-obsidian/compare/1.6.16...1.6.17
[1.6.18]: https://github.com/kitschpatrol/yanki-obsidian/compare/1.6.17...1.6.18
[1.6.19]: https://github.com/kitschpatrol/yanki-obsidian/compare/1.6.18...1.6.19
[1.7.0]: https://github.com/kitschpatrol/yanki-obsidian/compare/1.6.19...1.7.0
[1.8.0]: https://github.com/kitschpatrol/yanki-obsidian/compare/1.7.0...1.8.0
[1.8.1]: https://github.com/kitschpatrol/yanki-obsidian/compare/1.8.0...1.8.1
[1.9.0]: https://github.com/kitschpatrol/yanki-obsidian/compare/1.8.1...1.9.0
[1.9.1]: https://github.com/kitschpatrol/yanki-obsidian/compare/1.9.0...1.9.1
[1.9.2]: https://github.com/kitschpatrol/yanki-obsidian/compare/1.9.1...1.9.2
[1.9.3]: https://github.com/kitschpatrol/yanki-obsidian/compare/1.9.2...1.9.3
[1.9.4]: https://github.com/kitschpatrol/yanki-obsidian/compare/1.9.3...1.9.4
[1.9.5]: https://github.com/kitschpatrol/yanki-obsidian/compare/1.9.4...1.9.5
[1.9.6]: https://github.com/kitschpatrol/yanki-obsidian/compare/1.9.5...1.9.6
[1.10.0]: https://github.com/kitschpatrol/yanki-obsidian/compare/1.9.6...1.10.0
[1.10.1]: https://github.com/kitschpatrol/yanki-obsidian/compare/1.10.0...1.10.1
[1.11.0]: https://github.com/kitschpatrol/yanki-obsidian/compare/1.10.1...1.11.0
[1.11.1]: https://github.com/kitschpatrol/yanki-obsidian/compare/1.11.0...1.11.1
[1.11.2]: https://github.com/kitschpatrol/yanki-obsidian/compare/1.11.1...1.11.2
[1.11.3]: https://github.com/kitschpatrol/yanki-obsidian/compare/1.11.2...1.11.3
[1.11.4]: https://github.com/kitschpatrol/yanki-obsidian/compare/1.11.3...1.11.4
[1.11.5]: https://github.com/kitschpatrol/yanki-obsidian/compare/1.11.4...1.11.5
[1.11.6]: https://github.com/kitschpatrol/yanki-obsidian/compare/1.11.5...1.11.6
[1.11.7]: https://github.com/kitschpatrol/yanki-obsidian/compare/1.11.6...1.11.7
[1.11.8]: https://github.com/kitschpatrol/yanki-obsidian/compare/1.11.7...1.11.8
[1.11.9]: https://github.com/kitschpatrol/yanki-obsidian/compare/1.11.8...1.11.9
[1.11.10]: https://github.com/kitschpatrol/yanki-obsidian/compare/1.11.9...1.11.10
[1.12.0]: https://github.com/kitschpatrol/yanki-obsidian/compare/1.11.10...1.12.0
[1.12.1]: https://github.com/kitschpatrol/yanki-obsidian/compare/1.12.0...1.12.1
[1.12.2]: https://github.com/kitschpatrol/yanki-obsidian/compare/1.12.1...1.12.2
[1.13.0]: https://github.com/kitschpatrol/yanki-obsidian/compare/1.12.2...1.13.0
[1.14.0]: https://github.com/kitschpatrol/yanki-obsidian/compare/1.13.0...1.14.0
[1.14.1]: https://github.com/kitschpatrol/yanki-obsidian/compare/1.14.0...1.14.1
[1.14.2]: https://github.com/kitschpatrol/yanki-obsidian/compare/1.14.1...1.14.2
