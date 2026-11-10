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

A sound thing is a playable sound object with its own configuration and behavior.

Examples include a looping sample, a sample played as a pitched instrument through MIDI, a sliced sample mapped to drum pads, a waveform-based instrument, or a recorded/live-looped sound.

These are different ways of using sound, not necessarily separate foundational instrument types.

Sound things may reference the same underlying audio while maintaining independent playback settings and configurations.

## 4. Sampler as a Foundation

The sampler is the initial foundation for loading, recording, and manipulating audio.

A sound source can be used in different ways:
- Normal sample playback and looping.
- Pitched playback controlled by MIDI.
- Slicing and triggering individual regions.
- Mapping slices to a drum rack.
- Using waveform data as the basis of an instrument.

These are standard playback and manipulation capabilities. Optional effects, plugins, and specialized processing can extend them.

The initial design should establish a useful sampler foundation before expanding into more complex instrument types.

## 5. Transformations and Independent Objects

Transforming a sample into a different instrument or workflow can create a new sound thing.

For example, sending a sample to a drum rack creates a separate object whose pads can be edited independently. The original sample remains available.

A new sound thing does not necessarily require duplicating the audio file. Multiple objects can reference the same source while maintaining separate settings.

The system should distinguish between:
- Creating a new sound thing.
- Creating a new audio file or copy.
- Editing the original audio.
- Editing an object's playback or processing configuration.

Potentially destructive transformations should default to preserving the original. Users should eventually be able to choose whether an action creates a new object, modifies the existing object, or asks each time.

## 6. Slicing and Drum Racks

A sample can be sliced and sent to a drum rack.

- The drum rack becomes a separate sound thing.
- Slices become individually playable pads or triggers.
- Each pad can be configured independently.
- The original sample remains available.
- Slice regions should ideally reference the original audio rather than require destructive cutting or unnecessary duplication.

The precise relationship between source audio, slice definitions, and later edits remains an implementation decision.

## 7. Optional Effects and Plugins

Effects such as reverb, delay, and distortion are optional additions rather than mandatory parts of every sound thing.

Effects may appear as visible modules attached to a sound thing, potentially beneath it on the canvas or in an expanded view.

Third-party plugin support, including VST compatibility, is a possible future capability. Its feasibility depends on the selected runtime and audio architecture, so it is not an established requirement for the first prototype.

## 8. Relationships and Provenance

Sound things should appear independent on the canvas unless the user chooses to inspect their relationships.

Relationship information belongs primarily in metadata. It can record:
- The original sound source.
- The transformation that created an object.
- Relevant creation settings.
- Whether the source is still available.
- A way to navigate to the original object.

This provenance information should help users understand where a sound came from without cluttering the canvas with permanent connection lines.

A relationship does not automatically imply that settings or edits propagate between objects.

## 9. Playback, Tempo, and Synchronization

Individual sound things may have their own tempo and playback settings.

The workstation may provide global controls such as master play/stop, a master tempo control, and synchronization controls for bringing selected sound things into rhythmic alignment.

The original setting should remain distinguishable from the current or synchronized setting. For example, a tempo knob may move to reflect synchronization while a marker preserves the original tempo.

The design should distinguish between:
- **Original setting:** the object's stored preference or starting point.
- **Current control setting:** the value currently shown by its control.
- **Effective playback setting:** the value actually used during playback.

Synchronization must account for more than matching BPM. Loop length, start position, rhythmic phase, and playback behavior may also affect alignment.

The exact relationship between master tempo, master synchronization, and individual controls remains open for further design.

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
3. How should shared audio sources and independently editable configurations be represented?
4. Which canvas rendering approach best supports the expected number of sound things?
5. What is required for reliable recording, persistence, and audio asset management?
6. Which plugin formats, if any, are practical in the browser, desktop wrapper, or both?

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

1. Load a sample.
2. Place it on the canvas as an independent sound thing.
3. Play and stop it using its own controls.
4. Create a second sound thing that references the same audio source.
5. Change the second object's playback settings without unintentionally changing the first.
6. Save and reopen the workspace while preserving both objects and their independent configurations.

This validates the core relationship between sound things, their shared audio sources, and the canvas without requiring the full sampler, drum rack, plugin system, or synchronization engine.

Acceptance criteria should be agreed before an implementation candidate is evaluated. Testing should include actual audio playback and persistence where the runtime permits; checks that cannot be run must be identified as unverified rather than assumed to pass.

## 12. Design Principles

- **Instrument-centered:** Sound things are playable objects, not merely clips on a timeline.
- **Spatial:** The canvas is an active workspace for making music.
- **Independent by default:** Related objects do not unexpectedly share behavior or edits.
- **Non-destructive where practical:** Transformations preserve source material unless the user chooses otherwise.
- **Inspectable:** Users can discover how an object works and where it came from.
- **Extensible:** Optional effects and new playback capabilities can be added without making every object needlessly complex.
- **Progressive:** Begin with a useful core and expand as real needs emerge.
- **Validated:** Architecture and implementation choices are tested against the intended musical experience.

## 13. Initial Scope

The first prototype should validate the core interaction model, not attempt to reproduce a complete DAW.

A reasonable starting slice is:
- An infinite or sufficiently large spatial canvas.
- A basic sound thing that can load and play a sample.
- Independent playback controls.
- A second object that can reference the same audio source while maintaining separate settings.
- A clear way to inspect an object's source relationship.
- Basic persistence sufficient to validate the workflow.

After that foundation works, slicing, MIDI-style pitched playback, drum racks, effects, and workstation-wide synchronization can be developed as separate, testable capabilities.

## 14. Open Design Questions

- What are the primary gestures for creating, moving, opening, and playing sound things?
- How should playback modes be presented and changed?
- How should shared audio sources behave when the original is edited or removed?
- What is the preferred default for creating new objects versus modifying existing ones?
- How should slicing and drum rack configuration be represented?
- How should master tempo and synchronization interact with individual sound thing controls?
- Which audio and canvas libraries meet the requirements in practice?
- What is the minimum viable recording and persistence workflow?
- Which desktop-specific capabilities justify packaging the web application?
- Which plugin formats, if any, are practical to support?

This is an initial design candidate, not a final technical specification. Stack choices remain provisional until requirements and prototypes have been evaluated.
