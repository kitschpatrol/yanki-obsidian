Note name management

---

The "one Obsidian note = one Anki note" premise can make for a lot of individual note files, and thinking up and renaming notes as their content is revised can be tedious. So, if you want, Yanki can manage the names of your note files based on their content.

Yanki looks inside each note, and extracts either the text of the "prompt" (e.g. the front of the card in most cases), or the "response" (e.g. the back of the card in most cases) to use as the filename. Truncation, deduplication, and sanitization are all taken care of.

Edge cases are carefully managed to ensure that there's always _some kind_ of best-effort semantically valuable file name assigned.
