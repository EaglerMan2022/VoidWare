# Game folders

Each `game1` through `game100` folder is a ready-to-customize starter page. Rename a folder whenever you like; each page loads the shared starter styles and script from this directory. The starter is deliberately not listed on the home page: the catalog starts empty, so none of the old games or blank slots appear as games.

## Add a game to the home page

1. Rename a `gameN` folder to a short URL-friendly name, such as `snow-rider`.
2. Replace that folder's `index.html` with your game's page, or keep it and customize the shared starter at `games/starter.css` and `games/starter.js` (shared changes affect every starter).
3. Add an entry to `catalog.json`:

```json
[
  {
    "id": "snow-rider",
    "name": "Snow Rider",
    "folder": "snow-rider",
    "category": "Arcade",
    "description": "Ride down the mountain.",
    "icon": "❄",
    "isNew": true
  }
]
```

The `folder` value must match the directory name and may contain letters, numbers, `_`, and `-`. `category` can be `Math` to show the game under Math Games. Cards use a generated cover; optionally set `cover` to a CSS hex color such as `#65b9ee`. The search box searches names, categories, and descriptions. Serve the repository with a static web server (for example `python3 -m http.server`) so the catalog JSON can be fetched.

Each starter page has a simple click-to-score demo to confirm its folder works. Replace it with your actual game when ready.
