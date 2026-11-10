import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  SelectionMode,
  ReactFlowProvider,
  useNodesState,
  useReactFlow,
  type Node,
  type NodeProps,
  type NodeTypes,
} from "@xyflow/react";
import { useCallback, useEffect, useRef, useState, type DragEvent } from "react";
import {
  normalizePlaybackSettings,
  pauseSoundThing,
  playSoundThing,
  registerAudioSource,
  stopSoundThing,
  updateSoundThingSettings,
  type PlaybackSettings,
} from "./audio/engine";
import SamplerWaveform from "./components/SamplerWaveform";
import {
  loadAudioSources,
  loadWorkspace,
  normalizeStoredSoundThing,
  saveWorkspace,
  storeAudioSource,
  type AudioSourceRecord,
  type StoredSoundThing,
} from "./storage/workspace";
import { createProjectFile, readProjectFile } from "./storage/projectFile";

type SoundThingData = PlaybackSettings & {
  sourceId: string;
  sourceName: string;
  duration: number;
  waveform: number[];
  playing: boolean;
  paused: boolean;
  onPlay: (id: string, sourceId: string, settings: PlaybackSettings) => void;
  onPause: (id: string) => void;
  onStop: (id: string) => void;
  onDuplicate: (id: string) => void;
  onSettingsChange: (id: string, settings: Partial<PlaybackSettings>) => void;
};

type SoundThingNode = Node<SoundThingData, "soundThing">;

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.floor(seconds % 60).toString().padStart(2, "0");
  return minutes + ":" + remainder;
}

function formatSampleTime(seconds: number): string {
  return `${Math.max(0, seconds).toFixed(2)}s`;
}

function SoundThing({ id, data }: NodeProps<SoundThingNode>) {
  const updateRegion = (region: { sampleStart: number; sampleEnd: number }) => {
    data.onSettingsChange(id, region);
  };

  return (
    <article className="sound-thing">
      <div className="sound-thing-top">
        <span className="object-mark">S</span>
        <div className="sound-thing-heading">
          <strong>{data.sourceName}</strong>
          <small>{formatSampleTime(data.sampleEnd - data.sampleStart)} selected · {formatTime(data.duration)} source</small>
        </div>
        <button className="icon-button nodrag" title="Create another sound thing" onClick={() => data.onDuplicate(id)}>
          +
        </button>
      </div>

      <SamplerWaveform
        waveform={data.waveform}
        duration={data.duration}
        sampleStart={data.sampleStart}
        sampleEnd={data.sampleEnd}
        onRegionChange={updateRegion}
      />

      <div className="sampler-readout nodrag">
        <span>IN {formatSampleTime(data.sampleStart)}</span>
        <span>OUT {formatSampleTime(data.sampleEnd)}</span>
        <span>LENGTH {formatSampleTime(data.sampleEnd - data.sampleStart)}</span>
      </div>

      <div className="setting-row nodrag region-setting">
        <label htmlFor={`start-${id}`}>Start</label>
        <input
          id={`start-${id}`}
          type="range"
          min="0"
          max={data.duration}
          step="0.01"
          value={data.sampleStart}
          onChange={(event) => updateRegion({
            sampleStart: Math.min(Number(event.target.value), data.sampleEnd - Math.min(0.01, data.duration)),
            sampleEnd: data.sampleEnd,
          })}
        />
        <output>{formatSampleTime(data.sampleStart)}</output>
      </div>
      <div className="setting-row nodrag region-setting">
        <label htmlFor={`end-${id}`}>End</label>
        <input
          id={`end-${id}`}
          type="range"
          min="0"
          max={data.duration}
          step="0.01"
          value={data.sampleEnd}
          onChange={(event) => updateRegion({
            sampleStart: data.sampleStart,
            sampleEnd: Math.max(Number(event.target.value), data.sampleStart + Math.min(0.01, data.duration)),
          })}
        />
        <output>{formatSampleTime(data.sampleEnd)}</output>
      </div>

      <div className="transport nodrag sampler-transport">
        <button className={data.playing ? "transport-button active" : "transport-button"} onClick={() => data.playing ? data.onPause(id) : data.onPlay(id, data.sourceId, data)}>
          {data.playing ? "Pause" : data.paused ? "Resume" : "Play"}
        </button>
        <button className="stop-button" disabled={!data.playing && !data.paused} onClick={() => data.onStop(id)}>Stop</button>
        <label className="mode-control">
          <span>Mode</span>
          <select value={data.loop ? "loop" : "one-shot"} onChange={(event) => data.onSettingsChange(id, { loop: event.target.value === "loop" })}>
            <option value="one-shot">One-Shot</option>
            <option value="loop">Loop</option>
          </select>
        </label>
      </div>



      <div className="setting-row nodrag">
        <label htmlFor={`rate-${id}`}>Rate</label>
        <input
          id={`rate-${id}`}
          type="range"
          min="0.5"
          max="2"
          step="0.05"
          value={data.playbackRate}
          onChange={(event) => data.onSettingsChange(id, { playbackRate: Number(event.target.value) })}
        />
        <output>{data.playbackRate.toFixed(2)}×</output>
      </div>
      <div className="setting-row nodrag">
        <label htmlFor={`volume-${id}`}>Level</label>
        <input
          id={`volume-${id}`}
          type="range"
          min="-30"
          max="0"
          step="1"
          value={data.volumeDb}
          onChange={(event) => data.onSettingsChange(id, { volumeDb: Number(event.target.value) })}
        />
        <output>{data.volumeDb} dB</output>
      </div>
    </article>
  );
}

