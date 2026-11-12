---
name: Soundthing Build Spec
type: build-spec
version: 0.1.0
status: ready-to-implement (S3)
workflow: Development State Machine Workflow
workflow_version: 1.6.0
source_design: Soundthing Initial Design v0.1.4
---

# Soundthing: Build Specification (continuation of the existing prototype)

The initial design says what Soundthing is. **This document says what to build next on top of the code that already exists**, in what order, and how each step is proved. Unlike a greenfield spec, it starts from a baseline, treats the existing code as the source of truth for names and structure, and adds the verification the project is currently missing.

Where this spec and the design doc disagree, this spec wins for the next milestones, and every disagreement is listed in section 11.

---

## 0. Instructions for the LLM builder

1. **Inspect before changing.** M1 begins by reading the repository, the design doc, any existing maintenance and test records, `git log` and `git tag`. Do not rewrite working code to match this spec's wording.
2. **Existing code wins on names, this spec wins on behavior.** Keep existing file, type and persisted-field names. If a persisted name differs from section 4, keep the code's name, add a mapping note to `docs/decisions.md`, and never rename persisted fields without a migration.
3. **Preserve the accepted baseline.** `0.3.0` is the last accepted version (section 1). Do not change its behavior except through a recorded, tested milestone.
4. **Build one milestone at a time** (section 6). Do not start milestone N+1 until every acceptance test for milestone N passes or is explicitly marked BLOCKED with the user's acceptance.
5. **Never claim a check passed unless you ran it against the exact commit.** Mark what you cannot run as BLOCKED or NOT RUN with the reason and the minimum human action needed. You cannot hear audio or plug in a MIDI keyboard; those checks are human (section 5.4).
6. **Keep three layers separate:** the visual canvas (React Flow), the application state, and the audio engine. React Flow nodes and edges never become the authority for audio routing, sync or modulation (section 3).
7. **Spikes decide, not guesses.** Milestones marked SPIKE end with a written decision in `docs/decisions.md` that cites evidence (measurements, docs, license text). If the spike fails, apply the stated fallback instead of improvising.
8. If a requirement is ambiguous, pick the simplest reading, record it in `docs/decisions.md`, and continue.
9. Tests are part of the deliverable. Code without tests for its acceptance criteria is not done.
10. At the start of every session, read `docs/MAINTENANCE.md` and `docs/TEST_RECORD.md` to recover state. If something needed is missing or inconsistent, say so and recover from Git before asking the user.
11. Never commit secrets, and do not add network services: this is a local, browser-first app with no backend.

---

## 1. Current state (from the design doc; verify against the repo in M1)

| Version | Status | Evidence recorded | Not yet verified |
|---|---|---|---|
| **0.3.0** | **Accepted baseline.** Canvas with pan/zoom and movable nodes, drag-and-drop import, waveform previews, Play/Pause/Resume/Stop, Loop, rate and level, shared-source duplicates, IndexedDB working storage, portable `.soundthing` save/open. Commit `30292c3e1931906addb8e274dae7f3307f867b04`. | TypeScript check and Vite build passed in CI (run 42763305503). User-run browser checks passed: playback controls, simultaneous playback, independent settings, local save/restore, `.soundthing` round trip in the same browser and a separate Chrome profile, survives moving or renaming the original file, 3 to 5 simultaneous sound things, shared and unshared sources together. | Opening a project on another device. Suitability for routing and modulation. |
| **0.4.1** | Candidate, implemented. Sample-region selection (draggable waveform region and boundaries, start/end sliders, region length), One-Shot and Loop modes where Loop repeats the whole selected region, per-sound-thing sampler settings, persisted in IndexedDB and archives, defaults for 0.3.0 files. | Committed. Nothing else recorded. | **Everything** (build and the 11 checks in M2). |
| **0.5.0** | Candidate, implemented. Dark MiniMap and zoom controls, left-drag box selection, group move, middle-drag pan, controls inside nodes must not start drags. | Implemented. Nothing else recorded. | **Everything** (build and the 7 checks in M3). |

**Automated test coverage recorded in the design doc is only the TypeScript check and the production build.** Every behavioral check so far was run by hand. Closing that gap is the first job (M1), because every later milestone depends on it.

