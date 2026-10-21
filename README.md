# E-Sport FIFA · Peringkat Kalah Mati

Static bracket site for the E-Sport FIFA knockout event at Masjid Raja Haji Fi Sabilillah, Cyberjaya, on 24 October 2026.

Live site: https://imanjofaris.github.io/esportfifacyberjaya/

## What the site does

- Shows the full 32-player bracket from the poster: 16 first-round matches, then round of 16, quarter-finals, semi-finals and the final.
- Every card carries the player name, national team, flag and score. Penalty shootout scores can be added when a match ends level.
- Winners advance automatically. A finished tie needs penalties or a manually chosen winner before it can be saved.
- Live matches show a red strip under the header. A live match does not advance anyone until it is marked finished.
- The final winner fills the centre champion plate and the mobile final tab.
- Mobile gets a round-by-round list instead of the wide bracket. Desktop gets the mirrored World Cup style chart.
- "Skrin Penuh" hides the page around the bracket and scales it to fit the screen. It is made for a projector or TV.
- There is a countdown to the event date, a fullscreen scoreboard bar, and an OG image for link previews.
- No build step and no runtime dependencies. Fonts, flags and the pattern are bundled, so the site works offline.

## Updating results

### The normal way

1. Open the site and click **Sunting**, or press `E`.
2. Click any match card.
3. Enter the player names, teams and scores. For a draw, add the penalty score or pick a winner.
4. Set the status to **Selesai** and click **Simpan**.
5. The result is saved as a local draft on that device. The bracket, live strip and champion update immediately.
6. Click **Eksport** in the bottom bar. A file named `tournament.js` downloads.
7. Replace `data/tournament.js` in this repository with the downloaded file, then commit and push.
8. GitHub Pages publishes the update in about a minute.

Edits made in the browser stay on that device until the exported file is committed. The venue laptop shows them instantly, while phones see the published version.

If a corrected result changes a winner, every later result that depended on the old winner is cleared automatically. A message tells you how many matches were cleared.

- **Kosongkan** clears the score inputs for the open match. Click **Simpan** to apply it.
- **Buang draf** throws away local edits and reloads the published data.
- **Import** restores an exported `tournament.js` or a raw JSON file of the same shape.

### Editing the file directly

`data/tournament.js` is the only data source. It is plain JavaScript so the page also works when opened from the file system.

- `players` holds 32 players in bracket order. The first two play each other, then the next two, and so on. Teams are optional until you know them.
- `matches` holds 31 match records:
  - `R32-1` to `R32-16`
  - `R16-1` to `R16-8`
  - `QF-1` to `QF-4`
  - `SF-1` to `SF-2`
  - `F-1`
- `score` is `[home, away]`. Use `null` for an empty score.
- `pens` is `[home, away]` for a shootout, or `[null, null]`.
- `status` is `"scheduled"`, `"live"` or `"final"`.
- `winner` is normally `null`. Set it to `"a"` or `"b"` only when you need to override the score, for example after a walkover.
- The next round reads its players from the winners automatically. Do not add players to later rounds.

The file comments repeat the same rules.

## Teams and flags

Type the country name in the **Pasukan** field. Names are matched against the bundled country list, and the flag appears on the card. English and common Malay names both work (France or Perancis, Germany or Jerman, Netherlands or Belanda).

Unknown names are allowed and show the team's first letter instead of a flag. The country list is in `assets/js/countries.js`. The flags are in `assets/flags/`.

## Event details

Edit the `event` block in `data/tournament.js`:

- `dateISO` is the countdown target. It is currently midnight on 24 October 2026 because the poster does not give a start time. Change it if the event starts at a specific hour.
- `dateLabel`, `shortDate`, `venue` and `organiser` are the text shown in the header and footer.
- `brandline` is the row of text marks at the top. When `event.logos` has entries, those images replace the text row.
- `socials` holds the footer links. The YouTube and Facebook entries currently point to platform search results because the poster only gives the page name. Replace them with the real URLs.

### Adding the real logos

Put the image files in `assets/logos/`, then add entries to `event.logos`:

```js
"logos": [
  { "name": "Sepang Berselawat", "src": "assets/logos/sepang-berselawat.png" },
  { "name": "Majlis Perbandaran Sepang", "src": "assets/logos/mps.png" }
]
```

Use transparent PNGs or SVGs on a dark background. If an image fails to load, its name is shown as text instead.

## Project structure

```
index.html                 the page
assets/css/styles.css      all styles
assets/js/app.js           bracket logic, editor, countdown, scoreboard
assets/js/countries.js     country list for the team picker
assets/fonts/              Anton and Barlow, self-hosted
assets/flags/              SVG flags, bundled from flag-icons
assets/img/                trophy, pattern, favicon, OG image
data/tournament.js         the editable tournament data
tools/og-card.html         source for the social preview image
```

## Local preview

Double-click `index.html`. Everything loads from relative paths. For a quick local server instead, run `npx serve .` in the project folder.

## Deployment

GitHub Pages serves the repository root from the `main` branch. `.nojekyll` is present so files are served as-is.

To publish an update:

```bash
git add .
git commit -m "Update results"
git push
```

## Notes

- The bracket is fixed at 32 players. A 16-player field would need a code and layout change.
- The trophy is a generic gold globe trophy. Replace `assets/img/trophy.svg` to use a different one.
- Browsers: current Chrome, Edge, Firefox and Safari. The layout uses CSS `zoom`, which is supported in current versions.
