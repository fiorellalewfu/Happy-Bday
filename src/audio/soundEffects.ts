// Electronic & Deep House inspired sound synthesizer for Jonathan's adventure
let audioCtx: AudioContext | null = null;
let isMuted = false;
let bgMusicInterval: number | null = null;
let isBgmPlaying = false;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function toggleMute(): boolean {
  isMuted = !isMuted;
  if (isMuted && isBgmPlaying) {
    stopBackgroundMusic();
  }
  return isMuted;
}

export function getMuteState(): boolean {
  return isMuted;
}

export function playJumpSound() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  // Resonant electronic synth filter sweep + sub pop
  const osc = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(140, now);
  osc.frequency.exponentialRampToValueAtTime(260, now + 0.12);

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(800, now);
  filter.frequency.exponentialRampToValueAtTime(2200, now + 0.08);
  filter.frequency.exponentialRampToValueAtTime(200, now + 0.16);

  gain.gain.setValueAtTime(0.12, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.16);
}

export function playStarSound() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  // Lush Melodic House Chord Arpeggio (D minor 9th / F major 7: D4, F4, A4, C5, E5)
  const notes = [293.66, 349.23, 440.0, 523.25, 659.25, 880.0];
  const startTime = ctx.currentTime;

  notes.forEach((freq, idx) => {
    const noteTime = startTime + idx * 0.07;
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(freq, noteTime);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200 + idx * 400, noteTime);

    gain.gain.setValueAtTime(0, noteTime);
    gain.gain.linearRampToValueAtTime(0.2, noteTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.55);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(noteTime);
    osc.stop(noteTime + 0.6);
  });
}

export function playEasterEggSound() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  // Modern analog synth chime
  const notes = [392.00, 587.33, 880.00, 1174.66]; // G4, D5, A5, D6 (open 5ths/9th)
  const startTime = ctx.currentTime;

  notes.forEach((freq, idx) => {
    const noteTime = startTime + idx * 0.05;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, noteTime);

    gain.gain.setValueAtTime(0.14, noteTime);
    gain.gain.exponentialRampToValueAtTime(0.005, noteTime + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(noteTime);
    osc.stop(noteTime + 0.42);
  });
}

export function playVictoryFanfare() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  // Uplifting electronic house chord swell
  const chords = [
    [261.63, 329.63, 392.00],        // C maj
    [293.66, 349.23, 440.00, 523.25], // D min 7
    [329.63, 392.00, 493.88, 587.33], // E min 7
    [523.25, 659.25, 783.99, 1046.50]  // C maj high
  ];

  const startTime = ctx.currentTime;

  chords.forEach((chord, chordIdx) => {
    const chordTime = startTime + chordIdx * 0.28;
    chord.forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, chordTime);

      gain.gain.setValueAtTime(0, chordTime);
      gain.gain.linearRampToValueAtTime(0.18, chordTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, chordTime + (chordIdx === 3 ? 1.4 : 0.45));

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(chordTime);
      osc.stop(chordTime + (chordIdx === 3 ? 1.5 : 0.5));
    });
  });
}

// Gentle ambient deep house chord groove (used as fallback when soundcloud is paused or muted)
export function startBackgroundMusic() {
  if (isBgmPlaying || isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  isBgmPlaying = true;
  const chordProgression = [
    [220.0, 261.63, 329.63], // Am
    [174.61, 220.0, 261.63], // F
    [261.63, 329.63, 392.0], // C
    [196.0, 246.94, 293.66]  // G
  ];
  let step = 0;

  bgMusicInterval = window.setInterval(() => {
    if (isMuted || !isBgmPlaying) return;
    const now = ctx.currentTime;
    const chord = chordProgression[step % chordProgression.length];
    step++;

    chord.forEach((freq) => {
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.02, now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.95);
    });
  }, 950);
}

export function stopBackgroundMusic() {
  if (bgMusicInterval) {
    clearInterval(bgMusicInterval);
    bgMusicInterval = null;
  }
  isBgmPlaying = false;
}
