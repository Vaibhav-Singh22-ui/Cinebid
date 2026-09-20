// Web Audio API synthesized sound effects (zero network latency, 100% reliable, no external assets required)

let audioCtx: AudioContext | null = null;
const MUTE_STORAGE_KEY = "cinebid_audio_muted";

let isMutedInMemory: boolean = (() => {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(MUTE_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
})();

export function isAudioMuted(): boolean {
  return isMutedInMemory;
}

export function toggleAudioMute(): boolean {
  isMutedInMemory = !isMutedInMemory;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(MUTE_STORAGE_KEY, String(isMutedInMemory));
    } catch {
      // ignore
    }
  }
  return isMutedInMemory;
}

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined" || isMutedInMemory) return null;
  try {
    if (!audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        audioCtx = new AudioCtxClass();
      }
    }
    if (audioCtx && audioCtx.state === "suspended") {
      void audioCtx.resume();
    }
    return audioCtx;
  } catch {
    return null;
  }
}

/**
 * Plays an auction gavel tap / wooden strike sound for placed bids
 */
export function playBidSound() {
  if (isMutedInMemory) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.35, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.09);

    // Subtle click impact
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(880, ctx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.04);
    gain2.gain.setValueAtTime(0.2, ctx.currentTime);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start();
    osc2.stop(ctx.currentTime + 0.04);
  } catch {
    // Ignore audio failures
  }
}

/**
 * Plays cash register "Cha-Ching!" with coin cascade for major bids (>= ₹10 Cr or record bids)
 */
export function playChaChingSound() {
  if (isMutedInMemory) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // High cash register bell chime
    const bellOsc = ctx.createOscillator();
    const bellGain = ctx.createGain();
    bellOsc.type = "sine";
    bellOsc.frequency.setValueAtTime(1975.53, now); // B6
    bellGain.gain.setValueAtTime(0.3, now);
    bellGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    bellOsc.connect(bellGain);
    bellGain.connect(ctx.destination);
    bellOsc.start(now);
    bellOsc.stop(now + 0.5);

    // Coin jingle cascade
    const coinPitches = [2637, 3135, 3951, 4186];
    coinPitches.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const st = now + 0.08 + idx * 0.04;
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, st);
      gain.gain.setValueAtTime(0.18, st);
      gain.gain.exponentialRampToValueAtTime(0.001, st + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(st);
      osc.stop(st + 0.15);
    });
  } catch {
    // Ignore
  }
}

/**
 * Plays heavy gavel impact + victory chords when a player/movie is SOLD
 */
export function playSoldCelebrationSound() {
  if (isMutedInMemory) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Heavy wooden gavel thud 1
    const thud1 = ctx.createOscillator();
    const thudGain1 = ctx.createGain();
    thud1.type = "sawtooth";
    thud1.frequency.setValueAtTime(180, now);
    thud1.frequency.exponentialRampToValueAtTime(40, now + 0.12);
    thudGain1.gain.setValueAtTime(0.6, now);
    thudGain1.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    thud1.connect(thudGain1);
    thudGain1.connect(ctx.destination);
    thud1.start(now);
    thud1.stop(now + 0.14);

    // Second heavier thud "SOLD!"
    const thud2 = ctx.createOscillator();
    const thudGain2 = ctx.createGain();
    thud2.type = "sine";
    thud2.frequency.setValueAtTime(220, now + 0.16);
    thud2.frequency.exponentialRampToValueAtTime(50, now + 0.32);
    thudGain2.gain.setValueAtTime(0.7, now + 0.16);
    thudGain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    thud2.connect(thudGain2);
    thudGain2.connect(ctx.destination);
    thud2.start(now + 0.16);
    thud2.stop(now + 0.35);

    // Fanfare chords
    const chordNotes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    chordNotes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const st = now + 0.35 + i * 0.08;
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, st);
      gain.gain.setValueAtTime(0.25, st);
      gain.gain.exponentialRampToValueAtTime(0.001, st + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(st);
      osc.stop(st + 0.45);
    });
  } catch {
    // Ignore
  }
}

/**
 * Backward-compatible alias for playSoldCelebrationSound
 */
export function playGavelWinSound() {
  playSoldCelebrationSound();
}

/**
 * Funny sad trombone / clown horn ("wah-wah-wah-waaaah") when item goes UNSOLD
 */
export function playUnsoldSadHornSound() {
  if (isMutedInMemory) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    // Notes: D4, C#4, C4, B3 (with pitch wobble)
    const notes = [
      { freq: 293.66, dur: 0.22, delay: 0 },
      { freq: 277.18, dur: 0.22, delay: 0.24 },
      { freq: 261.63, dur: 0.22, delay: 0.48 },
      { freq: 246.94, dur: 0.55, delay: 0.72, wobble: true },
    ];

    notes.forEach((item) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const st = now + item.delay;

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(item.freq, st);

      if (item.wobble) {
        osc.frequency.linearRampToValueAtTime(item.freq - 15, st + item.dur);
      }

      gain.gain.setValueAtTime(0.18, st);
      gain.gain.exponentialRampToValueAtTime(0.001, st + item.dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(st);
      osc.stop(st + item.dur);
    });
  } catch {
    // Ignore
  }
}

/**
 * Dramatic countdown ticking with rising pitch for last seconds (3, 2, 1)
 */
export function playDramaticTickSound(secondsLeft: number) {
  if (isMutedInMemory) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;

    const baseFreq = secondsLeft <= 1 ? 1200 : secondsLeft <= 2 ? 1000 : 800;
    osc.type = "sine";
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq / 2, now + 0.05);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.06);
  } catch {
    // Ignore
  }
}

/**
 * Plays an urgent outbid warning chime when another bidder takes the lead
 */
export function playOutbidWarningSound() {
  if (isMutedInMemory) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = "sawtooth";
    osc2.type = "triangle";
    osc1.frequency.setValueAtTime(600, now);
    osc1.frequency.linearRampToValueAtTime(900, now + 0.1);
    osc2.frequency.setValueAtTime(900, now);
    osc2.frequency.linearRampToValueAtTime(1200, now + 0.1);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.14);
    osc2.stop(now + 0.14);
  } catch {
    // Ignore
  }
}

/**
 * Plays a funny meme stadium fanfare / airhorn
 */
export function playMemeAirhornSound() {
  if (isMutedInMemory) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    // Classic triplets
    const bursts = [0, 0.12, 0.24, 0.4];
    bursts.forEach((t) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const st = now + t;
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(466.16, st); // Bb4
      gain.gain.setValueAtTime(0.22, st);
      gain.gain.exponentialRampToValueAtTime(0.001, st + 0.09);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(st);
      osc.stop(st + 0.09);
    });
  } catch {
    // Ignore
  }
}

/**
 * Plays a subtle chime for incoming/outgoing chat messages
 */
export function playChatSound() {
  if (isMutedInMemory) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.06); // A5

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.12);
  } catch {
    // Ignore
  }
}
