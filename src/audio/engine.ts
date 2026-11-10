import * as Tone from "tone";

export type PlaybackSettings = {
  playbackRate: number;
  volumeDb: number;
  loop: boolean;
};

const buffers = new Map<string, Tone.ToneAudioBuffer>();
const players = new Map<string, Tone.Player>();

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

export async function playSoundThing(
  soundThingId: string,
  sourceId: string,
  settings: PlaybackSettings,
  onStop?: () => void,
): Promise<void> {
  await Tone.start();
  stopSoundThing(soundThingId);

  const buffer = buffers.get(sourceId);
  if (!buffer) {
    throw new Error("This sound thing's audio source is not loaded.");
  }

  const player = new Tone.Player(buffer).toDestination();
  player.loop = settings.loop;
  player.playbackRate = settings.playbackRate;
  player.volume.value = settings.volumeDb;
  player.onstop = () => {
    players.delete(soundThingId);
    player.dispose();
    onStop?.();
  };

  players.set(soundThingId, player);
  player.start();
}

export function stopSoundThing(soundThingId: string): void {
  const player = players.get(soundThingId);
  if (!player) return;

  players.delete(soundThingId);
  player.onstop = () => undefined;
  player.stop();
  player.dispose();
}

export function disposeAudioEngine(): void {
  for (const id of players.keys()) stopSoundThing(id);
  for (const buffer of buffers.values()) buffer.dispose();
  buffers.clear();
}
