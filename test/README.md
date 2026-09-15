# Desktop tests

These tests run the production bundle in real Obsidian and sync to real Anki. [Vitest](https://vitest.dev/) owns test selection, fixtures, assertions, and reporting; [WebdriverIO's Obsidian service](https://jesse-r-s-hines.github.io/wdio-obsidian-service/wdio-obsidian-service/startWdioSession.html) downloads and drives the desktop app. No Obsidian runtime mock is involved.

The focus is the plugin boundary: commands and notices, settings UI and persistence, watched folders, file and fetch adapters, metadata cache updates, and plugin lifecycle. Parsing, note types, media permutations, and sync algorithm coverage belong in [yanki](https://github.com/kitschpatrol/yanki).

The [sync regression test](./sync.e2e.test.ts) syncs notes into nested decks, adds another note through Obsidian's Vault API, and syncs again. It verifies successful completion, stable existing Anki IDs, frontmatter and metadata cache updates, and an unchanged third sync without duplicate notes. This scenario runs in every supported CI combination.

## Local setup

Install the repository's Node and pnpm versions, plus [uv](https://docs.astral.sh/uv/getting-started/installation/), then run:

```sh
pnpm install
pnpm test
```

The same commands work on macOS, Windows, and Linux. The runner uses uv to install Python 3.13 and sync `test/.venv` from `test/uv.lock`; no environment activation or existing Python installation is needed. To prepare Anki separately, run `uv sync --project test --locked --managed-python`. Change `test/pyproject.toml` and run `uv lock --project test` when updating Anki dependencies.

Anki is installed through its official Python distribution (`aqt==25.9.2`, the same release as Yanki's CI). A normal desktop Anki installation and its add-ons are not required. The first test run downloads the pinned AnkiConnect source archive, verifies its SHA-256, and downloads Obsidian plus its matching ChromeDriver. Downloads are cached in `.cache/`.

On Linux, install the Qt/Electron libraries listed in [the workflow](../.github/workflows/ci.yml), then use `xvfb-run --auto-servernum pnpm test` on a headless machine. macOS and Windows need a desktop session. Test windows will appear during local runs.

## Commands

| Command                                 | Behavior                                                                                                                |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `pnpm test`                             | Build the production bundle, then run all desktop tests on latest stable Obsidian with the minimum supported installer. |
| `pnpm test:e2e`                         | Run against the existing `dist/` bundle. Build first after source changes.                                              |
| `pnpm test:e2e test/plugin.e2e.test.ts` | Run one test file.                                                                                                      |
| `pnpm test:e2e -t "persists folder"`    | Select tests by name.                                                                                                   |
| `pnpm test:e2e test/sync.e2e.test.ts`   | Run the nested-deck sync regression.                                                                                    |

To test other combinations, set `YANKI_E2E_APP_VERSION` and `YANKI_E2E_INSTALLER_VERSION`. For example, on macOS/Linux:

```sh
YANKI_E2E_APP_VERSION=earliest pnpm test
YANKI_E2E_APP_VERSION=latest pnpm test:e2e test/sync.e2e.test.ts
```

`earliest` for the **app** reads `minAppVersion` from the built manifest. `latest` selects the latest public stable app, excluding beta releases. The **installer** defaults to that same `minAppVersion` for both app endpoints, currently 1.9.12. Raising `minAppVersion` raises the tested installer version automatically. An app update does not update Electron, so both endpoints explicitly exercise the supported runtime floor. You can override the installer for local diagnostics; those additional combinations are outside the CI matrix.

## CI

The [CI workflow](../.github/workflows/ci.yml) runs four jobs:

| Job                             | Work                                                                                |
| ------------------------------- | ----------------------------------------------------------------------------------- |
| Checks (Linux)                  | Lint and type-check once.                                                           |
| Desktop (Linux, macOS, Windows) | Build once per OS, then test minimum and latest stable Obsidian against that build. |

The three desktop jobs wait for checks to pass. Each installs Anki and the desktop test dependencies once, then runs the two app versions sequentially with fresh collections and vault copies. This covers six required app/platform combinations with three builds and one lint/type-check run. The latest-app tests still run if the minimum-app tests fail, and either failure fails the job. The weekly schedule exercises new stable Obsidian releases.

`pnpm build` retains its local type check. CI uses `pnpm build:bundle --no-demo` after the checks job has already checked types, so it does not repeat that work on every platform.

## Isolation and diagnostics

Each run creates fresh Anki preferences and an empty collection in a temporary directory. A unique Anki IPC identity allows it to coexist with your normal Anki instance. AnkiConnect listens only on loopback, on a random port, with a random API key; startup verifies the test profile and empty collection. Teardown stops only the process tree the runner started and removes its data. AnkiWeb sync is disabled.

Each test gets a fresh copy of `test/vault`, the release plugin from `dist`, isolated Electron configuration, and a unique Yanki namespace. Tests run serially against the disposable Anki process. Your normal vault, Anki profile, and example vault contents are not test fixtures.

Test commands build with `--no-demo`, leaving the human-facing example vault untouched. The regular `pnpm build` and `pnpm dev` commands retain their existing demo plugin copy behavior.

`test-results/<app>-<installer>/` contains the Anki startup log and, for each desktop test, a screenshot, browser console log, Markdown contents with plugin sync statistics, and runtime versions. Each app endpoint keeps its own logs so running both in one CI job preserves both sets of diagnostics. Diagnostics are captured before shutting down Obsidian, including on assertion failures. Setup failures before a browser starts may only have process logs. These files are ignored by Git and uploaded by CI for 14 days.

## Adding tests

Import `test` from `./support/obsidian` and `expect` from `vitest`:

```ts
import { expect } from 'vitest'
import { test } from './support/obsidian'

test('registers a command', async ({ desktop: { browser } }) => {
  const commands = await browser.executeObsidian(({ app }) =>
    app.commands.listCommands().map(({ id }) => id),
  )
  expect(commands).toContain('yanki:sync')
})
```

`browser.executeObsidian` runs its callback inside Obsidian. Pass values as explicit arguments; callbacks cannot close over Node-side imports or variables. Use real UI interactions for UI behavior and Vault APIs for vault operations. `watchFolders` and `sync` are small shared helpers; `sync` waits for completion and checks failures caught by the plugin. Use `expect.poll` or `browser.waitUntil` for asynchronous events.

Add `*.e2e.test.ts` files for new plugin behavior, keeping fixtures small. Use a unique namespace when querying Anki, as other tests may have added notes to the same disposable collection. Do not copy the library's extensive functional suite here.