const nodeTypes: NodeTypes = { soundThing: SoundThing };

function Canvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState<SoundThingNode>([]);
  const [message, setMessage] = useState("Left-drag empty space to select · middle-drag to pan · drop audio to create a sound thing.");
  const [busy, setBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const projectInput = useRef<HTMLInputElement>(null);
  const { screenToFlowPosition } = useReactFlow();

  const updateSettings = useCallback((id: string, settings: Partial<PlaybackSettings>) => {
    updateSoundThingSettings(id, settings);
    setNodes((current) => current.map((node) =>
      node.id === id ? { ...node, data: { ...node.data, ...settings } } : node,
    ));
  }, [setNodes]);

  const stop = useCallback((id: string) => {
    stopSoundThing(id);
    setNodes((current) => current.map((node) =>
      node.id === id ? { ...node, data: { ...node.data, playing: false, paused: false } } : node,
    ));
  }, [setNodes]);

  const play = useCallback(async (id: string, sourceId: string, settings: PlaybackSettings) => {
    try {
      await playSoundThing(id, sourceId, settings, () => {
        setNodes((current) => current.map((node) =>
          node.id === id ? { ...node, data: { ...node.data, playing: false, paused: false } } : node,
        ));
      });
      setNodes((current) => current.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, playing: true, paused: false } } : node,
      ));
      setMessage("Playing. Audio starts only after a user action, as required by browser audio policies.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to play this audio file.");
    }
  }, [setNodes]);

  const pause = useCallback((id: string) => {
    const didPause = pauseSoundThing(id);
    if (!didPause) return;
    setNodes((current) => current.map((node) =>
      node.id === id ? { ...node, data: { ...node.data, playing: false, paused: true } } : node,
    ));
  }, [setNodes]);

  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;

  const duplicate = useCallback((id: string) => {
    const original = nodesRef.current.find((node) => node.id === id);
    if (!original) return;
    const copy: SoundThingNode = {
      ...original,
      id: crypto.randomUUID(),
      position: { x: original.position.x + 340, y: original.position.y + 45 },
      data: {
        ...original.data,
        playbackRate: 1,
        volumeDb: -6,
        loop: false,
        playing: false,
        paused: false,
      },
    };
    setNodes((current) => [...current, copy]);
    setMessage("Created an independent sound thing using the same audio source.");
  }, [setNodes]);

  const makeNode = useCallback((stored: StoredSoundThing): SoundThingNode => {
    const normalized = normalizeStoredSoundThing(stored);
    const settings = normalizePlaybackSettings(normalized, normalized.duration);
    return {
      id: normalized.id,
      type: "soundThing",
      position: normalized.position,
      data: {
        sourceId: normalized.sourceId,
        sourceName: normalized.sourceName,
        duration: normalized.duration,
        waveform: normalized.waveform,
        ...settings,
        playing: false,
        paused: false,
        onPlay: play,
        onPause: pause,
        onStop: stop,
        onDuplicate: duplicate,
        onSettingsChange: updateSettings,
      },
    };
  }, [duplicate, pause, play, stop, updateSettings]);

  const addFiles = useCallback(async (files: FileList | File[], position: { x: number; y: number }) => {
    const audioFiles = Array.from(files).filter((file) =>
      file.type.startsWith("audio/") || /\.(wav|mp3|ogg|oga|flac|m4a|aac|aiff?)$/i.test(file.name),
    );
    if (audioFiles.length === 0) {
      setMessage("No supported audio file found. Try WAV, MP3, OGG, FLAC, M4A, or AIFF.");
      return;
    }

    setBusy(true);
    for (const file of audioFiles) {
      try {
        const sourceId = crypto.randomUUID();
        const decoded = await registerAudioSource(sourceId, file);
        const source: AudioSourceRecord = {
          id: sourceId,
          name: file.name,
          mimeType: file.type,
          size: file.size,
          blob: file,
          ...decoded,
        };
        await storeAudioSource(source);
        const stored: StoredSoundThing = {
          id: crypto.randomUUID(),
          sourceId,
          sourceName: file.name,
          duration: decoded.duration,
          waveform: decoded.waveform,
          position: { x: position.x + nodes.length * 28, y: position.y + nodes.length * 28 },
          playbackRate: 1,
          volumeDb: -6,
          loop: false,
          sampleStart: 0,
          sampleEnd: decoded.duration,
          loopStart: 0,
          loopEnd: decoded.duration,
        };
        setNodes((current) => [...current, makeNode(stored)]);
        setMessage(`Imported ${file.name}. Its audio is now managed by this workspace.`);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : `Could not import ${file.name}.`);
      }
    }
    setBusy(false);
  }, [makeNode, nodes.length, setNodes]);

  useEffect(() => {
    let cancelled = false;
    async function restore() {
      try {
        const [sources, savedNodes] = await Promise.all([loadAudioSources(), loadWorkspace()]);
        for (const source of sources) await registerAudioSource(source.id, source.blob);
        if (cancelled) return;
        setNodes(savedNodes.map(makeNode));
        if (savedNodes.length) {
          setMessage(`Restored ${savedNodes.length} sound thing(s) and their managed audio sources.`);
        }
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Could not restore the saved workspace.");
      }
    }
    void restore();
    return () => { cancelled = true; };
  }, [makeNode, setNodes]);

  const getStoredSoundThings = useCallback((): StoredSoundThing[] => nodes.map((node) => ({
    id: node.id,
    sourceId: node.data.sourceId,
    sourceName: node.data.sourceName,
    duration: node.data.duration,
    waveform: node.data.waveform,
    position: node.position,
    playbackRate: node.data.playbackRate,
    volumeDb: node.data.volumeDb,
    loop: node.data.loop,
    sampleStart: node.data.sampleStart,
    sampleEnd: node.data.sampleEnd,
    loopStart: node.data.loopStart,
    loopEnd: node.data.loopEnd,
  })), [nodes]);

  const saveProject = useCallback(async () => {
    try {
      const stored = getStoredSoundThings();
      await saveWorkspace(stored);
      const sources = await loadAudioSources();
      const project = await createProjectFile(stored, sources);
      const url = URL.createObjectURL(project);
      const link = document.createElement("a");
      link.href = url;
      link.download = `soundthing-${new Date().toISOString().replace(/[:.]/g, "-")}.soundthing`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMessage(`Saved and downloaded a project containing ${stored.length} sound thing(s).`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Project could not be saved.");
    }
  }, [getStoredSoundThings]);

  const openProject = useCallback(async (file: File) => {
    setBusy(true);
    try {
      const project = await readProjectFile(file);
      const sourceIdMap = new Map<string, string>();
      const importedSources: AudioSourceRecord[] = [];

      for (const source of project.audioSources) {
        const newId = crypto.randomUUID();
        const decoded = await registerAudioSource(newId, source.blob);
        sourceIdMap.set(source.id, newId);
        importedSources.push({
          ...source,
          id: newId,
          duration: decoded.duration,
          waveform: decoded.waveform,
        });
      }

      for (const source of importedSources) await storeAudioSource(source);

      const importedThings = project.soundThings.map((thing) => ({
        ...thing,
        sourceId: sourceIdMap.get(thing.sourceId)!,
      }));
      await saveWorkspace(importedThings);
      setNodes(importedThings.map(makeNode));
      setMessage(`Opened ${file.name}: ${importedThings.length} sound thing(s) and ${importedSources.length} audio source(s).`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Project could not be opened.");
    } finally {
      setBusy(false);
    }
  }, [makeNode, setNodes]);

  const onDrop = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
    if (event.dataTransfer.files.length) void addFiles(event.dataTransfer.files, position);
  }, [addFiles, screenToFlowPosition]);

  const onDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  }, []);

  const openPicker = () => fileInput.current?.click();

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-symbol">s</span>
          <div><strong>soundThing</strong><small>playable canvas · prototype 0.5.0</small></div>
        </div>
        <div className="toolbar">
          <button className="toolbar-button" onClick={() => projectInput.current?.click()}>Open project</button>
          <input
            ref={projectInput}
            className="hidden-input"
            type="file"
            accept=".soundthing,.zip,application/zip"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void openProject(file);
              event.target.value = "";
            }}
          />
          <button className="toolbar-button" onClick={openPicker}>＋ Import audio</button>
          <input
            ref={fileInput}
            className="hidden-input"
            type="file"
            accept="audio/*,.wav,.mp3,.ogg,.flac,.m4a,.aiff"
            multiple
            onChange={(event) => {
              if (event.target.files) {
                addFiles(event.target.files, screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 }));
                event.target.value = "";
              }
            }}
          />
          <button className="toolbar-button primary" onClick={() => void saveProject()}>Save project</button>
        </div>
      </header>

      <section className="canvas-wrap" onDrop={onDrop} onDragOver={onDragOver}>
        <div className="canvas-hint">
          <span className="hint-dot" />
          {busy ? "Importing audio…" : message}
        </div>
        <ReactFlow
          nodes={nodes}
          edges={[]}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          selectionOnDrag
          selectionMode={SelectionMode.Partial}
          panOnDrag={[1]}
          fitView
          minZoom={0.15}
          maxZoom={2}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#34302c" gap={28} size={1} />
          <Controls position="bottom-right" />
          <MiniMap position="bottom-left" pannable zoomable nodeColor="#a78368" maskColor="rgba(12, 11, 10, 0.7)" />
        </ReactFlow>
        {nodes.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">↳</div>
            <h1>Make a sound thing.</h1>
            <p>Drop an audio file here, or import one to get started.</p>
            <button className="toolbar-button primary" onClick={openPicker}>Choose an audio file</button>
          </div>
        )}
      </section>
      <footer className="statusbar">
        <span>{nodes.length} sound thing{nodes.length === 1 ? "" : "s"}</span>
        <span>Projects download as portable .soundthing files</span>
        <span>Web Audio · Tone.js · React Flow</span>
      </footer>
    </main>
  );
}

export default function App() {
  return (
    <ReactFlowProvider>
      <Canvas />
    </ReactFlowProvider>
  );
}
