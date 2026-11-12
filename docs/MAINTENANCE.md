---
name: Soundthing Maintenance
type: maintenance
version: 0.1.0
status: current
project_version: 0.5.0
design_document: ../Design-v0.1.0.md
build_specification: ../build-spec.md
---

# Soundthing — Maintenance

This is the operational record of what is actually in the repository, what has been accepted, what remains a candidate, and where development should resume. It is not a replacement for the design document or the build specification.

- **Design document:** `Design-v0.1.0.md` — product vision, principles, design decisions and longer-term direction.
- **Build specification:** `build-spec.md` — proposed implementation milestones and their acceptance criteria.
- **This document:** current implementation map, project state, known limitations and maintenance guidance.

When these documents disagree, inspect the code and the latest user-confirmed decisions. Do not change working code merely to make it match a document.

## Current project state

| Item | Current state |
|---|---|
| Repository branch | `main` |
| Latest inspected commit | `fe8379bb7288f79470dcdb9ce3d48775e9c40ad6` — added `build-spec.md` |
| App/package version | `0.5.0` |
| Accepted baseline | `0.3.0` |
| Sampler candidate | `0.4.1` — implemented; user reported it works better, full acceptance verification not recorded |
| Canvas candidate | `0.5.0` — implemented; user reports the interaction is pretty good, full acceptance verification not recorded |
| Project archive format | `soundthing-project`, version `1` |
| Automated checks | TypeScript check and Vite production build only |
| Behavioral verification | User-run browser checks; no automated test suite currently exists |

The accepted `0.3.0` baseline has recorded successful CI typecheck/build and user-run checks for playback, simultaneous sound things, independent settings, local workspace persistence, portable project save/open, separate Chrome-profile import, managed audio after moving the original file, and shared-source duplicates. Evidence and historical details are in the design document.

Do not describe 0.4.1 or 0.5.0 as fully accepted until their candidate checks have been completed or the user explicitly accepts any documented blocked checks.

## Repository map

| Path | Responsibility |
|---|---|
| `src/main.tsx` | React application entry point |
| `src/App.tsx` | Main UI, React Flow canvas, sound-thing node component, application interactions, import/export orchestration, and conversion between UI nodes and stored sound things |
| `src/components/SamplerWaveform.tsx` | Waveform drawing and pointer interaction for selecting a sample region and moving its start/end boundaries |
| `src/audio/engine.ts` | Tone.js audio engine: decoded buffer registry, per-sound-thing players, playback, pause/resume position, stop, settings updates and disposal |
| `src/storage/workspace.ts` | IndexedDB database, audio-source records, workspace records, persisted sound-thing shape and normalization |
| `src/storage/projectFile.ts` | ZIP-based `.soundthing` archive creation, manifest validation, audio asset extraction and project format version check |
| `src/styles.css` | Application, sound-thing, waveform and React Flow styling |
| `vite.config.ts` | Vite and React build configuration |
| `.github/workflows/build.yml` | CI install and production build |
| `package.json` | App version, scripts, dependencies and supported Node.js versions |

### Current architecture (as implemented)

- **UI/canvas:** React and React Flow. `App.tsx` owns the React Flow node state and renders each sound thing as a custom node.
- **Application state:** sound-thing data currently lives inside React Flow node data and is converted to/from `StoredSoundThing` when persisted. This is the current implementation, even though the intended longer-term architecture calls for application state to be independent of React Flow.
- **Audio:** `engine.ts` is a module-level engine with a map of decoded ToneAudioBuffers keyed by source ID, a map of active players keyed by sound-thing ID, and paused offsets. Each sound thing gets its own `Tone.Player`; multiple sound things can share a decoded source buffer.
- **Storage:** IndexedDB stores imported audio blobs and the current workspace. The portable project file is a ZIP archive containing `manifest.json` and referenced audio assets.
- **Canvas and audio are not connected by an audio-routing graph.** React Flow edges are currently empty. Future audio, sync and modulation routing must not use visual canvas edges as the engine's authority.

The desired separation between canvas, application model and audio engine is an architectural direction, not yet a fully realized three-layer implementation. Refactor incrementally and preserve persisted data compatibility.

## Current behavior

### Sound things and playback

- Import audio through the file picker or by dropping audio onto the canvas.
- Each import creates a managed audio-source record with a generated ID, original file name/type/size/blob, decoded duration and waveform peak data.
- A sound thing references a source and has its own canvas position and playback settings.
- Duplicating a sound thing creates a new sound-thing ID while reusing the same source ID; its playback settings are independent.
- Playback supports Play, Pause, Resume, Stop, One-Shot and Loop, plus playback rate and level.
- Sample start/end are per sound thing. Loop mode repeats the selected sample region; separate loop-in/loop-out controls were removed from the UI.
- The original imported audio is treated as immutable; region edits change playback configuration, not the stored source bytes.

### Sampler interaction detail

- `SamplerWaveform.tsx` keeps a draft selection while dragging and commits the selected region on pointer-up.
- Start/end range sliders update settings as their values change.
- `updateSoundThingSettings()` in `engine.ts` currently stops active playback when sample start or end changes, then invokes the stop callback. Therefore uninterrupted playback while adjusting sample boundaries is **not currently supported**.
- The user has expressed interest in eventually keeping playback available while dragging the start/end boundaries. This is an open interaction/audio-engine refinement, not a requirement to implement immediately. Decide whether edits should affect the current voice live, apply on the next trigger, or offer both behaviors before changing the engine.
- Playback-rate or loop-mode changes currently recreate the active player at the calculated current position. Volume changes update the existing player.

### Canvas

