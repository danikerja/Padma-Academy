// Web Audio API security siren synthesizer.
// Uses an LFO-modulated oscillator on the audio rendering thread so the siren
// sweeps smoothly even when the browser tab is hidden/backgrounded.

let sharedAudioCtx: AudioContext | null = null;
let activeNodes: {
  mainOsc: OscillatorNode;
  subOsc: OscillatorNode;
  lfoOsc: OscillatorNode;
  masterGain: GainNode;
} | null = null;
let autoStopTimer: number | null = null;
let stopCallbacks: Array<() => void> = [];

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctx) return null;
  if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
    sharedAudioCtx = new Ctx();
  }
  return sharedAudioCtx;
}

export function isSirenAudioReady(): boolean {
  if (!sharedAudioCtx) return false;
  return sharedAudioCtx.state === 'running';
}

export async function unlockSirenAudio(): Promise<boolean> {
  const ctx = getAudioContext();
  if (!ctx) return false;
  if (ctx.state === 'suspended') {
    try {
      await ctx.resume();
    } catch {
      return false;
    }
  }
  return ctx.state === 'running';
}

export function stopSecuritySiren(): void {
  if (autoStopTimer !== null) {
    window.clearTimeout(autoStopTimer);
    autoStopTimer = null;
  }
  if (activeNodes && sharedAudioCtx) {
    const { mainOsc, subOsc, lfoOsc, masterGain } = activeNodes;
    const now = sharedAudioCtx.currentTime;
    try {
      masterGain.gain.cancelScheduledValues(now);
      masterGain.gain.setValueAtTime(masterGain.gain.value, now);
      masterGain.gain.linearRampToValueAtTime(0.0001, now + 0.08);
      window.setTimeout(() => {
        try {
          mainOsc.stop();
          subOsc.stop();
          lfoOsc.stop();
          mainOsc.disconnect();
          subOsc.disconnect();
          lfoOsc.disconnect();
          masterGain.disconnect();
        } catch {
          // Ignore already-stopped nodes
        }
      }, 100);
    } catch {
      // Ignore cleanup errors
    }
    activeNodes = null;
  }

  const cbs = stopCallbacks;
  stopCallbacks = [];
  cbs.forEach((cb) => {
    try {
      cb();
    } catch {
      // Ignore callback error
    }
  });
}

export async function startSecuritySiren(options?: {
  durationMs?: number;
  onStop?: () => void;
}): Promise<boolean> {
  const durationMs = options?.durationMs ?? 12000;
  const ctx = getAudioContext();
  if (!ctx) return false;

  if (ctx.state === 'suspended') {
    try {
      await ctx.resume();
    } catch {
      return false;
    }
  }

  if (ctx.state !== 'running') {
    return false;
  }

  // If already playing, reset the auto-stop timer and register callback
  if (activeNodes) {
    if (options?.onStop) stopCallbacks.push(options.onStop);
    if (autoStopTimer !== null) window.clearTimeout(autoStopTimer);
    autoStopTimer = window.setTimeout(() => {
      stopSecuritySiren();
    }, durationMs);
    return true;
  }

  if (options?.onStop) {
    stopCallbacks.push(options.onStop);
  }

  const now = ctx.currentTime;

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(2400, now);
  filter.Q.setValueAtTime(1.5, now);

  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.0001, now);
  masterGain.gain.linearRampToValueAtTime(0.24, now + 0.06);

  // Main piercing security tone (sweeping 680Hz - 1160Hz)
  const mainOsc = ctx.createOscillator();
  mainOsc.type = 'sawtooth';
  mainOsc.frequency.setValueAtTime(920, now);

  // Harmonic reinforcement tone
  const subOsc = ctx.createOscillator();
  subOsc.type = 'triangle';
  subOsc.frequency.setValueAtTime(460, now);

  // LFO on audio thread (~1.6 sweeps per second)
  const lfoOsc = ctx.createOscillator();
  lfoOsc.type = 'sine';
  lfoOsc.frequency.setValueAtTime(1.6, now);

  const lfoMainGain = ctx.createGain();
  lfoMainGain.gain.setValueAtTime(240, now);

  const lfoSubGain = ctx.createGain();
  lfoSubGain.gain.setValueAtTime(120, now);

  lfoOsc.connect(lfoMainGain);
  lfoMainGain.connect(mainOsc.frequency);

  lfoOsc.connect(lfoSubGain);
  lfoSubGain.connect(subOsc.frequency);

  mainOsc.connect(filter);
  subOsc.connect(filter);
  filter.connect(masterGain);
  masterGain.connect(ctx.destination);

  mainOsc.start(now);
  subOsc.start(now);
  lfoOsc.start(now);

  activeNodes = { mainOsc, subOsc, lfoOsc, masterGain };

  autoStopTimer = window.setTimeout(() => {
    stopSecuritySiren();
  }, durationMs);

  return true;
}
