export type PlaygroundSoundKind =
  | "step"
  | "mutate"
  | "output"
  | "complete"
  | "error";

let sharedAudioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") {
    return null;
  }

  const audioCtor =
    window.AudioContext ||
    (window as Window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;

  if (!audioCtor) {
    return null;
  }

  if (!sharedAudioContext) {
    sharedAudioContext = new audioCtor();
  }

  if (sharedAudioContext.state === "suspended") {
    void sharedAudioContext.resume().catch(() => {});
  }

  return sharedAudioContext;
}

function scheduleTone(
  ctx: AudioContext,
  frequency: number,
  startOffsetSec: number,
  durationSec: number,
  type: OscillatorType,
  peakGain: number,
): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const startTime = ctx.currentTime + startOffsetSec;
  const endTime = startTime + durationSec;

  osc.type = type;
  osc.frequency.setValueAtTime(frequency, startTime);

  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(peakGain, startTime + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, endTime);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(startTime);
  osc.stop(endTime + 0.01);
}

export function playPlaygroundSound(kind: PlaygroundSoundKind): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    switch (kind) {
      case "step":
        scheduleTone(ctx, 520, 0, 0.045, "sine", 0.032);
        break;
      case "mutate":
        scheduleTone(ctx, 640, 0, 0.04, "triangle", 0.04);
        scheduleTone(ctx, 880, 0.035, 0.05, "triangle", 0.042);
        break;
      case "output":
        scheduleTone(ctx, 784, 0, 0.05, "sine", 0.045);
        scheduleTone(ctx, 1046.5, 0.045, 0.075, "sine", 0.048);
        break;
      case "complete":
        scheduleTone(ctx, 523.25, 0, 0.06, "sine", 0.042);
        scheduleTone(ctx, 659.25, 0.06, 0.06, "sine", 0.045);
        scheduleTone(ctx, 1046.5, 0.12, 0.11, "triangle", 0.05);
        break;
      case "error":
        scheduleTone(ctx, 220, 0, 0.07, "sawtooth", 0.032);
        scheduleTone(ctx, 150, 0.065, 0.09, "sawtooth", 0.03);
        break;
    }
  } catch {
    // Ignore audio context blocks in headless or restricted environments
  }
}