Design stages 3 to 8 (instruments and MIDI, tempo sync, slicing and drum racks, effects and routing, automation and LFOs, recording and recovery) are not started.

---

## 1A. Workflow adoption (Development State Machine)

Recorded per the workflow's setup rules. The workflow lives in the Meta-Modules repository and is linked, not copied. If the builder cannot access it, say so and follow this section. Use the repo's existing document paths where they already exist; otherwise create the ones below.

| Item | Value |
|---|---|
| Adopted workflow | Development State Machine Workflow, internal `version: 1.6.0` (adoption provenance; follow the current canonical workflow unless a pin with a Git SHA or tag is recorded) |
| Optional module | Testing and Verification |
| Initial design | the Soundthing initial design document (v0.1.4) |
| Ready-to-implement spec (S3) | this file |
| Maintenance document | `docs/MAINTENANCE.md` |
| Latest test record | `docs/TEST_RECORD.md` |
| Decisions log | `docs/decisions.md` |
| Milestone document | created only at S11 |

Adaptations:

1. **Milestones are workflow passes.** M2 and M3 are S6 to S9 passes over code that already exists. M4 onward are full S4 to S10 passes. The acceptance tests under a milestone are its S3 criteria.
2. **Versioning (SemVer).** The app version is in `package.json`. A feature milestone bumps MINOR from the last accepted version; a repair bumps PATCH. Milestone numbers do not equal version numbers; record the mapping in `docs/MAINTENANCE.md`. The `.soundthing` `formatVersion` is a separate integer that changes only when the persisted shape changes (section 4.3).
3. **Candidate, failed, accepted.** Tag every candidate in Git (`v0.4.1`). Never move or reuse a tag. A failed candidate keeps its tag and evidence; the repair gets a new tag. Acceptance status lives in `docs/MAINTENANCE.md`.
4. **Living documents.** Each document is one file, updated in place; Git history is the archive. No versioned copies.
5. **Evidence.** Record PASS, FAIL, BLOCKED or NOT RUN per check in `docs/TEST_RECORD.md` with the commit, commands and results. A BLOCKED critical check prevents acceptance unless the user explicitly accepts the documented limitation.
6. **Expected human-run checks:** listening quality, anything with a physical MIDI keyboard, other devices and browsers, and anything on a clean machine.

---

## 2. Locked decisions

| Area | Decision |
|---|---|
| Runtime | **Browser-first.** Supported: current Chrome and Edge. Firefox is best-effort for playback. Safari is not a target. Web MIDI is feature-detected, and unsupported browsers get a clear message. *(Proposed default, confirm.)* |
| Existing stack | Keep: Web Audio API, **Tone.js**, **React + TypeScript**, **React Flow (`@xyflow/react`)**, **Vite**, **IndexedDB**, `.soundthing` ZIP archives. Keep whatever ZIP, validation and state libraries the repo already uses. |
| Audio and canvas | Separate layers (section 3). React Flow is visual only. |
| Tauri | Deferred until M11 evaluates it. |
| New dev dependencies | `vitest`, `@playwright/test`, and (only if needed for M9) nothing else. Anything else needs a one-line justification in `docs/decisions.md`. |
| Plugins (VST etc.) | Not in scope (section 8). |
| Network | None. No backend, no analytics. |
| Time units | Sample regions and markers are stored **in seconds relative to the original source**. Tempo-related values are stored in BPM and beats. |

---

## 3. Architecture contracts

Three layers with one-way dependencies:

```
UI (React, React Flow)  ->  App state (sound things, sources, project)  ->  Audio engine (Tone.js / Web Audio)
        view + gestures         the authority for what exists               owns buffers, players, voices
```

