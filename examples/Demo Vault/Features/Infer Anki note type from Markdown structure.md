Infer Anki note type from Markdown structure

---

Since the number of supported note types is small, the type of Anki note to create from a given Obsidian note can be inferred from a few simple rules about the structure of the Markdown.

For example, a Basic note is any Markdown file with a `---` horizontal rule splitting the front and back of the card:

```md
I'm the front.

---

I'm the back.
```

That's it, no extra metadata or Anki-specific markup is required. You can add whatever additional Markdown syntax you'd like to style the note.
