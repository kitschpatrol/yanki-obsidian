"""Launch Anki with fresh preferences, collection, add-ons, and instance identity."""

import hashlib
import json
import os
from pathlib import Path
import pickle
import sqlite3
import sys
import tarfile

base = Path(os.environ["YANKI_E2E_ANKI_BASE"]).resolve()
archive = Path(os.environ["YANKI_E2E_ANKICONNECT_ARCHIVE"]).resolve()
connection = json.loads((base / "connection.json").read_text(encoding="utf-8"))
profile = connection["profile"]

# Set arguments before importing Qt; bootstrap paths are not files to import.
sys.argv[:] = ["anki", "-b", str(base), "-p", profile, "-l", "en_US"]

import aqt
from aqt.profiles import metaConf, profileConf

# Seed only preferences, not a binary collection fixture. Anki creates an empty
# collection on first open. This also bypasses language/profile welcome dialogs.
with sqlite3.connect(base / "prefs21.db") as db:
    db.execute("CREATE TABLE profiles (name TEXT PRIMARY KEY, data BLOB NOT NULL)")
    meta = dict(metaConf, firstRun=False, defaultLang="en_US", updates=False)
    prefs = dict(profileConf, autoSync=False, syncMedia=False, numBackups=0)
    db.executemany(
        "INSERT INTO profiles VALUES (?, ?)",
        [("_global", pickle.dumps(meta)), (profile, pickle.dumps(prefs))],
    )

# Extract only the add-on's regular files from the checksum-verified archive.
addon = base / "addons21" / "2055492159"
addon.mkdir(parents=True)
with tarfile.open(archive) as source:
    for member in source.getmembers():
        parts = Path(member.name).parts
        if member.isfile() and len(parts) == 3 and parts[1] == "plugin":
            with source.extractfile(member) as content:
                (addon / parts[2]).write_bytes(content.read())

(addon / "meta.json").write_text(
    json.dumps({
        "name": "AnkiConnect",
        "disabled": False,
        "config": {
            "apiKey": connection["key"],
            "webBindAddress": "127.0.0.1",
            "webBindPort": connection["port"],
            "webCorsOriginList": ["app://obsidian.md"],
        },
    }),
    encoding="utf-8",
)

# Anki normally reuses any running instance even with a different -b directory.
# Give this disposable instance its own IPC key before entering the event loop.
# Never signal, stop, or connect to the user's normal Anki instance.
aqt.AnkiApp.KEY = "yanki-e2e-" + hashlib.sha256(str(base).encode()).hexdigest()[:24]
aqt.run()
