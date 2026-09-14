// Electronic & Deep House inspired sound synthesizer for Jonathan's adventure
let audioCtx: AudioContext | null = null;
let isMuted = false;

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

// Super Mario-style Star Power / DJ Evolution Fanfare!
export function playSuperStarEvolutionSound() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const startTime = ctx.currentTime;

  // Rapid ascending star power scale (evoking the iconic Super Mario Star item rush!)
  const starNotes = [
    523.25, // C5
    587.33, // D5
    659.25, // E5
    783.99, // G5
    880.00, // A5
    1046.50, // C6
    1174.66, // D6
    1318.51, // E6
    1567.98, // G6
    2093.00  // C7!
  ];

  starNotes.forEach((freq, idx) => {
    const noteTime = startTime + idx * 0.065;
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    // Pulse/square blend for that authentic retro-modern star power bounce
    osc.type = idx % 2 === 0 ? 'sawtooth' : 'square';
    osc.frequency.setValueAtTime(freq, noteTime);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3000 + idx * 300, noteTime);

    gain.gain.setValueAtTime(0, noteTime);
    gain.gain.linearRampToValueAtTime(0.18, noteTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.28);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(noteTime);
    osc.stop(noteTime + 0.3);
  });

  // Massive sub drop + shimmer chord on transformation completion
  const impactTime = startTime + starNotes.length * 0.065;
  const subOsc = ctx.createOscillator();
  const subGain = ctx.createGain();
  subOsc.type = 'sine';
  subOsc.frequency.setValueAtTime(160, impactTime);
  subOsc.frequency.exponentialRampToValueAtTime(45, impactTime + 0.6);
  subGain.gain.setValueAtTime(0.3, impactTime);
  subGain.gain.exponentialRampToValueAtTime(0.001, impactTime + 0.65);
  subOsc.connect(subGain);
  subGain.connect(ctx.destination);
  subOsc.start(impactTime);
  subOsc.stop(impactTime + 0.7);

  // Sparkling high chord shimmer
  [1046.50, 1318.51, 1567.98, 2093.00].forEach((freq) => {
    const shimmerOsc = ctx.createOscillator();
    const shimmerGain = ctx.createGain();
    shimmerOsc.type = 'triangle';
    shimmerOsc.frequency.setValueAtTime(freq, impactTime);
    shimmerGain.gain.setValueAtTime(0.1, impactTime);
    shimmerGain.gain.exponentialRampToValueAtTime(0.001, impactTime + 0.9);
    shimmerOsc.connect(shimmerGain);
    shimmerGain.connect(ctx.destination);
    shimmerOsc.start(impactTime);
    shimmerOsc.stop(impactTime + 0.95);
  });
}

// Celestial Angelic Flight Fanfare (Chapter 4: Papá y Mamá - Dos Luces en el Cielo)
export function playCelestialFanfare() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const startTime = ctx.currentTime;

  // Lyrical harp-like ascending glissando
  const notes = [
    329.63, 392.00, 493.88, 587.33, 659.25, 783.99, 987.77, 1174.66, 1318.51
  ];

  notes.forEach((freq, idx) => {
    const noteTime = startTime + idx * 0.07;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, noteTime);

    gain.gain.setValueAtTime(0, noteTime);
    gain.gain.linearRampToValueAtTime(0.16, noteTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.8);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(noteTime);
    osc.stop(noteTime + 0.85);
  });

  // Radiant celestial chord resonance
  const chordTime = startTime + 0.65;
  const chordFreqs = [523.25, 659.25, 783.99, 1046.50, 1318.51];
  chordFreqs.forEach((freq) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, chordTime);

    gain.gain.setValueAtTime(0, chordTime);
    gain.gain.linearRampToValueAtTime(0.12, chordTime + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, chordTime + 1.6);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(chordTime);
    osc.stop(chordTime + 1.7);
  });
}

// Flight soaring / wing flap sound (gentle ethereal lift)
let lastFlightSoundTime = 0;
export function playCelestialFlightSound() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = Date.now();
  if (now - lastFlightSoundTime < 380) return; // throttle flaps
  lastFlightSoundTime = now;

  const startTime = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(440, startTime);
  osc.frequency.exponentialRampToValueAtTime(880, startTime + 0.22);

  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(0.1, startTime + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.28);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(startTime);
  osc.stop(startTime + 0.3);
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
