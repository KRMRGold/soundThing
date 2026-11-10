import type { PlaybackSettings } from "../audio/engine";

const DATABASE_NAME = "soundthing-workspace";
const DATABASE_VERSION = 1;
const SOURCE_STORE = "audio-sources";
const WORKSPACE_STORE = "workspaces";

export type AudioSourceRecord = {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  blob: Blob;
  duration: number;
  waveform: number[];
};

export type StoredSoundThing = {
  id: string;
  sourceId: string;
  sourceName: string;
  duration: number;
  waveform: number[];
  position: { x: number; y: number };
  playbackRate: number;
  volumeDb: number;
  loop: boolean;
};

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(SOURCE_STORE)) {
        database.createObjectStore(SOURCE_STORE, { keyPath: "id" });
      }
      if (!database.objectStoreNames.contains(WORKSPACE_STORE)) {
        database.createObjectStore(WORKSPACE_STORE, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function storeAudioSource(source: AudioSourceRecord): Promise<void> {
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(SOURCE_STORE, "readwrite");
    transaction.objectStore(SOURCE_STORE).put(source);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
  database.close();
}

export async function loadAudioSources(): Promise<AudioSourceRecord[]> {
  const database = await openDatabase();
  const sources = await new Promise<AudioSourceRecord[]>((resolve, reject) => {
    const request = database.transaction(SOURCE_STORE).objectStore(SOURCE_STORE).getAll();
    request.onsuccess = () => resolve(request.result as AudioSourceRecord[]);
    request.onerror = () => reject(request.error);
  });
  database.close();
  return sources;
}

export async function saveWorkspace(
  soundThings: StoredSoundThing[],
): Promise<void> {
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(WORKSPACE_STORE, "readwrite");
    transaction.objectStore(WORKSPACE_STORE).put({
      id: "current",
      soundThings,
      savedAt: new Date().toISOString(),
    });
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
  database.close();
}

export async function loadWorkspace(): Promise<StoredSoundThing[]> {
  const database = await openDatabase();
  const record = await new Promise<{ soundThings?: StoredSoundThing[] } | undefined>(
    (resolve, reject) => {
      const request = database
        .transaction(WORKSPACE_STORE)
        .objectStore(WORKSPACE_STORE)
        .get("current");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    },
  );
  database.close();
  return record?.soundThings ?? [];
}
