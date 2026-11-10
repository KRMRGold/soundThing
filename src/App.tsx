import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useNodesState,
  useReactFlow,
  type Node,
  type NodeProps,
  type NodeTypes,
} from "@xyflow/react";
import { useCallback, useEffect, useRef, useState, type DragEvent } from "react";
import {
  pauseSoundThing,
  playSoundThing,
  registerAudioSource,
  stopSoundThing,
  updateSoundThingSettings,
  type PlaybackSettings,
} from "./audio/engine";
import {
  loadAudioSources,
  loadWorkspace,
  saveWorkspace,
  storeAudioSource,
  type AudioSourceRecord,
  type StoredSoundThing,
} from "./storage/workspace";

type SoundThingData = {
  sourceId: string;
  sourceName: string;
  duration: number;
  waveform: number[];
  playbackRate: number;
  volumeDb: number;
  loop: boolean;
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

function SoundThing({ id, data }: NodeProps<SoundThingNode>) {
  return (
    <article className="sound-thing">
      <div className="sound-thing-top">
        <span className="object-mark">S</span>
        <div className="sound-thing-heading">
          <strong>{data.sourceName}</strong>
          <small>{formatTime(data.duration)} · shared source</small>
        </div>
        <button className="icon-button nodrag" title="Create another sound thing" onClick={() => data.onDuplicate(id)}>
          +
        </button>
      </div>

      <div className="waveform" aria-label="Audio waveform">
        {data.waveform.map((height, index) => (
          <span key={index} style={{ height: `${Math.max(7, height * 100)}%` }} />
        ))}
      </div>

      <div className="transport nodrag">
        <button className={data.playing ? "transport-button active" : "transport-button"} onClick={() => data.playing ? data.onPause(id) : data.onPlay(id, data.sourceId, data)}>
          {data.playing ? "Pause" : data.paused ? "Resume" : "Play"}
        </button>
        <button className="stop-button" disabled={!data.playing && !data.paused} onClick={() => data.onStop(id)}>Stop</button>
        <label className="loop-toggle">
          <input
            type="checkbox"
            checked={data.loop}
            onChange={(event) => data.onSettingsChange(id, { loop: event.target.checked })}
          />
          Loop
        </label>
        <span className="duration">{formatTime(data.duration)}</span>
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
  const [message, setMessage] = useState("Drop an audio file anywhere on the canvas to create a sound thing.");
  const [busy, setBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
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

  const makeNode = useCallback((stored: StoredSoundThing): SoundThingNode => ({
    id: stored.id,
    type: "soundThing",
    position: stored.position,
    data: {
      sourceId: stored.sourceId,
      sourceName: stored.sourceName,
      duration: stored.duration,
      waveform: stored.waveform,
      playbackRate: stored.playbackRate,
      volumeDb: stored.volumeDb,
      loop: stored.loop,
      playing: false,
      paused: false,
      onPlay: play,
      onPause: pause,
      onStop: stop,
      onDuplicate: duplicate,
      onSettingsChange: updateSettings,
    },
  }), [duplicate, pause, play, stop, updateSettings]);

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
        for (const source of sources) {
          await registerAudioSource(source.id, source.blob);
        }
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

  const persist = useCallback(async () => {
    try {
      const stored: StoredSoundThing[] = nodes.map((node) => ({
        id: node.id,
        sourceId: node.data.sourceId,
        sourceName: node.data.sourceName,
        duration: node.data.duration,
        waveform: node.data.waveform,
        position: node.position,
        playbackRate: node.data.playbackRate,
        volumeDb: node.data.volumeDb,
        loop: node.data.loop,
      }));
      await saveWorkspace(stored);
      setMessage(`Saved ${stored.length} sound thing(s) in this browser.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Workspace could not be saved.");
    }
  }, [nodes]);

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
          <div><strong>soundThing</strong><small>playable canvas · prototype 0.1.0</small></div>
        </div>
        <div className="toolbar">
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
          <button className="toolbar-button primary" onClick={() => void persist()}>Save workspace</button>
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
        <span>Sources are stored locally in this browser</span>
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
