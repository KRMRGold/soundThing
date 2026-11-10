import { useRef, useState, type PointerEvent } from "react";

type Region = { sampleStart: number; sampleEnd: number };
type DragState = {
  kind: "select" | "start" | "end";
  anchor: number;
  sampleStart: number;
  sampleEnd: number;
};

type SamplerWaveformProps = {
  waveform: number[];
  duration: number;
  sampleStart: number;
  sampleEnd: number;
  onRegionChange: (region: Region) => void;
};

export default function SamplerWaveform({
  waveform,
  duration,
  sampleStart,
  sampleEnd,
  onRegionChange,
}: SamplerWaveformProps) {
  const [draft, setDraft] = useState<Region | null>(null);
  const drag = useRef<DragState | null>(null);
  const waveformRef = useRef<HTMLDivElement>(null);
  const region = draft ?? { sampleStart, sampleEnd };
  const minimum = Math.min(0.01, duration);

  function positionAt(clientX: number): number {
    const bounds = waveformRef.current?.getBoundingClientRect();
    if (!bounds || duration <= 0) return 0;
    const ratio = Math.min(1, Math.max(0, (clientX - bounds.left) / bounds.width));
    return ratio * duration;
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (duration <= 0) return;
    const target = (event.target as HTMLElement).closest<HTMLElement>("[data-edge]");
    const kind = target?.dataset.edge === "start"
      ? "start"
      : target?.dataset.edge === "end"
        ? "end"
        : "select";
    const point = positionAt(event.clientX);
    drag.current = {
      kind,
      anchor: point,
      sampleStart: kind === "select" ? point : sampleStart,
      sampleEnd: kind === "select" ? Math.min(duration, point + minimum) : sampleEnd,
    };
    if (kind === "select") setDraft({ sampleStart: point, sampleEnd: Math.min(duration, point + minimum) });
    waveformRef.current?.setPointerCapture(event.pointerId);
    event.preventDefault();
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const current = drag.current;
    if (!current) return;
    const point = positionAt(event.clientX);
    let next: Region;
    if (current.kind === "select") {
      next = {
        sampleStart: Math.min(current.anchor, point),
        sampleEnd: Math.max(current.anchor, point),
      };
      if (next.sampleEnd - next.sampleStart < minimum) {
        next.sampleEnd = Math.min(duration, next.sampleStart + minimum);
        if (next.sampleEnd - next.sampleStart < minimum) next.sampleStart = Math.max(0, next.sampleEnd - minimum);
      }
    } else if (current.kind === "start") {
      next = { sampleStart: Math.min(point, sampleEnd - minimum), sampleEnd };
    } else {
      next = { sampleStart, sampleEnd: Math.max(point, sampleStart + minimum) };
    }
    setDraft(next);
  }

  function finishPointer(event: PointerEvent<HTMLDivElement>) {
    if (!drag.current) return;
    const finalRegion = draft ?? region;
    const safeStart = Math.max(0, Math.min(finalRegion.sampleStart, duration - minimum));
    const safeEnd = Math.max(safeStart + minimum, Math.min(finalRegion.sampleEnd, duration));
    onRegionChange({ sampleStart: safeStart, sampleEnd: safeEnd });
    drag.current = null;
    setDraft(null);
    if (waveformRef.current?.hasPointerCapture(event.pointerId)) {
      waveformRef.current.releasePointerCapture(event.pointerId);
    }
  }

  const startPercent = (region.sampleStart / duration) * 100;
  const endPercent = (region.sampleEnd / duration) * 100;

  return (
    <div
      ref={waveformRef}
      className="waveform-editor nodrag"
      role="group"
      aria-label="Sample playback region. Drag across the waveform to select a region, or drag either boundary."
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishPointer}
      onPointerCancel={finishPointer}
    >
      <div className="waveform-bars" aria-hidden="true">
        {waveform.map((height, index) => (
          <span key={index} style={{ height: `${Math.max(7, height * 100)}%` }} />
        ))}
      </div>
      <div className="waveform-outside left" style={{ width: `${startPercent}%` }} />
      <div
        className="waveform-selection"
        style={{ left: `${startPercent}%`, width: `${Math.max(0, endPercent - startPercent)}%` }}
      />
      <div className="waveform-outside right" style={{ left: `${endPercent}%` }} />
      <button
        type="button"
        className="waveform-handle start"
        data-edge="start"
        style={{ left: `${startPercent}%` }}
        aria-label="Drag sample start"
        tabIndex={-1}
      />
      <button
        type="button"
        className="waveform-handle end"
        data-edge="end"
        style={{ left: `${endPercent}%` }}
        aria-label="Drag sample end"
        tabIndex={-1}
      />
    </div>
  );
}
