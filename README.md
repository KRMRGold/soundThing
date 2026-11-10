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
- Choose **Save workspace** to save the canvas and settings in this browser.

## Saving and portability

**Save workspace does not create or download a save file.** It stores the workspace configuration and imported audio blobs in IndexedDB, the browser's built-in local database.

That means the workspace can be restored when you reopen the app using the same browser profile and site origin. It is not automatically available in another browser, browser profile, or device. Clearing the browser's site data can delete it, and browser-managed storage is not a guaranteed backup.

A portable workspace file with an export/import option is a future feature; it is not implemented yet.

See [Design-v0.1.0.md](./Design-v0.1.0.md) for the broader design and milestone scope.
