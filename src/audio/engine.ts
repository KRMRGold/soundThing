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
  startedAt: number;
  startOffset: number;
  playbackRate: number;
  sampleEnd: number;
  loopStart: number;
  loopEnd: number;
  loop: boolean;
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
  const sampleStart = Math.min(Math.max(settings.sampleStart ?? 0, 0), duration);
  const sampleEnd = Math.min(Math.max(settings.sampleEnd ?? duration, sampleStart + 0.01), duration);
  const loopStart = Math.min(Math.max(settings.loopStart ?? sampleStart, sampleStart), sampleEnd - 0.01);
  const loopEnd = Math.min(Math.max(settings.loopEnd ?? sampleEnd, loopStart + 0.01), sampleEnd);

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
  const elapsed = Math.max(0, (Tone.now() - active.startedAt) * active.playbackRate);
  let position = active.startOffset + elapsed;
  if (active.loop && position >= active.loopEnd) {
    const loopLength = active.loopEnd - active.loopStart;
    position = active.loopStart + ((position - active.loopEnd) % loopLength);
  }
  return Math.min(position, active.sampleEnd);
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

  const player = new Tone.Player(buffer).toDestination();
  player.playbackRate = config.playbackRate;
  player.volume.value = config.volumeDb;
  player.loop = config.loop;
  player.setLoopPoints(config.loopStart, config.loopEnd);

  const active: ActivePlayer = {
    player,
    startedAt: Tone.now(),
    startOffset: offset,
    playbackRate: config.playbackRate,
    sampleEnd: config.sampleEnd,
    loopStart: config.loopStart,
    loopEnd: config.loopEnd,
    loop: config.loop,
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
  if (config.loop) player.start(undefined, offset);
  else player.start(undefined, offset, config.sampleEnd - offset);
}

export function pauseSoundThing(soundThingId: string): boolean {
  const active = players.get(soundThingId);
  if (!active) return false;

  const offset = currentPosition(active);
  players.delete(soundThingId);
  active.player.onstop = () => undefined;
  active.player.stop();
  active.player.dispose();

  if (active.loop || offset < active.sampleEnd) {
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

  active.startOffset = position;
  active.startedAt = Tone.now();

  if (settings.playbackRate !== undefined) {
    active.playbackRate = settings.playbackRate;
    active.player.playbackRate = settings.playbackRate;
  }
  if (settings.volumeDb !== undefined) active.player.volume.value = settings.volumeDb;
  if (settings.loopStart !== undefined) {
    active.loopStart = settings.loopStart;
    active.player.loopStart = settings.loopStart;
  }
  if (settings.loopEnd !== undefined) {
    active.loopEnd = settings.loopEnd;
    active.player.loopEnd = settings.loopEnd;
  }
  if (settings.loop !== undefined && settings.loop !== active.loop) {
    active.loop = settings.loop;
    active.player.loop = settings.loop;
    if (!settings.loop) {
      const remaining = Math.max(0, active.sampleEnd - position) / active.playbackRate;
      active.player.stop(Tone.now() + remaining);
    }
  }
}

export function disposeAudioEngine(): void {
  for (const id of [...players.keys()]) stopSoundThing(id);
  for (const buffer of buffers.values()) buffer.dispose();
  buffers.clear();
  pausedOffsets.clear();
}
