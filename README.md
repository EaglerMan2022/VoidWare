# VoidWare

VoidWare is a lightweight, responsive browser-games catalog built with plain HTML, CSS, and JavaScript. Serve the repository with a static web server (for example `python3 -m http.server`) so the game catalog JSON can be fetched.

## Add a game

1. Make a folder under `games/` with an `index.html` game page.
2. Add an entry to `games/catalog.json` with an ID, display name, matching folder name, category, and optional description/icon/image.
3. The homepage search matches the game name, description, and category. `isNew: true` also lists the game in New Games.

## GBA Emulator

The GBA Emulator page (`games/gba/`) accepts a `.gba` file selected from the visitor's device and starts EmulatorJS in the browser. VoidWare does not include or distribute ROMs or BIOS files. Visitors should only load game files they created or are legally allowed to use. The ROM is selected as a local file and is not uploaded to VoidWare; the EmulatorJS runtime is loaded from its CDN when launched. Internet access is needed for that runtime.
