Tag support

---

The values in the `tags` array of your note's properties will be added as tags in Anki. This gives nice interoperability with Obsidian's tag system, which treats frontmatter `tags` as first-class tag citizens.

Detecting Obsidian `#tags` in the document body is not currently supported, but plugins like Victor Tao's [Obsidian Linter](https://github.com/platers/obsidian-linter) can automate tag migration from the document body to frontmatter, where Yanki (and thus Anki) can see it.