1. **Audio engine** exposes a small API and knows nothing about React or React Flow: `loadSource(sourceId, blob)`, `createVoice(soundThing)`, `applySettings(id, settings)`, `play(id)`, `stop(id)`, `getPlayhead(id)`, `dispose(id)`, plus `onEvent` for ended/error. Decoded buffers are shared per source; players are per sound thing.
2. **Sampler math is pure** and lives in its own module: `planPlayback(settings, sourceDuration) -> { offset, duration, loop, loopStart, loopEnd }` and `playheadAt(plan, rate, elapsed)`. No Tone.js, no `Date`. This is what makes sampler behavior unit-testable.
3. **Engine graph (from M9):** audio, sync and control relationships live in an explicit graph model owned by the application state: typed nodes (sound thing, effect, modulation source, master) and typed ports (`audio`, `sync`, `control`). React Flow edges are a **rendering of that graph**, never the source. The graph is persisted in the project and compiled into Web Audio nodes by the engine.
4. **Source retention:** the application owns source records and reference counting; the engine only holds decoded buffers for sources the application says are live.
5. **Disposal:** every created player, voice and analyser has an explicit dispose path. No callback may fire after dispose (the design doc already records stale-callback bugs; add a regression test for each one found).

---

## 4. Data contracts

Where existing code differs, follow section 0 rule 2.

### 4.1 Source record

```
Source { sourceId, name, mimeType, byteLength, durationSeconds, sampleRate, channels, contentHash (sha-256 hex), importedAt }
```

Audio bytes are immutable. Rendered or edited audio creates a **new** source and keeps the old one.

### 4.2 Sound thing

```
SoundThing {
  id, name, sourceId, position {x, y},
  mode: 'sample' | 'instrument' | 'drumRack',          // 'sample' until M6/M8
  sampler: { sampleStart, sampleEnd,                    // seconds; 0 <= start < end <= source duration
             playbackMode: 'oneShot' | 'loop',
             playbackRate, level },
  originalTempo?: { bpm, source: 'user' | 'detected' }, // M7
  instrument?: { rootNote, polyphony, envelope, ... },  // M6
  drumRack?: { slices: [...], pads: [...] },            // M8
  createdFrom?: { soundThingId, operation }             // provenance
}
```

Invariants (enforced in code and tested): `0 <= sampleStart < sampleEnd <= durationSeconds`; minimum region length is a named constant (default 10 ms); legacy `loopStart`/`loopEnd` fields are tolerated on load and ignored by playback; many sound things may share one `sourceId`.

### 4.3 Project file (`.soundthing`) and migrations

- ZIP archive with a JSON manifest containing an integer `formatVersion`, the workspace, and the referenced audio assets.
- **Loader rules:** accept every older `formatVersion` through a chain of `migrate_N_to_N+1` functions; reject a newer version with a clear message that names both versions; validate before touching the workspace; never partially apply a failed open.
- **Golden fixtures:** before any format change, save a real project from the accepted `0.3.0` build (and one from `0.4.1` once accepted) into `test/fixtures/projects/`. Every future build must open every golden fixture. This is the main protection against breaking users' saved work.

### 4.4 Open-project safety

Opening a project replaces the visible workspace. Before replacing, keep the previous workspace in a single recoverable slot ("Restore previous workspace") and ask for confirmation if there are unsaved changes since the last save or export.

---

## 5. Test strategy

### 5.1 Tools

- **Vitest** for pure logic: sampler math, manifest validation and migrations, source reference counting, MIDI message parsing, the graph model.
- **Playwright (Chromium)** for the real app: import, canvas gestures, persistence, project round trips, and engine checks run inside the page.
- **CI** (GitHub Actions): `npm ci && npm run typecheck && npm test && npm run build && npm run test:e2e`. All must pass for a candidate to be accepted.

### 5.2 Deterministic audio fixtures

Generate test audio in code (no binary files committed beyond golden projects):

- `makeToneWav({ segments: [{ freq: 440, seconds: 1 }, { freq: 880, seconds: 1 }, { freq: 1320, seconds: 1 }] })`: three distinct tones, so the **dominant frequency identifies which part of the source is playing**.
- `makeClickWav({ clicksAtSeconds: [...] })`: impulses at known times, for slicing and tempo tests.

### 5.3 Test hooks

A dev-only module `window.__soundthingTest` exposes a master `AnalyserNode`, a `dominantFrequency()` helper, an `rms()` helper, engine inspection and `renderOffline(...)`. It is compiled in **only** when `VITE_TEST_HOOKS=1`; a production build must not contain it (tested).

### 5.4 What is automated and what is human

