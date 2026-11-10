import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";
import {
  normalizeStoredSoundThing,
  type AudioSourceRecord,
  type StoredSoundThing,
} from "./workspace";

const PROJECT_FORMAT = "soundthing-project";
const PROJECT_VERSION = 1;
const MANIFEST_PATH = "manifest.json";

type ProjectAudioSource = Omit<AudioSourceRecord, "blob"> & {
  archivePath: string;
};

type ProjectManifest = {
  format: typeof PROJECT_FORMAT;
  version: typeof PROJECT_VERSION;
  createdAt: string;
  soundThings: StoredSoundThing[];
  audioSources: ProjectAudioSource[];
};

export type ImportedProject = {
  soundThings: StoredSoundThing[];
  audioSources: AudioSourceRecord[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateSoundThings(value: unknown): StoredSoundThing[] {
  if (!Array.isArray(value)) throw new Error("The project manifest has no valid sound-thing list.");

  return value.map((item, index) => {
    if (!isRecord(item) ||
      typeof item.id !== "string" ||
      typeof item.sourceId !== "string" ||
      typeof item.sourceName !== "string" ||
      typeof item.duration !== "number" ||
      !Number.isFinite(item.duration) ||
      !Array.isArray(item.waveform) ||
      !isRecord(item.position) ||
      typeof item.position.x !== "number" ||
      typeof item.position.y !== "number" ||
      typeof item.playbackRate !== "number" ||
      typeof item.volumeDb !== "number" ||
      typeof item.loop !== "boolean" ||
      !item.waveform.every((point) => typeof point === "number" && Number.isFinite(point)) ||
      ["sampleStart", "sampleEnd", "loopStart", "loopEnd"].some(
        (key) => item[key] !== undefined && (typeof item[key] !== "number" || !Number.isFinite(item[key])),
      )) {
      throw new Error(`Sound thing ${index + 1} in this project is invalid.`);
    }

    const legacyCompatible = {
      ...item,
      sampleStart: typeof item.sampleStart === "number" ? item.sampleStart : 0,
      sampleEnd: typeof item.sampleEnd === "number" ? item.sampleEnd : item.duration,
      loopStart: typeof item.loopStart === "number" ? item.loopStart : 0,
      loopEnd: typeof item.loopEnd === "number" ? item.loopEnd : item.duration,
    } as unknown as StoredSoundThing;

    return normalizeStoredSoundThing(legacyCompatible);
  });
}

export async function createProjectFile(
  soundThings: StoredSoundThing[],
  availableSources: AudioSourceRecord[],
): Promise<Blob> {
  const usedSourceIds = new Set(soundThings.map((thing) => thing.sourceId));
  const sources = availableSources.filter((source) => usedSourceIds.has(source.id));

  for (const sourceId of usedSourceIds) {
    if (!sources.some((source) => source.id === sourceId)) {
      throw new Error("A sound thing is missing its audio source. The project could not be exported.");
    }
  }

  const audioSources: ProjectAudioSource[] = [];
  const archive: Record<string, Uint8Array> = {};

  for (const [index, source] of sources.entries()) {
    const archivePath = `audio/source-${index + 1}.bin`;
    audioSources.push({
      id: source.id,
      name: source.name,
      mimeType: source.mimeType,
      size: source.size,
      duration: source.duration,
      waveform: source.waveform,
      archivePath,
    });
    archive[archivePath] = new Uint8Array(await source.blob.arrayBuffer());
  }

  const manifest: ProjectManifest = {
    format: PROJECT_FORMAT,
    version: PROJECT_VERSION,
    createdAt: new Date().toISOString(),
    soundThings: soundThings.map((thing) => normalizeStoredSoundThing(thing)),
    audioSources,
  };

  archive[MANIFEST_PATH] = strToU8(JSON.stringify(manifest, null, 2));
  const zipped = zipSync(archive, { level: 6 });
  const bytes = zipped.buffer.slice(zipped.byteOffset, zipped.byteOffset + zipped.byteLength) as ArrayBuffer;
  return new Blob([bytes], { type: "application/zip" });
}

export async function readProjectFile(file: File): Promise<ImportedProject> {
  let archive: Record<string, Uint8Array>;
  try {
    archive = unzipSync(new Uint8Array(await file.arrayBuffer()));
  } catch {
    throw new Error("This file is not a valid soundThing project archive.");
  }

  const manifestBytes = archive[MANIFEST_PATH];
  if (!manifestBytes) throw new Error("This project is missing its manifest.");

  let parsed: unknown;
  try {
    parsed = JSON.parse(strFromU8(manifestBytes));
  } catch {
    throw new Error("The project manifest could not be read.");
  }

  if (!isRecord(parsed) || parsed.format !== PROJECT_FORMAT) {
    throw new Error("This is not a soundThing project file.");
  }
  if (parsed.version !== PROJECT_VERSION) {
    throw new Error(`This project uses an unsupported format version (${String(parsed.version)}).`);
  }

  const soundThings = validateSoundThings(parsed.soundThings);
  if (!Array.isArray(parsed.audioSources)) {
    throw new Error("The project manifest has no valid audio-source list.");
  }

  const audioSources: AudioSourceRecord[] = parsed.audioSources.map((item, index) => {
    if (!isRecord(item) ||
      typeof item.id !== "string" ||
      typeof item.name !== "string" ||
      typeof item.mimeType !== "string" ||
      typeof item.size !== "number" ||
      typeof item.duration !== "number" ||
      !Array.isArray(item.waveform) ||
      !item.waveform.every((point) => typeof point === "number" && Number.isFinite(point)) ||
      typeof item.archivePath !== "string" ||
      !item.archivePath.startsWith("audio/")) {
      throw new Error(`Audio source ${index + 1} in this project is invalid.`);
    }

    const bytes = archive[item.archivePath];
    if (!bytes || bytes.byteLength !== item.size) {
      throw new Error(`Audio data for "${item.name}" is missing or incomplete.`);
    }

    return {
      id: item.id,
      name: item.name,
      mimeType: item.mimeType,
      size: item.size,
      duration: item.duration,
      waveform: item.waveform as number[],
      blob: new Blob([bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer], {
        type: item.mimeType,
      }),
    };
  });

  const sourceIds = new Set(audioSources.map((source) => source.id));
  if (soundThings.some((thing) => !sourceIds.has(thing.sourceId))) {
    throw new Error("One or more sound things refer to missing audio sources.");
  }

  return { soundThings, audioSources };
}
