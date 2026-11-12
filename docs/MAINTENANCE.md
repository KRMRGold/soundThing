---
name: Soundthing Maintenance
type: maintenance
version: 0.1.1
status: current
project_version: 0.5.0
design_document: ../Design-v0.1.0.md
build_specification: ../build-spec.md
workflow: https://github.com/KRMRGold/Meta-Modules/blob/main/workflows/Development-State-Machine-Workflow.md
workflow_adopted_version: 1.6.0
---

# Soundthing — Maintenance

This is the operational record of what is actually in the repository, what has been accepted, what remains a candidate, and where development should resume. It is not a replacement for the design document or the build specification.

- **Design document:** `Design-v0.1.0.md` — product vision, principles, initial scope and long-term design direction.
- **Build specification:** `build-spec.md` — proposed implementation milestones, architecture contracts, risks and detailed acceptance criteria.
- **This document:** current implementation map, persistence and compatibility facts, verification evidence, unresolved decisions and maintenance state.

The code and user-confirmed decisions establish what currently exists and what the project should do. The build spec guides upcoming milestones, but its proposals do not silently override later user decisions or become implemented facts.

## Current project state

| Item | Current state |
|---|---|
| Repository branch | `main` |
| Source snapshot inspected | `3e4e58207ea5c5f052a6beee45d915aaf6e4b8df` (subsequent commits in this audit changed documentation only) |
| Maintenance audit commit | `d09837d8c8077cb12c1ce4a6a7bf6956f546553b` |
| App/package version | `0.5.0` |
| Last accepted baseline | `0.3.0` |
| Sampler candidate | `0.4.1` — implemented; user reported it works better; full acceptance verification is not recorded |
| Canvas candidate | `0.5.0` — implemented; user reports the interaction is pretty good; full acceptance verification is not recorded |
| Project archive format | `soundthing-project`, integer version `1` |
| Current automated checks | TypeScript check and Vite production build |
| Behavioral automated tests | None currently present |
| CI at inspected source snapshot | PASS — workflow run [#53](https://github.com/KRMRGold/soundThing/actions/runs/43149491451), exact commit `3e4e582` |
| CI for maintenance audit | PASS — workflow run [#54](https://github.com/KRMRGold/soundThing/actions/runs/43149850894), exact documentation commit `d09837d` |
| Browser/runtime acceptance | User-run checks for 0.3.0; candidates 0.4.1 and 0.5.0 still need their documented acceptance checks |

The accepted `0.3.0` baseline has recorded successful CI typecheck/build and user-run checks for playback, simultaneous sound things, independent settings, local workspace persistence, portable project save/open, separate Chrome-profile import, managed audio after moving the original file, and shared-source duplicates. The evidence is summarized in the design document.

The current CI PASS proves only that `npm install` and `npm run build` succeeded for the inspected commit. It does not prove sampler audio quality, canvas interaction, project recovery, or other behavioral acceptance criteria.

Do not describe 0.4.1 or 0.5.0 as fully accepted until their required checks have passed or the user explicitly accepts documented blocked checks.

## Repository map

The inspected default-branch tree contains these project files:

| Path | Responsibility |
|---|---|
| `src/main.tsx` | React application entry point; mounts `App`, global CSS and React Flow CSS |
| `src/App.tsx` | Main UI, React Flow canvas, sound-thing node component, React node state, import/export orchestration, playback callbacks and conversion between UI nodes and persisted sound things |
| `src/components/SamplerWaveform.tsx` | Waveform drawing and pointer interaction for selecting a sample region and moving its start/end boundaries |
| `src/audio/engine.ts` | Tone.js audio engine: decoded buffer registry, per-sound-thing players, playback, pause/resume position, stop, settings updates and disposal |
| `src/storage/workspace.ts` | IndexedDB database, audio-source records, workspace records, persisted sound-thing shape and normalization |
| `src/storage/projectFile.ts` | ZIP-based `.soundthing` archive creation, manifest validation, audio asset extraction and project format version check |
| `src/styles.css` | Application, sound-thing, waveform and React Flow styling |
| `index.html` | HTML document entry point |
| `vite.config.ts` | Vite and React build configuration |
| `tsconfig.json` | TypeScript compiler configuration |
| `package.json` / `package-lock.json` | App version, scripts, dependencies, runtime requirements and locked dependency tree |
| `.github/workflows/build.yml` | CI install and production build |
| `README.md` | User-facing project overview, local run instructions and documentation links |
| `Design-v0.1.0.md` | Product design and development path |
| `build-spec.md` | Detailed implementation roadmap and acceptance tests |
| `docs/MAINTENANCE.md` | This living maintenance document |

There is currently no `docs/TEST_RECORD.md`, `docs/decisions.md`, test directory, golden project fixture, Vitest setup, Playwright setup or dedicated test-hook module. The build spec proposes some of these for M1; they must not be described as existing.

### Current architecture (as implemented)

- **UI/canvas:** React and React Flow. `App.tsx` owns the React Flow node state and renders each sound thing as a custom node.
- **Application state:** sound-thing data currently lives inside React Flow node data and is converted to/from `StoredSoundThing` when persisted. A distinct application-owned model layer has not yet been implemented.
- **Audio:** `engine.ts` is a module-level engine with maps of decoded ToneAudioBuffers by source ID, active players by sound-thing ID, and paused offsets by sound-thing ID. Each sound thing gets its own `Tone.Player`; multiple sound things can share one decoded source buffer.
- **Sampler math:** normalization and playback-position calculations currently live in `engine.ts`; the pure `planPlayback` and `playheadAt` functions proposed in the build spec have not been extracted.
- **Storage:** IndexedDB stores imported audio blobs and the current workspace. The portable project file is a ZIP archive containing `manifest.json` and referenced audio assets.
- **Canvas/audio boundary:** React Flow edges are currently passed as an empty array. There is no audio-routing graph. Future audio, sync and modulation routing must be owned by an explicit application graph; React Flow edges should only render that graph.
- **Dependency direction:** the intended long-term separation is UI → application state → audio engine. The current implementation has not completed that separation; refactor incrementally and preserve behavior and persisted data.

### Direct dependencies

The current `package.json` lists:

- Runtime: `react` 19.3.1, `react-dom` 19.3.1, `@xyflow/react` ^12.12.0, `tone` ^15.1.22, `fflate` ^0.8.2.
- Build/development: `vite` ^8.3.6, `@vitejs/plugin-react` ^6.0.1, `typescript` ^5.9.3, React type packages.
- Node.js engine: `^20.19.0 || >=22.12.0`.

No additional runtime or test framework should be introduced without a concrete milestone need.

## Implemented behavior

### Sound things and playback

- Import audio through the file picker or by dropping audio onto the canvas.
- Supported extensions in the import filter include WAV, MP3, OGG/OGA, FLAC, M4A, AAC and AIFF. Actual decoding depends on browser codec support.
- **Unverified source observation:** the multi-file import position offset uses the node count captured before the import loop, so importing several files in one batch may place them at overlapping positions. Confirm in the browser before deciding whether to fix.
- Each import creates a managed audio-source record with a generated ID, original file name/type/size/blob, decoded duration and waveform peak data.
- A sound thing references a source and has its own canvas position and playback settings.
- Duplicating a sound thing creates a new sound-thing ID while reusing the same source ID; the duplicate starts with default rate/level/loop settings, independent of the original.
- Playback supports Play, Pause, Resume, Stop, One-Shot and Loop, plus playback rate and level.
- Sample start/end are per sound thing. Loop mode repeats the selected sample region; separate loop-in/loop-out controls were removed from the UI.
- The original imported audio is treated as immutable; region edits change playback configuration, not the stored source bytes.
- Saving downloads a portable project archive and also saves the current workspace in IndexedDB.

### Sampler interaction and playback details

- `SamplerWaveform.tsx` keeps a draft selection while dragging and commits the selected region on pointer-up.
- The Start and End range sliders update settings on each input change.
- `updateSoundThingSettings()` in `engine.ts` currently stops active playback when sample start or end changes, then invokes the stop callback. Uninterrupted playback while dragging or adjusting the sample boundaries is **not currently supported**.
- Playback-rate or loop-mode changes currently recreate the active player at the calculated current position. Volume changes update the existing player.
- The user has expressed interest in eventually keeping playback available while adjusting sample start/end. This is an open interaction/audio-engine refinement, not a blocker or an instruction to implement immediately. Before changing the engine, decide whether boundary edits should affect the current voice live, apply on the next trigger, or offer both behaviors.

### Canvas

- Left-drag on empty canvas space selects intersecting sound things (`selectionOnDrag`, partial selection).
- Dragging selected sound things moves the selection; ordinary node dragging remains available.
- Middle mouse drag pans the canvas (`panOnDrag={[1]}`).
- React Flow MiniMap and zoom controls use dark styling.
- Sound-thing controls and waveform use React Flow's `nodrag` convention to avoid initiating node drag. Verify actual control behavior when changing gesture handling.
- Current canvas hint explains left-drag selection and middle-drag panning.

## Persisted data and compatibility

### IndexedDB schema

- Database: `soundthing-workspace`
- Database version: `1`
- Object stores: `audio-sources` (keyed by `id`) and `workspaces` (keyed by `id`)
- Current workspace record ID: `current`

Audio-source record fields, defined in `src/storage/workspace.ts`:

- `id`
- `name`
- `mimeType`
- `size`
- `blob`
- `duration`
- `waveform`

Stored sound-thing fields, defined in `src/storage/workspace.ts` and assembled from React Flow node data in `src/App.tsx`:

- `id`
- `sourceId`
- `sourceName`
- `duration`
- `waveform`
- `position: { x, y }`
- `playbackRate`
- `volumeDb`
- `loop`
- `sampleStart`
- `sampleEnd`
- `loopStart`
- `loopEnd`

### Sampler settings and invariants

`PlaybackSettings` is defined in `src/audio/engine.ts` and currently includes:

- `playbackRate`
- `volumeDb`
- `loop`
- `sampleStart`
- `sampleEnd`
- `loopStart` and `loopEnd` (legacy-compatible persisted fields; the current playback loop uses the selected sample region instead)

The workspace and project-file modules normalize sample boundaries. The minimum selected region is up to 10 ms, limited by source duration. The intended invariant is `0 <= sampleStart < sampleEnd <= duration`. Sample-region positions are measured in seconds relative to the original source; future tempo values are planned in BPM and beat positions. Do not rename or remove persisted fields without a migration or compatibility mapping.

The build spec's proposed future sound-thing model adds a `mode` (`sample`, `instrument` or `drumRack`), sampler configuration, optional original-tempo metadata, instrument settings (root note, polyphony, envelope), drum-rack slices/pads and `createdFrom` provenance. These are target fields, not part of the current persisted schema.

### Portable project format

- Format identifier: `soundthing-project`
- Current integer format version: `1`
- ZIP archive contains `manifest.json` and audio data under `audio/`.
- Manifest contains `format`, `version`, `createdAt`, `soundThings` and `audioSources`.
- Each project audio-source entry includes source metadata and an `archivePath`; the audio bytes are stored at that path.
- The loader validates the archive, manifest, sound-thing fields, source metadata, archive paths, byte lengths and source references before returning an imported project.
- Legacy sound things without sampler boundary fields default to the full source on load.
- The loader currently accepts only format version 1; there is no migration chain yet.

### Current project-open and storage behavior

- Opening a project generates new internal source IDs, decodes and stores imported audio, remaps sound-thing source references, saves the imported workspace as `current`, and replaces the visible canvas.
- There is no unsaved-change confirmation or recoverable previous-workspace slot.
- Reopening/importing the same project can create additional stored audio-source records because IDs are regenerated and there is no content-hash deduplication or reference-count cleanup.
- Importing new audio also creates a fresh source ID; no source deduplication is performed.
- There is no source garbage collection or reference-count system.
- There is no configurable large-file/decoded-memory warning and no explicit persistent-storage request/status display.
- IndexedDB is browser-local working storage, not a backup. The downloaded `.soundthing` archive is the portable copy the user should retain.
- The loader checks archive paths begin with `audio/`; review path validation, decompression/resource limits and malformed archive handling before expanding project import to untrusted files.
- Project opening validates/parses the archive before updating the workspace, but source blobs are stored before the workspace write completes. A storage failure partway through that sequence can leave orphaned imported source records.

These are known maintenance concerns, not already-implemented protections.

## Build, CI and verification

Available scripts:

```sh
npm install
npm run dev
npm run typecheck
npm run build
npm run preview
```

`npm run build` runs `npm run typecheck` followed by `vite build`.

The current GitHub Actions workflow runs on pushes and pull requests targeting `main` and executes:

1. Checkout
2. Print Node/npm versions
3. `npm install`
4. `npm run build`

The latest inspected source snapshot `3e4e582` has a successful CI run: [Build #53](https://github.com/KRMRGold/soundThing/actions/runs/43149491451). This is a PASS for the workflow's current typecheck/build commands only.

There are currently no test, test:unit or test:e2e scripts, no Vitest/Playwright dependencies, no generated audio fixtures, no golden `0.3.0` project fixture, and no dev-only `window.__soundthingTest` hooks. The proposed CI command in the build spec (`npm ci`, typecheck, unit tests, build and E2E tests) is a target, not the current pipeline.

### Test strategy proposed by the build spec (not implemented)

- **Vitest:** pure sampler math, manifest validation/migrations, source reference counting, MIDI parsing and graph model.
- **Playwright/Chromium:** real app flows including import, canvas gestures, persistence, project round trips and browser-side engine checks.
- **Deterministic audio fixtures:** generated three-tone WAV for identifying which sample region plays, plus click-track WAVs for slicing and tempo tests.
- **Development-only test hooks:** optional analyser, dominant-frequency and RMS helpers, engine inspection and offline rendering behind `VITE_TEST_HOOKS=1`; production output must exclude the hooks.
- **Golden project fixtures:** a real accepted 0.3.0 project, then a 0.4.1 fixture after acceptance; future format changes must preserve opening through migrations.
- **Human checks:** listening for clicks/buzzing and time-stretch quality, real mouse feel, physical MIDI devices/hot-unplug, and clean-machine/cross-browser/cross-device checks.

Do not implement test hooks or fixtures by exposing production internals. Verify the test-only build boundary.

### Verification evidence labels

Use these distinctions in future updates:

- **PASS:** a check actually ran or trustworthy results exist for the exact candidate.
- **FAIL:** a check ran and did not meet its expectation.
- **BLOCKED:** a concrete environment, permission, dependency or platform limitation prevented execution.
- **NOT RUN:** the check was not attempted.
- **Implemented:** code exists, but behavior may not have been tested.
- **User-confirmed:** the user reports the behavior works in their environment.
- **Accepted:** required acceptance gate has been met, or a specific blocked limitation has been explicitly accepted by the user.

A source inspection, test plan, successful build, or test file existing is not behavioral execution evidence.

## Development workflow and documentation

Soundthing initially adopted the [Development State Machine Workflow](https://github.com/KRMRGold/Meta-Modules/blob/main/workflows/Development-State-Machine-Workflow.md) at internal version **1.6.0**. This is adoption provenance, not a permanent pin; the current canonical workflow is **1.6.1** and is followed by default.

The project design also records these applicable Meta-Modules: PAFC, Intent & Clarity, Discovery & Exploration, Capability & Agency, Testing & Verification, and Tool Use and Consent Boundaries.

Use the workflow proportionately:

- Preserve the last accepted code version and identify each candidate by exact SemVer version and commit.
- Implement one milestone at a time; do not begin the next milestone while required acceptance checks remain unresolved.
- Inspect the candidate, run available checks, repair failures and rerun affected regression tests.
- Update this document from actual evidence, not planned behavior.
- Keep one current file per living document; Git history is the revision archive.
- The user prefers direct commits to `main` for this solo project, no unnecessary PR workflow, and no proliferation of versioned document copies.

### Documentation roles

| Document | Role | Current state |
|---|---|---|
| `Design-v0.1.0.md` | Product vision, principles, scope, product decisions and open design questions | Exists; v0.1.4 |
| `build-spec.md` | Detailed milestone plan, architecture contracts, test plan, risks, non-goals and milestone acceptance criteria | Exists; v0.1.0 |
| `docs/MAINTENANCE.md` | Current implementation map, accepted/candidate state, persistence, evidence, known risks and next work | This file |
| `docs/TEST_RECORD.md` | Latest exact-candidate test run with PASS/FAIL/BLOCKED/NOT RUN, commands and evidence | Proposed by build spec; not created |
| `docs/decisions.md` | Evidence-backed records for significant technical spikes and deviations | Proposed by build spec; not created |
| Milestone document | Reconciled reconstruction-quality specification for a declared complete milestone | Create only when the user declares the app complete to the desired scope |

Do not create the test record or decisions log just to populate the folder. Create them when M1/M5 or later work makes their distinct purpose useful. This maintenance file remains the one current operational document.

## Roadmap and milestone state

The build spec maps its milestones to the design document's stages. The sequence below is the current proposed order; it is not a claim that future features are approved in every detail.

| Milestone | Purpose | Current state / gate |
|---|---|---|
| M1 | Baseline, code map, candidate/tag inventory, automated test harness, deterministic fixtures, golden 0.3.0 project and CI expansion | Code map started here; tag inventory and test infrastructure remain pending. No behavior change intended. |
| M2 | Verify and accept sampler candidate 0.4.1 | Candidate implemented; run the 11 design checks, automate boundary/playback/persistence/regression checks, and perform human audio-quality checks. |
| M3 | Verify and accept canvas candidate 0.5.0 | Candidate implemented; run the seven canvas checks, automate gesture/control checks, and confirm real-mouse feel. |
| M4 | Source retention, deduplication, storage safety and recoverable project opening | Planned. Requires user confirmation before changing the design's fresh-internal-ID-on-import behavior. |
| M5 | Research and prototype the note-triggered voice engine | Planned SPIKE before instrument implementation. Compare Tone.js Sampler with trimmed/full buffers and a custom AudioBufferSourceNode voice; measure region support, envelopes, looping, polyphony, voice stealing, memory, CPU and latency. Build a minimal voice API and record the evidence-backed decision. |
| M6 | Sample-based instruments and live MIDI input | Planned: root note, polyphony, envelopes, velocity, hold/loop behavior, Web MIDI device selection, arm/receive behavior and stuck-note protection. Computer-keyboard piano fallback is only a proposal. |
| M7 | Master tempo and synchronization | Planned SPIKE for repitch vs pitch-preserving stretch; check licenses. Then original-tempo markers, effective tempo, quantized start and phase-aligned loops. |
| M8 | Slicing and drum racks | Planned SPIKE comparing Ableton Live and Bitwig conventions; transient/beat/region/manual slicing, non-destructive shared source, pad mapping, per-pad level and possible choke groups. |
| M9 | Audio/control graph, effects racks and routing | Planned: explicit typed graph, validated ports/edges, cycle rules, graph persistence, generated React Flow edges, modular filter/delay/reverb/distortion/compressor nodes and sidechain research/fallback. |
| M10 | Automation and LFOs | Planned: parameter registry, compatible control connections, tempo-locked looping automation patterns and LFO modulation. |
| M11 | Recording, export, recovery and desktop evaluation | Planned: record master output (and possibly individual sound things), offline graph export, recovery snapshots, and evidence-based Tauri decision. |

### M1 baseline and test-harness tasks

- Confirm the code map and persisted-field ownership in this document.
- Inspect Git tags before creating any; the build spec calls for tags for the 0.3.0 accepted baseline and 0.4.1/0.5.0 candidates if they are missing. The tag inventory has not yet been verified.
- Add the smallest suitable Vitest and Playwright setup, deterministic audio fixtures and dev-only test hooks.
- Obtain a real 0.3.0 project fixture from the accepted build; do not fabricate a golden fixture from current code.
- Verify test hooks are absent from production output.
- Extract pure `planPlayback` / `playheadAt` logic only if it can be done without behavior changes; otherwise make that the first sampler refactor after the test foundation.
- Expand CI only after the local test commands are stable and deterministic.

### Candidate acceptance inventories

**0.4.1 sampler:** verify region bounds and displayed duration (including dragging past source edges); One-Shot starts/ends exactly at selected boundaries; Loop repeats only the selected region and remains clean across multiple loops; pause/resume position; rate/level changes; independence of two sound things sharing a source; workspace and project persistence; 0.3.0 compatibility; keyboard-accessible start/end sliders with values exposed in seconds. Human checks include listening for buzzing/clicks and one normal-use session.

**0.5.0 canvas:** MiniMap/control contrast; selection rectangle; group movement; ordinary single-node movement; middle-mouse pan without changing selection; controls inside nodes do not trigger drag/selection; zoom and MiniMap navigation. Human check: gestures feel right with a real mouse.

Detailed step-by-step criteria remain in the design document and build spec; this list is the maintenance test inventory summary.

## Storage and project safety work (M4)

The build spec identifies these concrete improvements:

- SHA-256 content hashes on import; reuse matching sources and remap references rather than storing duplicates. Keep existing opaque source IDs stable for existing data and backfill hashes on first load.
- Reference-aware cleanup: delete a source only when no sound thing references it and no active operation uses it; never clean up during playback.
- Import warning for long or memory-heavy audio (proposed defaults: 10 minutes of stereo audio or approximately 100 MB decoded).
- Request persistent browser storage with `navigator.storage.persist()`; show whether the request was granted and warn if denied.
- Before replacing a workspace on project open, retain one recoverable previous-workspace slot and prompt for unsaved changes.
- Validate the complete archive before touching the current workspace; apply an open atomically so a failed import cannot leave a half-replaced workspace.
- Test repeated project opens, shared-source deletion, randomized reference lifecycles, restore-previous-workspace, large-file warnings, golden fixtures and browser restart/site-data behavior.

### Open-project safety target

The proposed flow is: validate and migrate the project first; if the current workspace has unsaved changes, ask before replacing it; retain the current workspace in one recoverable slot; import/remap sources; commit the new workspace only after all required steps succeed; offer **Restore previous workspace** after a successful replacement. Failure should leave the previous workspace usable and should not leak newly imported unreferenced sources.

**Decision boundary:** content-hash reuse changes the design document's current fresh-internal-ID-on-import decision. The build spec explicitly requires the user's approval before starting this change. Do not implement it merely because it is in the roadmap.

## Architecture contracts for future work

These are target contracts, not current implementation facts:

1. The audio engine should expose a small framework-independent API for loading sources, creating voices, applying settings, playing/stopping, reading playhead state, disposal and events.
2. Sampler calculations should be pure and independent of Tone.js and wall-clock APIs.
3. Application state should own sound things, sources, project data and (from M9) the typed audio/sync/control graph.
4. React Flow renders the graph and handles spatial interaction; it must not become the authority for audio routing, synchronization or modulation.
5. The application owns source retention/reference counting; the audio engine owns decoded buffers/voices only while the application says they are live.
6. Every player, voice and analyser needs an explicit disposal path; callbacks must not fire after disposal.
7. The future audio graph uses typed `audio`, `sync` and `control` ports. Connections must be validated; audio cycles are rejected unless an explicit delay makes them safe. The application graph is authoritative and is compiled into Web Audio nodes.
8. Project format changes require migrations. Accept older supported versions through a migration chain, reject newer versions with a clear version-specific error, validate before modifying the workspace, and never partially apply a failed open.
9. Keep audio source bytes immutable; transformations create new source assets and preserve provenance.

## Risks and non-goals

### Known project risks

| Risk | Current mitigation / required response |
|---|---|
| 0.4.1 and 0.5.0 may contain regressions | Verify before feature expansion; do not infer acceptance from user saying an interaction is pretty good |
| Project format changes could break saved work | Golden fixtures and explicit migrations are not implemented yet |
| Storage grows with repeated imports/opens | M4 content-hash reuse and safe reference cleanup |
| Browser storage can be evicted; decoded audio can consume substantial memory | Persistent-storage status and import-size warnings are planned |
| Opening a project replaces the current workspace | Recoverable previous-workspace slot and unsaved-change prompt planned |
| Voice architecture may constrain instruments/drum racks | M5 measured spike before M6/M8 |
| MIDI support and latency vary by browser/device | Feature detection, clear unsupported-browser message and human hardware tests |
| Time-stretch libraries may have restrictive licenses | Check license before selection in M7 |
| Web Audio has no native external sidechain input | M9 AudioWorklet/ducker spike with fallback to no sidechain |
| Automated checks cannot judge sound quality | Combine signal/analyser/offline-render checks with human listening |
| Canvas and audio graph can drift apart | Application graph is authoritative; generate canvas edges from it and test consistency |

### Non-goals from the current build spec

Do not build these unless the user deliberately changes scope:

- VST or other third-party plugin support.
- MIDI-file import, MIDI output to hardware, or MIDI System Exclusive support.
- A conventional timeline/arrangement view; automation is currently planned as looping patterns locked to master tempo, keeping the canvas non-timeline.
- Cloud sync, accounts, collaboration, telemetry, backend services or network requirements.
- Mobile-first layout or Safari support.
- A rewrite of existing canvas/audio code purely for style.
- Changes to accepted 0.3.0 behavior outside a recorded milestone.

The build spec proposes current Chrome and Edge as supported targets, Firefox as best-effort for playback, and Safari as unsupported. This browser policy is marked **proposed / not yet confirmed by the user**. Web MIDI must be feature-detected and permission requested from a user gesture if/when M6 is implemented.

## Open decisions and deferred UX questions

- **Live sample-boundary editing:** should playback continue while dragging start/end? If yes, should changes affect the current voice immediately, only the next trigger, or be selectable? Current behavior stops playback on boundary changes.
- **Project import identity:** should matching imported audio reuse existing internal source IDs via content hash? User approval required before M4.
- **Open-project recovery:** confirm the proposed restore-previous-workspace and unsaved-change prompt behavior when M4 is designed.
- **Large-file warnings:** confirm practical warning thresholds and user-facing behavior before implementation.
- **Browser support:** Chrome/Edge target and Firefox best-effort remain proposed, not confirmed.
- **Computer-keyboard instrument input:** optional M6 proposal; not yet adopted.
- **Canvas gestures:** selection/move/pan are implemented and user-reported as pretty good; opening and playing gestures remain open.
- **Source retention/provenance:** future transformations should preserve source lineage and never silently mutate a shared source.
- **Audio architecture choices:** voice engine, time-stretch, transient detection, sidechain and desktop packaging each require the research/spikes described in the build spec.
- **Effects, connection types, automation, LFOs, original-tempo markers, recording and desktop capabilities:** use the build spec's milestone spikes and acceptance criteria rather than deciding them prematurely.

## Maintenance rules

- Keep this as the single current maintenance document; update it in place. Git history is the archive.
- Keep the design document focused on vision, principles and product decisions; keep the build spec focused on milestone plans and detailed acceptance criteria.
- Update the current state and code map when implementation changes. Distinguish designed, implemented, source-checked, runtime-tested, user-confirmed, accepted and deferred work.
- Preserve persisted field names and project compatibility. Any data-shape change needs an explicit migration/compatibility plan.
- Do one milestone at a time. Inspect the existing code before editing; do not implement a roadmap item merely because it appears in the build spec.
- Verify against the exact commit. Report PASS, FAIL, BLOCKED or NOT RUN honestly. User-run checks and automated checks are different evidence.
- Prefer the existing stack and dependencies. Justify new dependencies by a concrete need.
- Do not add backend services, analytics or network requirements; the project is browser-first and local.
- The user prefers direct commits to `main` for this solo project, one living document per purpose, and Git history for provenance. Avoid unnecessary versioned document copies or PR overhead.
