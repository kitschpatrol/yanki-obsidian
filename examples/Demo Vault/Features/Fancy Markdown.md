Fancy Markdown

---

**[GitHub Flavored Markdown](https://github.github.com/gfm/)**

| Tables      | Status |
| ----------- | ------ |
| Thing       | ✅     |
| Other thing | ❌     |

Strike ~~throughs~~.

- [ ] Task
- [ ] Lists

Autolinks: <https://github.com/kitschpatrol>

---

**Syntax highlighting**

```ts
const processor = unified()
  .use(remarkRehype)
  .use(rehypeRemoveComments)
  .use(rehypeMathjax)
  .use(rehypeShiki, {
    themes: {
      dark: 'github-dark',
      light: 'github-light',
    },
  })
  .use(rehypeStringify)
```

---

**GitHub-style [Alerts](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax#alerts)**

> \[!IMPORTANT]
> Something really important

---

**WikiLinks to your Obsidian notes:**

[[One Obsidian note is one Anki note]]

---

**LaTeX formatted mathematical expressions via [MathJax](https://www.mathjax.org)**

$$ \text{Attention}(Q, K, V) = \text{softmax}\left(\frac{Q K^T}{\sqrt{d_k}}\right)V $$

---

Support for the [==highlights==](https://github.com/ipikuka/remark-flexible-markers) syntax.

---

Embedded blocks are partially supported, becoming links to the block content in your Obsidian vault instead of inline embedded content:

![[Support for Obsidian WikiLinks#^block-test]]