| Automated (builder runs) | Human (user runs) |
|---|---|
| Signal is produced, stops when told to, starts and ends at the right region (analyser, offline render) | Whether it sounds clean (clicks, buzzing, artifacts) |
| Loop wraps at the region boundary with no discontinuity above a threshold (offline render) | Time-stretch and pitch quality |
| Pause then resume continues from the right position (fake clock plus analyser) | Feel and latency when playing a keyboard |
| Canvas gestures, selection, drag, and that controls do not start drags | A real MIDI keyboard, device hot-unplug |
| Save, open, golden fixtures, migrations, storage behavior | Another device, another browser, a clean machine |
| MIDI logic from synthetic messages | Physical-device quirks |

### 5.5 Performance

Record a baseline (frame times while panning with 20 and 50 nodes, decode time and memory for a long file) in `docs/TEST_RECORD.md`. Do not gate on numbers until a baseline exists; then set thresholds with the user.

---

## 6. Milestones and acceptance tests

Design-stage mapping: M1 to M5 prepare and complete Stage 2; M6 is Stage 3; M7 is Stage 4; M8 is Stage 5; M9 is Stage 6; M10 is Stage 7; M11 is Stage 8.

### M1: Baseline and test harness (no behavior change)

Inspect the repo and write the code map into `docs/MAINTENANCE.md` (where the engine, sampler, storage, project I/O and canvas live, and which file owns each persisted field). Tag the existing candidates if tags are missing (`v0.3.0` at the commit above; the 0.4.1 and 0.5.0 commits). Add Vitest, Playwright, the fixture generators, the test hooks, the golden `0.3.0` project fixture, and the CI commands. Extract `planPlayback` and `playheadAt` as pure functions **only if** that can be done without changing behavior; otherwise record it as the first task of M2.
- Tests: CI runs all stages; the golden `0.3.0` fixture opens; the fixture generators produce the expected tones (a self-test using the analyser); a production build contains no `__soundthingTest`; existing 0.3.0 behavior is unchanged (replay the user's manual 0.3.0 checks as E2E where automatable).

### M2: Verify and accept candidate 0.4.1 (sampler)

Run the design doc's 11 acceptance checks and automate what can be automated. Fix defects as 0.4.2 and so on.
- Automated: (2) region and displayed length stay within the source and obey the invariants, including drag past the ends; (3) One-Shot plays the selected region only, and goes silent after its end, verified with the three-tone fixture; (4) Loop repeats the selected region and never plays outside it, verified over at least 3 loops, plus an offline render with no sample-to-sample discontinuity above a threshold; (5) pause then resume continues from the correct position in both modes; (6) changing rate and level while playing takes effect and keeps controls independent; (7) two sound things from one source with different regions do not affect each other; (8) save and reopen in the same browser; (9) export and reopen a `.soundthing`; (10) the golden `0.3.0` project loads with the full source selected and existing settings intact; (11) the 0.3.0 regression set passes. Also: start and end sliders are keyboard-operable and expose their value in seconds to assistive technology.
- Human: (3) and (4) "no buzzing" by ear; one session of normal use.
- Gate: all pass or are BLOCKED and accepted, then tag the accepted version.

### M3: Verify and accept candidate 0.5.0 (canvas interaction)

Run the 7 design checks and automate them in Playwright.
- Automated: MiniMap and control buttons have a dark background with at least 3:1 contrast against their icons (computed from the real styles); left-drag on empty canvas creates a selection rectangle and selects intersecting nodes; dragging one selected node moves the whole selection by the same delta; dragging an unselected node moves it normally; middle-drag changes the viewport transform without changing the selection; operating the waveform, transport and settings controls inside a node neither moves the node nor draws a selection rectangle; zoom buttons and MiniMap navigation still work. Interactive controls inside nodes use React Flow's `nodrag`/`nopan`/`nowheel` convention; verify the installed `@xyflow/react` version's docs for the exact props (`selectionOnDrag`, `panOnDrag` buttons) rather than assuming.
- Human: the interactions feel right with a real mouse.
- Gate: all pass, then tag the accepted version.

### M4: Source retention, dedupe and storage safety

Fixes real storage growth and data-loss risks found in the design doc (fresh source IDs on every project open leave unreferenced blobs; opening a project replaces the workspace; browser storage can be evicted). **Changes the design doc's "fresh internal IDs on import" decision, so confirm with the user before starting.**
- Compute `contentHash` (SHA-256) on import. When a project is opened or a file is imported and a source with the same hash already exists, **reuse that source and remap references** instead of storing a second copy. Keep source IDs opaque and unchanged for existing data (backfill hashes on first load).
- Reference counting and cleanup: a source is deleted only when no sound thing references it **and** no active operation uses it; cleanup runs on explicit save and never during playback. Removing one sound thing never affects another that shares the source.
- Import guard: warn above a configurable length or estimated decoded size (default warn at 10 minutes of stereo audio or about 100 MB decoded), because decoded audio can be several hundred MB.
- Request persistent storage (`navigator.storage.persist()`), show a small storage status, and show a warning if it is denied.
- Open-project safety (section 4.4).
- Tests: opening the same project 5 times leaves one blob per unique source; a fixture with two sound things sharing a source survives deleting one of them; an unreferenced source is collected and a referenced one never is (property test over random create/delete sequences); the golden fixtures still open; "Restore previous workspace" returns exactly the prior state; the size guard triggers on a generated long file. **Human:** behavior after clearing site data and after a browser restart.

### M5: SPIKE, voice engine for note-triggered playback

Decide how pitched, polyphonic, enveloped sample playback will work. Compare, with measurements: (a) Tone.js `Sampler` using a trimmed copy of the selected region (it does not appear to support a start/end offset per sample, so the region would have to be copied, costing memory); (b) a small custom voice built on `AudioBufferSourceNode.start(when, offset, duration)` with a gain envelope; (c) Tone.js `Sampler` with the full buffer. Evaluate: region support, loop-while-held, polyphony and voice stealing, release envelopes, memory with shared sources, CPU with 16 simultaneous voices, and scheduling latency (including whether Tone's context look-ahead, which defaults to about 100 ms, can be reduced for live playing; verify in the Tone.js version installed).
- Output: a decision in `docs/decisions.md` with numbers, plus a minimal working voice behind the engine API. **Fallback:** option (b), which needs no extra dependencies and supports regions natively.
- Tests: the chosen approach plays the region at the correct pitch ratio (`2^((note - rootNote)/12)`, verified by dominant frequency from the tone fixture); 16 overlapping voices produce no exceptions and are all disposed; release does not leave stuck voices.

### M6: Instruments and live MIDI input (design Stage 3)

- Sound thing `mode: 'instrument'` created from a sample (non-destructive: a new sound thing referencing the same source). Settings: `rootNote` (default MIDI 60), `polyphony` (default 8, oldest-voice stealing), ADSR-style envelope, velocity sensitivity, hold behavior (play through, or loop the selected region while the key is held).
- **MIDI via Web MIDI:** feature-detect, request access on a user gesture, list devices, handle connect and disconnect, parse note-on, note-off (and note-on with velocity 0), channel (omni by default, optional filter), velocity. No SysEx. CC messages are not handled yet.
- **Receiver:** an explicit **Arm** toggle on an instrument sets which sound thing receives notes. With none armed, notes go to the selected instrument. The receiving sound thing shows a visible MIDI badge, and the UI says so when nothing can receive.
- **Stuck-note protection:** all notes off on device disconnect, on disarm, on window blur and on page hide.
- *(Proposed addition, drop if unwanted)*: a computer-keyboard piano fallback so instruments can be played and tested without a MIDI device.
- Tests: a MIDI message parser unit suite from synthetic bytes (including running status is not assumed, velocity-0 note-on, channels); a mocked `MIDIAccess` drives note on/off end to end; a disconnect mid-note releases all voices; arming routes notes to the right sound thing and only that one; playing two chords at once respects polyphony; persisting and reopening restores instrument settings (golden fixtures still open, `formatVersion` migration added); unsupported-browser message appears when `requestMIDIAccess` is missing. **Human:** a real keyboard, including unplugging it while a note is held, and the feel and latency.

### M7: Master tempo and synchronization (design Stage 4)

- **SPIKE first:** time-stretch options for synchronized loops. Compare repitch (`playbackRate`, changes pitch), Tone.js `GrainPlayer` (pitch-preserving, granular artifacts), and WASM stretchers. **Check every candidate's license** before considering it (some well-known stretch and analysis libraries are GPL or AGPL, which affects distribution) and record it. BPM detection is optional: keep manual entry and tap tempo as the primary way to set an original tempo.
- Master tempo on the transport. Each sound thing shows its **original tempo marker**, its **master-following state** and its **effective tempo** as three distinct things (design section 9). Sync mode per sound thing: off, repitch or stretch (stretch only if the spike supports it). Quantized start: none, beat or bar. Phase alignment: a loop started mid-bar joins at the correct loop offset, not at zero.
- Tests (offline render of click-track fixtures, onset detection): at master 90 BPM a 120 BPM 4-beat loop plays at rate 0.75 (repitch); two synchronized loops started on different beats stay aligned across at least 8 bars with onset error within a tolerance agreed in the spike; changing master tempo while playing applies without a gap above a threshold; the original-tempo marker is unchanged by sync. **Human:** stretch quality.

### M8: Slicing and drum racks (design Stage 5)

- **SPIKE first:** document, with sources, how Ableton Live (Simpler slicing, Drum Rack) and Bitwig Studio (Sampler, Drum Machine) behave: slice modes (transient, beat, region, manual), sensitivity, pad layout, default note mapping (assume pads start at MIDI note 36 unless the research says otherwise), choke groups, and what slicing creates. The design requires following these conventions.
- Implement an onset (transient) detector yourself unless the spike finds a suitable permissively licensed library. Slice markers are stored in seconds on the sound thing; the source is never cut.
- "Create drum rack" produces a **new** sound thing sharing the same source (non-destructive). Pads trigger a slice from the pad click, MIDI and the keyboard fallback; per-pad level; choke groups if the spike confirms them.
- Tests: the detector finds clicks from the click fixture within 10 ms (tunable) with no false positives on silence; markers always stay inside the source and in order; a drum rack and its parent play independently from one source; deleting the parent leaves the rack working; pad mapping matches the spike's documented layout; golden fixtures still open. **Human:** slicing real drum loops against Ableton/Bitwig behavior.

### M9: Audio/control graph, effects racks and routing (design Stage 6)

- Build the engine graph (section 3): typed ports, edge validation (type compatibility, no audio cycles except through a delay), compile and incremental re-apply, persistence in the project, React Flow edges drawn from it with a distinct visual per connection type.
- Effects v1 as modular nodes (not built into sound things): filter, delay, reverb, distortion, compressor, using Tone.js built-ins. A rack is the visible chain beneath a sound thing; bypass per effect.
- **SPIKE: sidechain.** The Web Audio `DynamicsCompressorNode` has no external sidechain input. Evaluate an `AudioWorklet` envelope follower driving a gain node (a "ducker") and a worklet compressor. Fallback if the spike fails: ship routing and effects without sidechain and record it as deferred.
- Tests (offline render): bypass equals the dry signal; effect order changes the output; deleting a node or edge disconnects audio (no orphan sound); a cycle is rejected with a clear message; the graph round-trips through save/open; adding or removing an effect while playing causes no exceptions and no stuck audio; the canvas edges always match the graph (generated by property test). **Human:** how the effects sound.

### M10: Automation and LFOs (design Stage 7)

- A parameter registry: every controllable parameter has an id, range, scale and unit. LFO nodes (shape, rate in Hz or tempo-synced, depth, target mapping) connect to compatible parameters through `control` edges. Automation lanes are **looping patterns locked to the master tempo**, keeping the canvas a non-timeline.
- Tests (offline render): an LFO at a known rate modulates a target within the expected range and period; removing the connection restores the static value; automation follows the master tempo change; the incompatible-target connection is refused; persistence round-trip.

### M11: Recording, export, recovery and desktop evaluation (design Stage 8)

- Record the master output (and, if the spike supports it, an individual sound thing) to a new **source**; export the whole graph to WAV by rendering offline through the same engine; periodic recovery snapshots of the workspace; revisit the storage and Tauri questions.
- **SPIKE:** whether browser limits (storage, file access, MIDI support, audio latency) justify Tauri. Write the decision with evidence.
- Tests: an offline export of a known graph matches the expected signal (tone fixture, effect chain); a recording becomes a normal source and can be used by new sound things; a crash-and-reopen restores from the latest snapshot with at most the agreed loss window; export of a project with shared sources does not duplicate audio.

---

## 7. Risks

| Risk | Where | Mitigation |
|---|---|---|
| Candidates 0.4.1 and 0.5.0 are unverified and may contain regressions | M2, M3 | Verify first; no new features until accepted |
| Saved projects break when the format changes | every format change | Golden fixtures plus migration chain, from M1 |
| Storage growth and eviction of imported audio | M4 | Hash dedupe, cleanup, persistent storage request, import guard |
| Large decoded buffers exhaust memory | M4 | Length and size guard; record memory baseline |
| Voice engine choice constrains instruments and drum racks | M5 | Spike before M6 and M8 |
| MIDI support and latency differ by browser | M6 | Feature detection, clear messages, Chromium as the target |
| Time-stretch libraries carry restrictive licenses | M7 | Check licenses in the spike |
| No native sidechain in Web Audio | M9 | Worklet spike with a documented fallback |
| Audio quality cannot be verified by automation | all | Analyser and offline-render tests for signal correctness; human checks for quality |
| Graph and canvas drift apart | M9 | The graph is authoritative; edges are generated; property test |

---

## 8. Non-goals (do NOT build yet)

- VST or other third-party plugin support, MIDI file import, MIDI output to hardware, SysEx.
- A conventional timeline or arrangement view (automation patterns are loops locked to master tempo).
- Cloud sync, accounts, collaboration, telemetry, a backend.
- Mobile-first layout, Safari support.
- Rewriting the existing canvas or audio code for style.
- Any change to the accepted `0.3.0` behavior outside a recorded milestone.

---

## 9. Definition of done for each milestone

- Its acceptance tests pass, or each BLOCKED check is documented and explicitly accepted by the user.
- CI passes for the exact tagged commit (`typecheck`, unit tests, build, E2E).
- All golden project fixtures still open.
- The candidate is tagged, and `docs/MAINTENANCE.md` records the accepted version, evidence, deferred items and any decision that deviated from this spec.
- `docs/TEST_RECORD.md` lists PASS, FAIL, BLOCKED and NOT RUN for that commit.
- Nothing is described as accepted that was only implemented.

---

## 10. Resolved and open design questions

| Design question | Status |
|---|---|
| Primary gestures for creating, moving and selecting sound things | Settled by 0.5.0 (box select, group move, middle-drag pan), pending M3 verification. Opening and playing gestures stay open. |
| How playback modes are presented | One-Shot and Loop in 0.4.1; instrument and drum rack modes arrive in M6 and M8. |
| Source retention and cleanup | M4. |
| Which Ableton and Bitwig slicing and drum-rack behaviors to match first | M8 spike. |
| Effect racks, connection types, wire visuals | M9. |
| Automation and LFO creation and linking | M10. |
| Original-tempo marker versus master and effective tempo | M7. |
| Minimum recording and persistence workflow | M11, with M4 storage safety first. |
| Tauri and desktop capabilities | M11 spike. |
| Plugin formats | Deferred, not in scope. |

---

## 11. Differences and housekeeping against the design doc (v0.1.4)

| Item | Resolution |
|---|---|
| Source IDs: fresh internal ID on every project import | M4 adds a content hash and reuses existing sources, because the current approach grows storage on every open. Needs the user's approval. |
| "Open project replaces the visible workspace" | M4 adds a recoverable previous-workspace slot and an unsaved-changes prompt. |
| Verification is manual and the CI checks only typecheck and build | M1 adds unit tests, E2E tests with deterministic audio fixtures, and CI gates. |
| Candidate naming: the doc says "0.4.0", "0.4.0 to 0.4.1" and "candidate 0.4.1" in different places | The candidate is **0.4.1**; the design doc should be corrected in place. |
| Candidate 0.5.0 is described under "Stage 2" | Keep as an implemented candidate; it is accepted in M3, independent of Stage 3. |
| Section 10 numbering: question 3 appears twice | Renumber in place. |
| Stray `<badge>` markers in the acceptance lists | Replace with plain PASS/FAIL text. |
| Browser support is not stated | Section 2 proposes Chrome and Edge as targets. |
| Computer-keyboard instrument fallback | Proposed addition in M6, not in the design doc. |
