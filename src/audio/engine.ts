import * as Tone from "tone";

export type PlaybackSettings = {
  playbackRate: number;
  volumeDb: number;
  loop: boolean;
  sampleStart: number;
  sampleEnd: number;
  loopStart: number;
  loopEnd: number;
};

type ActivePlayer = {
  player: Tone.Player;
  buffer: Tone.ToneAudioBuffer;
  startedAt: number;
  startOffset: number;
  settings: PlaybackSettings;
  onStop?: () => void;
};

const buffers = new Map<string, Tone.ToneAudioBuffer>();
const players = new Map<string, ActivePlayer>();
const pausedOffsets = new Map<string, number>();

export type DecodedSource = {
  duration: number;
  waveform: number[];
};

export function normalizePlaybackSettings(
  settings: Partial<PlaybackSettings>,
  duration: number,
): PlaybackSettings {
  const minimumRegion = Math.min(0.01, duration);
  const sampleStart = Math.min(Math.max(settings.sampleStart ?? 0, 0), duration - minimumRegion);
  const sampleEnd = Math.min(Math.max(settings.sampleEnd ?? duration, sampleStart + minimumRegion), duration);
  const loopStart = Math.min(Math.max(settings.loopStart ?? sampleStart, sampleStart), sampleEnd - minimumRegion);
  const loopEnd = Math.min(Math.max(settings.loopEnd ?? sampleEnd, loopStart + minimumRegion), sampleEnd);

  return {
    playbackRate: Math.min(Math.max(settings.playbackRate ?? 1, 0.05), 4),
    volumeDb: Math.min(Math.max(settings.volumeDb ?? -6, -60), 6),
    loop: settings.loop ?? false,
    sampleStart,
    sampleEnd,
    loopStart,
    loopEnd,
  };
}

export async function registerAudioSource(
  sourceId: string,
  blob: Blob,
): Promise<DecodedSource> {
  const context = Tone.getContext().rawContext as AudioContext;
  const decoded = await context.decodeAudioData(await blob.arrayBuffer());
  const previous = buffers.get(sourceId);
  if (previous) previous.dispose();
  buffers.set(sourceId, new Tone.ToneAudioBuffer(decoded));

  const channel = decoded.getChannelData(0);
  const bucketCount = 72;
  const bucketSize = Math.max(1, Math.floor(channel.length / bucketCount));
  const waveform = Array.from({ length: bucketCount }, (_, index) => {
    const start = index * bucketSize;
    const end = Math.min(channel.length, start + bucketSize);
    let peak = 0;
    for (let cursor = start; cursor < end; cursor += 1) {
      peak = Math.max(peak, Math.abs(channel[cursor]));
    }
    return peak;
  });

  return { duration: decoded.duration, waveform };
}

function currentPosition(active: ActivePlayer): number {
  const { settings } = active;
  const elapsed = Math.max(0, (Tone.now() - active.startedAt) * settings.playbackRate);
  let position = active.startOffset + elapsed;
  if (settings.loop && position >= settings.loopEnd) {
    const loopLength = settings.loopEnd - settings.loopStart;
    position = settings.loopStart + ((position - settings.loopEnd) % loopLength);
  }
  return Math.min(position, settings.sampleEnd);
}

function createActivePlayer(
  soundThingId: string,
  buffer: Tone.ToneAudioBuffer,
  settings: PlaybackSettings,
  offset: number,
  onStop?: () => void,
): ActivePlayer {
  const player = new Tone.Player(buffer).toDestination();
  player.playbackRate = settings.playbackRate;
  player.volume.value = settings.volumeDb;
  player.loop = settings.loop;
  player.setLoopPoints(settings.loopStart, settings.loopEnd);

  const active: ActivePlayer = {
    player,
    buffer,
    startedAt: Tone.now(),
    startOffset: offset,
    settings,
    onStop,
  };

  player.onstop = () => {
    if (players.get(soundThingId)?.player !== player) return;
    players.delete(soundThingId);
    pausedOffsets.delete(soundThingId);
    player.dispose();
    onStop?.();
  };

  players.set(soundThingId, active);
  if (settings.loop) player.start(undefined, offset);
  else player.start(undefined, offset, (settings.sampleEnd - offset) / settings.playbackRate);
  return active;
}

export async function playSoundThing(
  soundThingId: string,
  sourceId: string,
  settings: PlaybackSettings,
  onStop?: () => void,
): Promise<void> {
  await Tone.start();

  const previous = players.get(soundThingId);
  if (previous) {
    previous.player.onstop = () => undefined;
    previous.player.stop();
    previous.player.dispose();
    players.delete(soundThingId);
  }

  const buffer = buffers.get(sourceId);
  if (!buffer) throw new Error("This sound thing's audio source is not loaded.");

  const config = normalizePlaybackSettings(settings, buffer.duration);
  let offset = pausedOffsets.get(soundThingId) ?? config.sampleStart;
  pausedOffsets.delete(soundThingId);
  if (offset < config.sampleStart || offset >= config.sampleEnd) offset = config.sampleStart;
  if (config.loop && offset >= config.loopEnd) {
    offset = config.loopStart + ((offset - config.loopEnd) % (config.loopEnd - config.loopStart));
  }

  createActivePlayer(soundThingId, buffer, config, offset, onStop);
}

export function pauseSoundThing(soundThingId: string): boolean {
  const active = players.get(soundThingId);
  if (!active) return false;

  const offset = currentPosition(active);
  players.delete(soundThingId);
  active.player.onstop = () => undefined;
  active.player.stop();
  active.player.dispose();

  if (active.settings.loop || offset < active.settings.sampleEnd) {
    pausedOffsets.set(soundThingId, offset);
    return true;
  }
  pausedOffsets.delete(soundThingId);
  return false;
}

export function stopSoundThing(soundThingId: string): void {
  const active = players.get(soundThingId);
  pausedOffsets.delete(soundThingId);
  if (!active) return;
  players.delete(soundThingId);
  active.player.onstop = () => undefined;
  active.player.stop();
  active.player.dispose();
}

export function updateSoundThingSettings(
  soundThingId: string,
  settings: Partial<PlaybackSettings>,
): void {
  const active = players.get(soundThingId);
  if (!active) return;

  const position = currentPosition(active);
  const regionChanged = settings.sampleStart !== undefined || settings.sampleEnd !== undefined;
  if (regionChanged) {
    stopSoundThing(soundThingId);
    active.onStop?.();
    return;
  }

  const nextSettings = normalizePlaybackSettings(
    { ...active.settings, ...settings },
    active.buffer.duration,
  );
  const restartRequired =
    nextSettings.playbackRate !== active.settings.playbackRate ||
    nextSettings.loop !== active.settings.loop;

  if (restartRequired) {
    active.player.onstop = () => undefined;
    active.player.stop();
    active.player.dispose();
    createActivePlayer(soundThingId, active.buffer, nextSettings, position, active.onStop);
    return;
  }

  active.startOffset = position;
  active.startedAt = Tone.now();
  active.settings = nextSettings;
  active.player.volume.value = nextSettings.volumeDb;
  active.player.loopStart = nextSettings.loopStart;
  active.player.loopEnd = nextSettings.loopEnd;
}

export function disposeAudioEngine(): void {
  for (const id of [...players.keys()]) stopSoundThing(id);
  for (const buffer of buffers.values()) buffer.dispose();
  buffers.clear();
  pausedOffsets.clear();
}
