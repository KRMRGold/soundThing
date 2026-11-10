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

The goal is not to recreate an existing DAW feature for feature. Soundthing draws inspiration from samplers, live looping, DJ equipment, modular workflows, and established DAWs while exploring a more direct, spatial way to create music.

## 2. Workstation and Infinite Canvas

- The canvas is the shared spatial workspace in which sound things live.
- Each sound thing is an independent, playable entity with its own controls and playback behavior.
- A sound thing can be played, stopped, and configured on its own, and multiple sound things can play simultaneously.
- The canvas provides the context for creating, arranging, selecting, inspecting, and accessing sound things.
- Moving or arranging a sound thing on the canvas does not, by itself, change its musical behavior.
- Related sound things remain visually independent by default; users can inspect relationships and navigate between related objects when needed.
- Workstation-level controls may coordinate multiple sound things without replacing their individual controls or settings.

The canvas is not a timeline and is not itself the instrument. Musical sound is produced by the sound things; the canvas is the spatial environment that holds and organizes them.

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

## 7. Optional Effects and Plugins

Effects such as reverb, delay, and distortion are optional additions rather than mandatory parts of every sound thing.

Effects may appear as visible modules attached to a sound thing, potentially beneath it on the canvas or in an expanded view.

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

## 10. Proposed Technology Stack

This is a candidate stack for investigation, not an approved implementation commitment.

### Audio engine

- **Web Audio API:** the native browser audio platform and starting candidate for sample playback, routing, effects, and real-time processing.
- **Tone.js:** evaluate for musical scheduling, tempo-aware playback, transport controls, and common music-making primitives. Use it where it simplifies implementation without constraining Soundthing's interaction model.
- **AudioWorklet:** investigate for custom real-time audio processing when a defined requirement calls for it, rather than assuming it is needed everywhere.

### Interface

- **TypeScript:** a candidate for maintaining clear interfaces between sound things, configurations, canvas interactions, and the audio engine.
- **React:** a candidate for the interface and reusable controls.
- **Custom infinite canvas:** the spatial workspace is central to Soundthing's identity. Its interaction model should support moving, selecting, inspecting, and playing sound things, rather than treating it as a conventional timeline. The rendering technology remains open until behavior and performance needs are clearer.

### Desktop packaging

- **Tauri:** a candidate for packaging the web-first application as a desktop app. Browser-based development should remain viable where practical.
- Desktop packaging should not dictate the initial architecture before its benefits and constraints have been evaluated.

### Storage and audio assets

The architecture needs to distinguish audio data from sound thing configurations. A configuration may include its source reference, playback method, slice regions, controls, and processing chain. Multiple objects should be able to reference shared audio without unintentionally sharing all settings.

The specific storage system, audio import workflow, recording format, and persistence strategy remain to be investigated.

### Stack decision principles

- Prefer established audio technologies where they meet the requirements.
- Build custom functionality where Soundthing's interaction model genuinely requires it.
- Keep the audio engine conceptually separate from the interface.
- Avoid committing to libraries before validating their limitations.
- Evaluate real-time performance, synchronization accuracy, browser support, and desktop requirements.
- Introduce dependencies only when they solve a defined problem.

### Technical validation questions

1. Do the candidate audio libraries support the required playback and synchronization behaviors?
2. How can multiple independent sound things play simultaneously without timing drift or unnecessary resource use?
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
- **Extensible:** Optional effects and new playback capabilities can be added without making every object needlessly complex.
- **Progressive:** Begin with a useful core and expand as real needs emerge.
- **Validated:** Architecture and implementation choices are tested against the intended musical experience.

## 13. Initial Scope

The first prototype should validate the core interaction model, not attempt to reproduce a complete DAW.

A reasonable starting slice is:
- An infinite or sufficiently large spatial canvas.
- Dragging an audio file from a folder/file manager onto the canvas creates a basic sound thing that can load and play it.
- Independent playback controls.
- A second object or variation can reference the same managed audio source while maintaining separate settings.
- Imported audio remains available if the original external file is moved or deleted.
- A clear way to inspect an object's source relationship.
- Basic persistence sufficient to validate the workflow.

After that foundation works, slicing, MIDI-style pitched playback, drum racks, effects, and workstation-wide synchronization can be developed as separate, testable capabilities.

## 14. Open Design Questions

- What are the primary gestures for creating, moving, opening, and playing sound things?
- How should playback modes be presented and changed?
- How should edits to imported source audio be handled when several sound things reference it?
- What source-retention and cleanup rules should apply when no sound thing or active operation uses an audio source?
- What is the preferred default for creating new objects versus modifying existing ones, given that iteration normally preserves the original?
- Which Ableton Live and Bitwig Studio slicing/drum-rack behaviors should be matched first?
- How should original-tempo markers be displayed alongside master tempo and effective playback tempo?
- Which audio and canvas libraries meet the requirements in practice?
- What is the minimum viable recording and persistence workflow?
- Which desktop-specific capabilities justify packaging the web application?
- Which plugin formats, if any, are practical to support?

This is an initial design candidate, not a final technical specification. Stack choices remain provisional until requirements and prototypes have been evaluated.
