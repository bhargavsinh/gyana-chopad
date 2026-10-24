# જ્ઞાન ચોપડ | Gyāna Chopad V1.0

**Educational digital adaptation of the traditional Indian board game Gyan Chaupar (Snakes & Ladders ancestor).**

Inspired by historical 72-square Vaishnava-style boards, this version is an original educational design focused on virtues, ethical reflection, and Indian philosophical themes. It is **not** a reconstruction of any single historical board and does not claim to represent specific doctrinal positions of any tradition (including Pushtimargiya or other Vaishnava lineages).

## Features

- 72-square serpentine board with six thematic stages
- 9 ladders (virtues) and 9 snakes (vices) with Gujarati labels
- 2–4 local players
- Classic Mode and Reflection Mode (educational cards)
- Exact-roll win option
- Fully Gujarati primary interface
- 45 educational reflection cards
- Mobile-first, responsive, works offline after first load (static)
- No backend, no paid APIs — GitHub Pages ready

## How to Play

1. Choose number of players (2–4) and enter names.
2. Select Classic or Reflection mode.
3. Optionally require exact dice to finish on square 72.
4. Players take turns rolling the die.
5. Land on a ladder → climb (virtue). Land on a snake → slide down (vice).
6. In Reflection Mode, educational cards appear for contemplation.
7. First to reach exactly 72 (or 72 if exact-win is off) wins.

## Project Structure

```
gyana-chopad/
├── index.html
├── README.md
├── css/
│   └── styles.css
├── js/
│   ├── main.js
│   ├── data.js
│   ├── game.js
│   └── ui.js
├── data/
│   ├── board.json
│   ├── snakes-ladders.json
│   └── cards.json
└── assets/          (optional future assets)
```

## Deployment (GitHub Pages)

1. Push this repository to GitHub (`bhargavsinh/gyana-chopad` or any repo).
2. Settings → Pages → Source: Deploy from branch `main` (root).
3. Site will be available at `https://<user>.github.io/gyana-chopad/`.

All paths are relative. No build step required.

## Philosophical & Historical Notes

- Historical Gyan Chaupar boards varied (72, 84, 100+ squares) across Jain, Vaishnava, and other traditions.
- Snakes and ladders traditionally carried named vices and virtues as didactic devices.
- This game treats karma as a broader ethical and causal concept, not a simplistic score system.
- Divine grace and tradition-specific soteriology are not reduced to game points.
- Cards are marked as educational game content.

## Development

Open `index.html` via a local static server (or GitHub Pages).  
Modules use ES modules; `file://` may block fetch in some browsers — use a simple server:

```bash
npx serve .
# or
python3 -m http.server 8080
```

## Version

V1.0 — Initial playable release.

## License

Educational / personal use. Attribution appreciated.
