# soundThing

An instrument-centered music-making environment built around a spatial canvas of independently playable sound things.

**Current state:** playable-canvas prototype 0.2.0 — implementation candidate; browser behavior still needs runtime testing.

## Run locally

Requirements: Node.js 20.19+ or 22.12+.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite.

## Checks

```bash
npm run typecheck
npm run build
```

## First prototype

- Import audio by dropping a file onto the canvas or using **Import audio**.
- Play, pause/resume, stop, and loop each sound thing independently.
- Adjust playback rate and level per sound thing.
- Use the **+** control to create another sound thing referencing the same managed audio source.
- Choose **Save workspace** to persist the canvas and settings in this browser.

Imported audio blobs and workspace state are stored in IndexedDB for this browser origin. Browser storage is not a backup; clearing site data can remove it.

See [Design-v0.1.0.md](./Design-v0.1.0.md) for the broader design and milestone scope.
