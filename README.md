# soundThing

An instrument-centered music-making environment built around a spatial canvas of independently playable sound things.

**Current state:** prototype candidate 0.5.0 — sampler loop simplification plus canvas selection and navigation controls. Build and browser verification are pending.

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
- Drag across the waveform to select a sample region and adjust its start/end boundaries.
- Play the selected region in One-Shot or Loop mode.
- Adjust playback rate and level per sound thing.
- Drag on empty canvas space with the left mouse button to box-select sound things; drag a selected sound thing to move the selection together.
- Drag with the middle mouse button to pan around the canvas.
- Use the **+** control to create another sound thing referencing the same managed audio source.
- Choose **Save project** to download a portable `.soundthing` project file.
- Choose **Open project** to restore a previously saved project, including its audio.

## Project files and browser storage

A `.soundthing` file is a ZIP-based project archive containing a versioned JSON manifest, the workspace layout and sound-thing sampler settings, and the audio assets used by the project. It is self-contained: moving the project file to another device does not require the original audio files or the browser's existing database.

Saving also keeps a local IndexedDB copy so the project can be restored when reopening the app in the same browser profile and site origin. Opening a project imports its audio assets into browser storage and replaces the currently displayed workspace. Existing unreferenced audio records may remain in local storage for now.

The browser copy is not a backup by itself: clearing site data or browser storage eviction can remove it. Keep the downloaded `.soundthing` file somewhere safe.

The project format has an explicit version field so it can evolve as soundThing gains instruments, routing, automation, and other capabilities.

## Project documentation

- [Maintenance guide](./docs/MAINTENANCE.md) — current code map, implementation state, persistence details, known limitations and next steps.
- [Design document](./Design-v0.1.0.md) — product vision, principles and longer-term direction.
- [Build specification](./build-spec.md) — proposed milestones and acceptance criteria.
