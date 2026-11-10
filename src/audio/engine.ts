import * as Tone from "tone";

export type PlaybackSettings = {
  playbackRate: number;
  volumeDb: number;
  loop: boolean;
};

type ActivePlayer = {
  player: Tone.Player;
  startedAt: number;
  startOffset: number;
  playbackRate: number;
  duration: number;
  loop: boolean;
};

const buffers = new Map<string, Tone.ToneAudioBuffer>();
const players = new Map<string, ActivePlayer>();
const pausedOffsets = new Map<string, number>();

export type DecodedSource = {
  duration: number;
  waveform: number[];
};

export async function registerAudioSource(
  sourceId: string,
  blob: Blob,
): Promise<DecodedSource> {
  const context = Tone.getContext().rawContext as AudioContext;
  const decoded = await context.decodeAudioData(await blob.arrayBuffer());
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
  const position = active.startOffset + elapsed;
  return active.loop ? position % active.duration : Math.min(position, active.duration);
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
  if (!buffer) {
    throw new Error("This sound thing's audio source is not loaded.");
  }

  const offset = pausedOffsets.get(soundThingId) ?? 0;
  pausedOffsets.delete(soundThingId);

  const player = new Tone.Player(buffer).toDestination();
  player.loop = settings.loop;
  player.playbackRate = settings.playbackRate;
  player.volume.value = settings.volumeDb;

  const active: ActivePlayer = {
    player,
    startedAt: Tone.now(),
    startOffset: offset,
    playbackRate: settings.playbackRate,
    duration: buffer.duration,
    loop: settings.loop,
  };

  player.onstop = () => {
    if (players.get(soundThingId)?.player === player) {
      players.delete(soundThingId);
      pausedOffsets.delete(soundThingId);
    }
    player.dispose();
    onStop?.();
  };

  players.set(soundThingId, active);
  player.start(undefined, offset);
}

export function pauseSoundThing(soundThingId: string): boolean {
  const active = players.get(soundThingId);
  if (!active) return false;

  const offset = currentPosition(active);
  players.delete(soundThingId);
  active.player.onstop = () => undefined;
  active.player.stop();
  active.player.dispose();

  if (active.loop || offset < active.duration) {
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
  active.startOffset = position;
  active.startedAt = Tone.now();

  if (settings.playbackRate !== undefined) {
    active.playbackRate = settings.playbackRate;
    active.player.playbackRate = settings.playbackRate;
  }
  if (settings.volumeDb !== undefined) {
    active.player.volume.value = settings.volumeDb;
  }
  if (settings.loop !== undefined) {
    active.loop = settings.loop;
    active.player.loop = settings.loop;
  }
}

export function disposeAudioEngine(): void {
  for (const id of [...players.keys()]) stopSoundThing(id);
  for (const buffer of buffers.values()) buffer.dispose();
  buffers.clear();
  pausedOffsets.clear();
}
