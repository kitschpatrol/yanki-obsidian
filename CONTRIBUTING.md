# Contributing

## Issues

[Issues](https://github.com/kitschpatrol/yanki-obsidian/issues) are welcome and appreciated.

Note that most of the functionality of the plugin is actually implemented in the [yanki](https://github.com/kitschpatrol/yanki) CLI tool / TypeScript library repository, not in the Obsidian plugin itself. In many cases, it will make more sense to open an issue in that repo instead of this one.

Please open one issue per feature request or bug report so they can be tracked and resolved individually.

If you're reporting a bug, please provide an Obsidian vault folder with the minimal set of notes that can reproduce the problem. This can be zipped and attached to the GitHub issue.

There's a good chance I will re-title your issue for clarity and consistency, please don't take offense.

## Pull requests

For anything beyond a trivial fix, please open an issue first so we can agree on the approach before you invest time in the change. Keep pull requests focused with one logical change per PR, and update the README if you're changing user-visible behavior.

## Development setup

1. Fork and clone the repo. For convenience, you can clone directly into `<YourVault>/.obsidian/plugins/yanki-obsidian/` so changes load in Obsidian without copying files around.
2. Install [pnpm](https://pnpm.io) if you don't already have it. **Use pnpm — not npm or yarn**; this project's tooling is pinned to it.
3. Run `pnpm install`.
4. Run `pnpm dev` to start compilation in watch mode.
5. Reload Obsidian (Ctrl/Cmd+R) to pick up changes. The [Hot Reload plugin](https://github.com/pjeby/hot-reload) can help automate this during development.

## Code standards

This project uses [`@kitschpatrol/shared-config`](https://github.com/kitschpatrol/shared-config) for linting, formatting, and type checking, orchestrated through the `ksc` CLI. **Run `pnpm fix` before submitting a PR** — it auto-fixes formatting, import sorting, and most lint issues in one shot.

For an overview of code standards enforced byt the config, see the [`ksc` reference](https://github.com/kitschpatrol/shared-config/blob/673c251d774647dd7ee3956d45cb17e17baff39e/packages/repo-config/init/.claude/skills/ksc/SKILL.md).

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (see [`LICENSE`](./LICENSE)).
