Normalize unicode like `'Zoé' !== 'Zoé'`

---

Unicode is [normalized](https://www.w3.org/TR/charmod-norm/#unicodeNormalization) to match Anki's representation.

The two Zoé's look the same, but one is:

```js
'Zo\u00e9'
```

And the other is:

```js
'Zo\u0065\u0301'
```