- Left-drag on empty canvas space selects intersecting sound things (`selectionOnDrag`, partial selection).
- Dragging selected sound things moves the selection; ordinary node dragging remains available.
- Middle mouse drag pans the canvas (`panOnDrag={[1]}`).
- React Flow MiniMap and zoom controls use dark styling.
- Sound-thing controls use React Flow's `nodrag` class to avoid initiating node drag. Verify waveform, sliders, transport, and selection interactions when changing gesture behavior.

## Persisted data and compatibility

### IndexedDB

- Database: `soundthing-workspace`
- Database version: `1`
- Object stores: `audio-sources` (keyed by `id`) and `workspaces` (keyed by `id`)
- Current workspace record ID: `current`
- Audio-source record fields: `id`, `name`, `mimeType`, `size`, `blob`, `duration`, `waveform`
- Stored sound-thing fields: `id`, `sourceId`, `sourceName`, `duration`, `waveform`, `position`, `playbackRate`, `volumeDb`, `loop`, `sampleStart`, `sampleEnd`, `loopStart`, `loopEnd`

### Sampler settings

`PlaybackSettings` is defined in `src/audio/engine.ts` and currently includes:

- `playbackRate`
- `volumeDb`
- `loop`
- `sampleStart`
- `sampleEnd`
- `loopStart` and `loopEnd` (legacy-compatible persisted fields; the current playback loop uses the selected sample region instead)

The workspace and project-file modules normalize sample boundaries. The minimum selected region is up to 10 ms, limited by the source duration. Do not rename or remove persisted fields without a migration or compatibility mapping.

### Portable project format

- Format identifier: `soundthing-project`
- Current integer format version: `1`
- Archive contains `manifest.json` and audio data under `audio/`.
- Manifest contains creation time, sound things and source metadata/archive paths.
- The loader validates the manifest, referenced source IDs and audio byte lengths.
- The loader currently accepts only format version 1; there is no migration chain yet.
- Opening a project creates new internal source IDs, stores imported source blobs, and replaces the visible workspace.

**Important current limitations:**
- Reopening/importing projects can create additional stored audio-source records because source IDs are regenerated and there is no content-hash deduplication or reference-count cleanup.
- Opening a project replaces the current workspace without a recoverable previous-workspace slot or unsaved-change confirmation.
- IndexedDB is browser-local working storage, not a backup. The downloaded `.soundthing` archive is the portable copy the user should retain.
- The loader checks archive paths begin with `audio/`; review archive validation and resource limits before expanding project import to untrusted files.

These are known maintenance concerns, not already-implemented protections.

## Build and verification

Requirements from `package.json`: Node.js `^20.19.0 || >=22.12.0`.

Available scripts:

```sh
npm install
npm run dev
npm run typecheck
npm run build
npm run preview
```

`npm run build` runs `npm run typecheck` followed by `vite build`.

The current GitHub Actions workflow runs `npm install` and `npm run build` on pushes and pull requests targeting `main`. There are currently no test, test:unit or test:e2e scripts, no Vitest/Playwright dependencies, and no test fixtures in the repository.

Do not claim automated behavioral coverage based on the build passing. Audio quality (clicks, buzzing, timing feel), real mouse interaction and other human-experience checks still require user testing. Record exact commit and result whenever a check is run.

## Development state and next work

Use `build-spec.md` as a roadmap, not as a description of completed functionality. Its most useful near-term sequence is:

1. **M1 — Baseline and test harness:** add a code map (this document now provides the initial map), then decide and implement an appropriate automated test foundation without changing behavior. Inspect existing dependencies and CI before adding test tools. Preserve the accepted baseline.
2. **M2 — Verify sampler candidate 0.4.1:** test region constraints, One-Shot boundaries, Loop boundaries and audio quality, pause/resume, settings changes, independent sound things, persistence, project round trips and 0.3.0 compatibility. User's report that it works better is useful feedback, but does not replace the remaining acceptance checks.
3. **M3 — Verify canvas candidate 0.5.0:** verify box selection, group movement, normal node movement, middle-mouse pan, control interaction, MiniMap and zoom controls. User feedback is that the interaction is pretty good; the complete seven-check verification is not recorded.
4. **M4 — Storage safety:** investigate source deduplication, reference cleanup, import size warnings and recoverable project opening. The build spec explicitly calls out that content-hash reuse changes the design document's fresh-ID-on-import decision; get user agreement before implementing that change.
5. **Later milestones:** investigate note-triggered/polyphonic voices, MIDI, tempo sync, slicing/drum racks, effects/routing, automation/modulation, recording and desktop packaging in dependency order. Treat the build spec's technical approaches as proposals to evaluate, not decisions already made.

### Deferred sampler UX question

Live playback while adjusting sample start/end is a known user interest. It is not a blocker for the current candidate. When revisiting it, inspect the current stop/restart path and decide the intended interaction first; avoid adding a workaround in the waveform component that bypasses the audio engine's state model.

## Maintenance rules

- Keep this as the single current maintenance document; update it in place. Git history is the archive.
- Keep the design document focused on vision, principles and product decisions; keep the build spec focused on milestone plans and acceptance criteria.
- Update the current state and code map when implementation changes. Distinguish implemented, user-tested, automated-tested, accepted and deferred work.
- Preserve persisted field names and project compatibility. Any data-shape change needs an explicit migration/compatibility plan.
- Do one milestone at a time. Inspect the existing code before editing; do not implement a roadmap item merely because it appears in the build spec.
- Verify against the exact commit. Report PASS, FAIL, BLOCKED or NOT RUN honestly. User-run checks and automated checks are different evidence.
- Prefer the existing stack and dependencies. Justify new dependencies by a concrete need.
- Do not add backend services, analytics or network requirements; the project is browser-first and local.
- The user prefers direct commits to `main` for this solo project, one living document per purpose, and Git history for provenance. Avoid unnecessary versioned document copies or PR overhead.
