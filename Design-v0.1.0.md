# Soundthing: Initial Design v0.1.0

- **Artifact:** Initial design
- **Version:** 0.1.0
- **Status:** Initial design candidate, not an implementation specification
- **Development workflow:** [Development State Machine Workflow v1.6.0](https://github.com/KRMRGold/Meta-Modules/blob/main/workflows/Development-State-Machine-Workflow.md)
- **Workflow adoption:** Soundthing initially adopted workflow v1.6.0. It follows the current canonical version by default; this records the starting point, not a permanent version pin.
- **Collaboration guidance:** The applicable [Meta-Modules](https://github.com/KRMRGold/Meta-Modules) are summarized in Section 11.

## 1. Vision

Soundthing is an instrument-centered music creation environment built around an infinite spatial canvas rather than a conventional timeline-first DAW.

Sound things are self-contained, independently playable musical objects. Each sound thing is its own instrument or sound-making unit, with its own playback behavior, controls, and optional processing. Users can play them individually or in combination.

The canvas is the shared spatial workspace where sound things live. It provides a place to create, arrange, select, inspect, and interact with them; it is not itself the instrument, and it is not a conventional timeline. A sound thing remains an independent playable object wherever it is positioned on the canvas.

The goal is not to recreate an existing DAW feature for feature. Soundthing draws inspiration from the immediacy of DJ stations and instruments, the creative depth and routing of Ableton Live and Reason, the sample-focused workflows of Renoise, and the sequencing and production flexibility of FL Studio. It should bring these ideas together in a spatial, approachable interface that is easy to begin using and reveals deeper capabilities as users need them.

## 2. Workstation and Infinite Canvas

- The canvas is the shared spatial workspace in which sound things live.
- Each sound thing is an independent, playable entity with its own controls and playback behavior.
- A sound thing can be played, stopped, and configured on its own, and multiple sound things can play simultaneously.
- The canvas provides the context for creating, arranging, selecting, inspecting, and accessing sound things.
- Moving or arranging a sound thing on the canvas does not, by itself, change its musical behavior.
- Related sound things remain visually independent by default; users can inspect relationships and navigate between related objects when needed.
- Sound things can be connected with visible wires to establish relationships such as synchronization, audio routing, sidechains, or control/parameter links.
- Connections should communicate what they carry; audio, sync, and modulation/control links should be distinguishable rather than treated as one ambiguous kind of wire.
- Workstation-level controls may coordinate multiple sound things without replacing their individual controls or settings.
- Processing and routing relationships should be visible on the canvas while remaining understandable at a glance.

The canvas is not a timeline and is not itself the instrument. Musical sound is produced by the sound things and their connected processing/modulation components; the canvas is the spatial environment that holds and organizes them.

## 3. Sound Things

A sound thing is a playable sound object with its own configuration and behavior. It is created by dragging an audio file from a folder or file manager onto the canvas. The file can be dragged in from outside the visible application/canvas; dropping it creates a sound thing on the canvas.

A newly created sound thing can be used as an instrument, a loop, or another kind of sound-making object. The imported audio is the starting material, not a fixed instrument category. Its playback mode and configuration determine how it is used.

Examples include a looping sample, a sample played as a pitched instrument through MIDI, a sliced sample mapped to drum pads, a waveform-based instrument, or a recorded/live-looped sound.

A sound thing has its own identity, playback behavior, controls, and configuration. Multiple sound things can reference one shared audio source while keeping their own independent settings.

## 4. Audio Sources and Sampler Foundation

The sampler is the initial foundation for loading, recording, and manipulating audio.

An audio source is the underlying audio asset; it is distinct from the sound things that use it. Importing an audio file creates or registers a managed source that sound things can reference. If the original file is later moved or deleted from its folder, the imported source must remain available to sound things that already use it. A source must also remain available while it is actively in use. Removing one sound thing must not invalidate other sound things that reference the same source.

Multiple sound things can therefore share one underlying audio source without duplicating the audio unnecessarily. Their playback modes, slice maps, controls, and processing configurations remain independent.

A sound source can be used in different ways:
- Normal sample playback and looping.
- Pitched playback controlled by MIDI.
- Slicing and triggering individual regions.
- Mapping slices to a drum rack.
- Using waveform data as the basis of an instrument.

These are different uses of audio, not necessarily separate foundational instrument types. Optional effects, plugins, and specialized processing can extend them.

The initial design should establish a useful sampler and source-management foundation before expanding into more complex instrument types.

## 5. Transformations, Variations, and Independent Objects

Modifying or transforming a sound thing can create a new sound thing while preserving the original. This is a central iteration workflow: users can branch into different sounds, settings, or instrument treatments without losing the earlier version.

For example, a user can create a loop from an imported sound, make a pitched instrument from the same source, and then create a sliced/drum-rack version. Each resulting sound thing remains independently configurable, while all can reference the same underlying audio source where appropriate.

Creating a variation should not automatically duplicate the underlying audio data. It creates a new sound thing/configuration that can continue referencing the shared source. A transformation that genuinely renders or edits audio may create a new audio source, but should preserve the source and sound thing it came from.

The system should distinguish between:
- Creating a new sound thing or variation.
- Creating or rendering a new audio source.
- Editing the underlying audio data.
- Editing an object's playback, slice, or processing configuration.

The default iteration behavior is non-destructive: create a new sound thing and keep the original. The exact UI for choosing other behaviors can be designed later.

## 6. Slicing and Drum Racks

Slicing and drum racks should follow the established interaction concepts and expected behavior of their Ableton Live and Bitwig Studio counterparts, rather than introducing unfamiliar alternatives without a clear reason.

- A sample can be sliced into regions and used as individually playable triggers.
- A sliced/drum-rack result is its own sound thing, separate from the original.
- The rack exposes slices as pads/triggers that can be played and configured independently.
- Slice definitions should reference the shared audio source where practical, rather than destructively cutting or unnecessarily duplicating the audio.
- The original sound thing and source remain available for further iteration.

The exact feature parity, controls, and mapping details should be investigated against the relevant Ableton and Bitwig workflows before implementation.

## 7. Modular Effects, Routing, Automation, and LFOs

Effects are modular components that can be connected beneath a sound thing, forming a visible processing rack. The rack belongs to that sound thing's signal path and can be expanded as needed. Effects such as reverb, delay, distortion, filtering, and dynamics are examples; they should not be permanently built into every sound thing.

The modular approach should also allow sound things to be wired to one another. Connections can support different purposes, including:
- **Audio routing:** sending one sound thing's output into another path or destination.
- **Sidechains:** using one sound thing's signal to influence processing on another, such as a compressor.
- **Synchronization:** sharing timing or transport-related signals.
- **Control links:** allowing one sound thing or control to influence another sound thing's volume or other parameters.

These connection types should have clear visual identities and understandable behavior. A wire should make it apparent what is connected and what kind of relationship it creates. The exact routing model, connection rules, and signal-flow representation remain to be designed.

Automation and LFOs are also part of the creative system:
- **Automation** allows parameter values to change over time according to an editable pattern or recorded movement.
- **LFOs** provide repeating modulation that can influence parameters such as volume, filter cutoff, pitch, pan, or effect settings.
- Modulation sources should be connectable to compatible controls on sound things and effect modules, rather than being limited to one fixed destination.

The aim is to make these capabilities composable and visually understandable without forcing new users to confront a complex modular system immediately. Basic sound things should work on their own; racks, wires, automation, and modulation can be introduced progressively when the user wants more control.

Third-party plugin support, including VST compatibility, is a possible future capability. Its feasibility depends on the selected runtime and audio architecture, so it is not an established requirement for the first prototype.

## 8. Shared Sources, Relationships, and Provenance

Sound things should appear independent on the canvas unless the user chooses to inspect their relationships. Their shared audio source is a separate managed asset that can be referenced by multiple sound things.

Importing an audio file should make its audio available inside the workspace, so later moving or deleting the original file outside Soundthing does not break existing sound things. The source should remain retained while at least one sound thing references it or an active operation is using it. Source cleanup and deletion rules should avoid dangling references; the precise storage and garbage-collection mechanism remains an implementation decision.

Relationship information belongs primarily in metadata. It can record:
- The shared audio source and its stable identity.
- The sound thing or operation that first imported or used it, where relevant.
- The transformation that created an object.
- Relevant creation and configuration settings.
- Other sound things that reference the same source.
- A way to navigate between related objects.

This provenance should help users understand where a sound came from without cluttering the canvas with permanent connection lines. Sharing an audio source does not mean sharing playback settings or automatically propagating edits between sound things.

## 9. Master Tempo and Synchronization

Master tempo and master synchronization work as their names imply: the workstation provides a shared tempo reference and synchronization behavior for sound things that participate in it. Individual sound things can retain their own original tempo and playback characteristics while being synchronized to the workstation.

Each sound thing should visibly mark its original tempo. This marker preserves the source's tempo as a reference even when the sound thing is currently following master tempo or another synchronized playback rate. The marker is informational; it should not be confused with the current effective playback tempo.

The design should distinguish between:
- **Original tempo:** the tempo associated with the sound thing's source or initial analysis/configuration, shown by a persistent marker.
- **Master tempo:** the workstation-wide tempo reference.
- **Effective playback tempo:** the tempo at which the sound thing is currently playing after synchronization is applied.

Synchronization must account for more than matching BPM. Loop length, start position, rhythmic phase, and playback behavior may also affect alignment. The exact algorithms and controls remain technical design questions, but the intended user-facing model is master tempo/sync with each sound thing retaining a visible reference to its original tempo.

## 10. Technology Stack

### Initial prototype stack

The first playable-canvas prototype uses this stack as a working candidate. It is a scoped implementation choice, not a permanent commitment for the complete workstation.

- **Web Audio API:** native audio decoding and browser audio foundation.
- **Tone.js:** independent sample players and playback controls. The prototype decodes an imported source once, wraps the decoded buffer in a shared `ToneAudioBuffer`, and creates separate `Tone.Player` instances for sound things that reference it.
- **React + TypeScript:** interface and typed separation between canvas objects, source records, and audio operations.
- **React Flow (`@xyflow/react`):** spatial viewport, pan/zoom, node movement, and custom sound-thing nodes. It owns visual graph state, not audio routing or the audio engine.
- **Vite:** development server and production build.
- **IndexedDB:** local working storage for imported audio blobs and saved workspace configuration.
- **Portable project files:** versioned `.soundthing` ZIP archives containing a manifest, workspace configuration, and the audio assets referenced by that workspace.
- **Tauri:** deferred until desktop-specific capabilities justify it.

The current prototype has been exercised in a browser for core playback, simultaneous playback of two sound things, independent settings, and local workspace save/restore. Portable project-file save/open has now been implemented in source, but its browser download/import behavior still requires runtime testing. Performance with larger numbers of simultaneous sound things and suitability for the complete routing/modulation architecture remain unverified.

### Audio architecture boundary

The application owns sound-thing identity, source references, independent settings, and workspace persistence. The audio layer owns decoded buffers and player instances. Multiple players may reference the same decoded source while retaining independent playback rate, loop, and level settings.

The canvas and audio engine must remain separate. React Flow edges or node state must not become the authority for audio routing, synchronization, or modulation. Those relationships will need an explicit audio/control graph when those capabilities are designed.

### Storage and project-file model

IndexedDB stores the browser's working copy: imported audio blobs and the current workspace configuration. The explicit **Save project** action also downloads a self-contained `.soundthing` archive. The archive is ZIP-based and contains a versioned JSON manifest plus the audio assets referenced by the workspace; it does not depend on the original external files or the browser's local database.

**Open project** validates the archive, imports its audio assets into IndexedDB, and replaces the visible workspace. The browser copy remains convenient for reopening the app, while the downloaded project file is the portable backup and transfer format. Browser storage can still be cleared or evicted, so the downloaded file should be kept somewhere safe. The project manifest has an explicit format version to support future migrations as the app's data model grows.

The current import path assigns fresh internal audio-source IDs when loading a project, so opening the same project repeatedly does not collide with existing in-browser source IDs. Unreferenced older audio records are not yet garbage-collected. OPFS remains an option to investigate if large asset storage or streaming access makes it worthwhile; it is not currently used.

### Deferred technologies

- **AudioWorklet:** use for custom real-time processing when requirements justify it.
- **PixiJS or another GPU-oriented renderer:** investigate only if the node-based canvas reaches rendering limits or needs substantially richer visual scenes.
- **Tauri:** evaluate for desktop packaging after browser-first behavior is validated.
- **Plugin formats:** remain a future architecture question, not a first-prototype requirement.

### Stack decision principles

- Prefer established audio technologies where they meet the requirements.
- Keep the audio engine conceptually separate from the interface.
- Build custom functionality where Soundthing's interaction model genuinely requires it.
- Validate runtime behavior and performance before treating the stack as accepted.
- Introduce dependencies only when they solve a defined problem.

### Technical validation questions

1. Do the candidate audio libraries support the required playback, routing, modulation, and synchronization behaviors?
2. How can multiple independent sound things play simultaneously without timing drift or unnecessary resource use?
3. What audio graph and parameter-control architecture can support modular effect chains, inter-object routing, sidechains, automation, and LFOs?
3. How should imported audio sources be stored and retained when original external files are moved or deleted?
4. How should source references be tracked so cleanup never removes audio still used by a sound thing or active operation?
5. How should sound thing variations preserve configuration history while sharing source audio?
6. Which canvas rendering approach best supports the expected number of sound things?
7. What is required for reliable recording, persistence, and audio asset management?
8. Which plugin formats, if any, are practical in the browser, desktop wrapper, or both?

## 11. Project Workflow and Collaboration Guidance

### Development workflow

Soundthing uses the reusable [Development State Machine Workflow](https://github.com/KRMRGold/Meta-Modules/blob/main/workflows/Development-State-Machine-Workflow.md), initially adopted at v1.6.0. The workflow governs how ideas are refined, scope and acceptance criteria are agreed, implementation candidates are created, and changes are inspected and verified.

The workflow remains canonical in Meta-Modules rather than being copied into this design. Soundthing follows its current version by default. Git history preserves earlier revisions; the initial adoption version above is provenance, not a permanent pin.

Apply the workflow proportionately:
- Keep design decisions, proposals, assumptions, and open questions distinguishable.
- Investigate established solutions before committing to custom technology or architecture.
- Define observable acceptance criteria before treating an implementation candidate as ready.
- Preserve the last accepted working state while evaluating changes.
- Inspect and test actual behavior; report checks as passed, failed, blocked, or not run based on evidence.
- Update project records from verified results, and keep living documents at one stable path.

### Meta-Modules in use

The project uses the following guidance from the [Meta-Modules repository](https://github.com/KRMRGold/Meta-Modules). These are the active collaboration modules for Soundthing; the list is intentionally consolidated here rather than repeating links to each module.

- **PAFC (Prior-Art-First Collaboration):** investigate terminology, existing tools, standards, and established approaches before inventing; recommend reuse or adaptation where appropriate while preserving worthwhile experimentation.
- **Intent & Clarity:** understand the actual goal, make useful recommendations, and ask focused questions only when ambiguity could materially change the result.
- **Discovery & Exploration:** surface relevant concepts, tools, techniques, and possibilities without derailing the project or taking over its direction.
- **Capability & Agency:** make practical progress while keeping the user's goals, creative ownership, and decisions central.
- **Testing & Verification:** derive meaningful tests from acceptance criteria, inspect existing test infrastructure before adding dependencies, and verify behavior at appropriate levels.
- **Tool Use and Consent Boundaries:** respect the project's tool restrictions and obtain any required permission before using a restricted capability.

These modules guide collaboration; they do not replace Soundthing's design decisions or the development workflow. Add other specialized modules only when a concrete project need justifies them.

### Applying the workflow to Soundthing

An initial prototype should validate a small but meaningful part of the interaction model. A useful first slice is:

1. Drag an audio file from a folder/file manager onto the canvas to create a sound thing.
2. Play and stop it using its own controls.
3. Create a second sound thing or variation that references the same managed audio source.
4. Change the second object's playback settings without unintentionally changing the first.
5. Move or delete the original external file and verify that imported sound things still work.
6. Save and reopen the workspace while preserving the shared source, both objects, and their independent configurations.

This validates drag-to-create, managed source retention, independent sound things, and persistence without requiring the full sampler, drum rack, plugin system, or synchronization engine.

Acceptance criteria should be agreed before an implementation candidate is evaluated. Testing should include actual audio playback and persistence where the runtime permits; checks that cannot be run must be identified as unverified rather than assumed to pass.

## 12. Design Principles

- **Instrument-centered:** Sound things are playable objects, not merely clips on a timeline.
- **Spatial:** The canvas is an active workspace for making music.
- **Independent by default:** Related objects do not unexpectedly share behavior or edits.
- **Non-destructive iteration:** Creating a variation preserves the original sound thing; shared audio sources remain available while referenced or actively used.
- **Drag-to-create:** Dropping an audio file onto the canvas creates a sound thing that can be shaped into different kinds of sound-making objects.
- **Inspectable:** Users can discover how an object works and where it came from.
- **Modular:** Effects, routing, automation, and modulation can be connected and combined as needed.
- **Progressive disclosure:** The basic experience stays approachable; advanced routing and modulation are introduced when useful rather than shown all at once.
- **Extensible:** Optional effects and new playback capabilities can be added without making every object needlessly complex.
- **Progressive:** Begin with a useful core and expand as real needs emerge.
- **Validated:** Architecture and implementation choices are tested against the intended musical experience.

## 13. Initial Scope

The first prototype validates the core interaction model, not a complete DAW.

### Prototype candidate 0.3.0

A first implementation candidate now exists in the repository. It includes:
- A spatial canvas with pan, zoom, and movable sound-thing nodes.
- Audio import through file selection or drag-and-drop onto the canvas.
- Waveform previews derived from decoded audio.
- Individual Play/Pause/Resume/Stop, Loop, playback-rate, and level controls; playback settings can be adjusted while a sound thing is playing.
- Creation of another sound thing that references the same decoded audio source while keeping its own playback settings.
- IndexedDB storage for imported audio blobs and the browser's current workspace.
- Portable `.soundthing` project files: **Save project** downloads a versioned archive containing the workspace and its referenced audio assets; **Open project** imports the archive and restores the workspace.

**Current evidence:** the TypeScript check and Vite production build passed in GitHub Actions for prototype candidate 0.2.0 at commit `11bd49369136bbb453102ad95e65f6021779dfe8`. Browser testing has confirmed Play, Pause, Resume, Stop, and Loop; simultaneous playback of two sound things; independent playback settings; and IndexedDB workspace save/restore. Candidate 0.3.0 adds portable project archive save/open; its TypeScript check and Vite production build passed in GitHub Actions for commit `30292c3e1931906addb8e274dae7f3307f867b04` (run [42763305503](https://github.com/KRMRGold/soundThing/actions/runs/42763305503)). Browser download, re-import, and cross-browser portability remain untested.

### First-milestone acceptance checks

<badge>PASS — user tested</badge>

1. Run the application in a supported browser.
2. Confirm Play/Pause/Resume/Stop and Loop work.
3. Confirm two sound things can play simultaneously and their settings remain independent.
4. Save the workspace, close and reopen the browser, and confirm sound things, settings, and canvas positions are restored.

<badge>NOT YET TESTED</badge>

5. Move or rename the original external audio file and confirm the managed import remains playable.
6. Exercise several (for example, three to five) simultaneously playing sound things and inspect responsiveness and audio stability.

Pause/resume, seeking, source cleanup, backup/export, advanced sampler behavior, live MIDI keyboard input, MIDI-style pitched playback, drum racks, modular effect racks, inter-object routing, automation, LFO modulation, and workstation-wide synchronization are not yet implemented. They remain separate, testable capabilities for later milestones.

After this foundation is verified, those broader features can be developed without cramming them into the first prototype.

## 14. Development Path

The roadmap is ordered by dependency: validate the current foundation, make sound things behave as instruments, then add shared timing and more advanced production capabilities. These are planned stages, not claims that the features already exist. Revisit priorities as real use reveals what matters most.

### Stage 1 — Finish validating the current foundation

- Save a `.soundthing` project, then open it and confirm the workspace, settings, and audio assets are restored.
- Move the project file to another browser profile or device and confirm it still opens with its audio.
- Move or rename the original external audio file and confirm the managed import remains playable.
- Test three to five simultaneous sound things.
- Test both duplicated sound things sharing one source and sound things using different sources.
- Observe audio stability, responsiveness, and whether playback controls remain independent.

Do not expand the feature set until these basic source-management and playback checks have been completed.

### Stage 2 — Strengthen the audio foundation

- Improve source lifecycle and player cleanup.
- Handle missing, invalid, or unavailable audio sources clearly.
- Add focused tests for playback state transitions and independent settings.
- Establish the audio-engine interfaces needed for future instrument voices and processing without coupling them to React Flow.

### Stage 3 — Build playable instruments and live MIDI input

- Extend sound things beyond one-shot playback into note-triggered instruments.
- Add basic sampler controls such as pitch, playback range, and note duration/hold behavior.
- Support polyphonic note playing where the selected instrument allows it.
- Connect a physical MIDI keyboard through the browser's Web MIDI API.
- Provide a clear MIDI input connection/device choice and show which sound thing receives the notes. The initial default can be the selected or explicitly armed sound thing.
- Handle note-on, note-off (including note-on with zero velocity), pitch, velocity, and MIDI channel. Prevent stuck notes when a device disconnects or input focus changes.
- Keep MIDI input separate from the audio engine: MIDI supplies performance events; the selected instrument turns those events into sound.
- Start without requiring MIDI System Exclusive support. Controller mappings such as sustain, pitch bend, modulation, and other CC messages can follow once basic note input is reliable.

The intended first MIDI milestone is live playing from a connected keyboard, not MIDI-file import or MIDI output to external hardware. The Web MIDI API requires a secure context and user permission, and browser support is not universal; detect support and communicate limitations rather than assuming every browser can connect. See the [MDN Web MIDI API reference](https://developer.mozilla.org/en-US/docs/Web/API/Web_MIDI_API). Tone.js already provides note-triggered [Sampler](https://tonejs.github.io/docs/Sampler) and polyphonic instrument primitives that can be evaluated before building custom voice handling.

### Stage 4 — Add timing and synchronization

- Introduce a workstation-wide master tempo.
- Preserve each sound thing's original tempo as reference information.
- Add tempo matching and synchronized loops.
- Account for loop length, start position, and rhythmic phase, not only BPM.

### Stage 5 — Add slicing and drum racks

- Divide samples into editable regions.
- Trigger slices individually.
- Map slices to playable pads/triggers.
- Preserve the original sound thing and shared source.

### Stage 6 — Add modular processing and routing

- Add per-sound-thing effect racks.
- Introduce explicit audio connections between sound things.
- Add sidechain and other signal-routing relationships.
- Keep audio routing separate from the canvas's visual edges.

### Stage 7 — Add automation and modulation

- Automate sound-thing and effect parameters over time.
- Add LFOs and other modulation sources.
- Allow compatible controls to be linked visually and inspectably.

### Stage 8 — Production, portability, and recovery

- **Implemented in candidate 0.3.0:** portable workspace save/open through self-contained `.soundthing` project archives.
- Add recording and audio export.
- Improve backup/recovery and source cleanup as project size and storage needs grow.
- Evaluate desktop packaging with Tauri when browser limitations or desktop-specific capabilities justify it.

## 15. Open Design Questions

- What are the primary gestures for creating, moving, opening, and playing sound things?
- How should playback modes be presented and changed?
- How should edits to imported source audio be handled when several sound things reference it?
- What source-retention and cleanup rules should apply when no sound thing or active operation uses an audio source?
- What is the preferred default for creating new objects versus modifying existing ones, given that iteration normally preserves the original?
- Which Ableton Live and Bitwig Studio slicing/drum-rack behaviors should be matched first?
- How should modular effect racks be laid out and connected beneath sound things?
- Which connection types should be supported between sound things, and how should audio, sidechain, sync, and control wires be distinguished?
- How should automation and LFOs be created, edited, and connected to sound thing/effect parameters?
- How can advanced routing and modulation remain discoverable without overwhelming the basic interface?
- How should original-tempo markers be displayed alongside master tempo and effective playback tempo?
- Which audio and canvas libraries meet the requirements in practice?
- What is the minimum viable recording and persistence workflow?
- Which desktop-specific capabilities justify packaging the web application?
- Which plugin formats, if any, are practical to support?

This is an initial design candidate, not a final technical specification. Stack choices remain provisional until requirements and prototypes have been evaluated.
