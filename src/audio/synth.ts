// Web Audio synth (milestone 16): no audio files. Muzak loop, sound effects, loudspeaker voice (speechSynthesis).
import type { Sound } from './cues.ts';

const KEY = 'supermercatino-audio';
let ctx: AudioContext | null = null;
let master: GainNode, music: GainNode, noise: AudioBuffer;
export let muted = localStorage.getItem(KEY) === 'off';
const voice = typeof speechSynthesis !== 'undefined' ? speechSynthesis : null;

/** Browsers start audio only after a user gesture: the first tap/key creates the context, later ones resume it. */
function unlock() {
    if (ctx) return void ctx.resume();
    ctx = new AudioContext();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 1;
    master.connect(ctx.destination);
    music = ctx.createGain();
    music.gain.value = 0.5;
    music.connect(master);
    noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    noise.getChannelData(0).forEach((_, i, d) => (d[i] = Math.random() * 2 - 1));
    voice?.speak(new SpeechSynthesisUtterance('')); // iOS: speech also needs a gesture first
    setInterval(muzak, 200);
}
addEventListener('pointerdown', unlock, true);
addEventListener('keydown', unlock, true);
document.addEventListener('visibilitychange', () => ctx && (document.hidden ? ctx.suspend() : ctx.resume()));

export function setMuted(m: boolean) {
    muted = m;
    localStorage.setItem(KEY, m ? 'off' : 'on');
    if (ctx) master.gain.value = m ? 0 : 1;
    if (m) voice?.cancel();
}

window.audioState = () => ({ muted, started: !!ctx });

/** One enveloped note. */
function tone(f: number, at: number, dur: number, type: OscillatorType = 'sine', vol = 0.2, out = master) {
    const o = ctx!.createOscillator(), g = ctx!.createGain();
    o.type = type;
    o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(vol, at + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    o.connect(g).connect(out);
    o.start(at);
    o.stop(at + dur + 0.05);
    return o;
}

/** Filtered noise burst (splat, cart wheels). */
function hiss(at: number, dur: number, f: number, vol: number) {
    const src = ctx!.createBufferSource(), flt = ctx!.createBiquadFilter(), g = ctx!.createGain();
    src.buffer = noise;
    flt.type = 'lowpass';
    flt.frequency.setValueAtTime(f, at);
    flt.frequency.exponentialRampToValueAtTime(f / 8, at + dur);
    g.gain.setValueAtTime(vol, at);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    src.connect(flt).connect(g).connect(master);
    src.start(at);
    src.stop(at + dur);
}

const note = (n: number) => 440 * 2 ** ((n - 69) / 12); // MIDI → Hz
const arp = (ns: number[], step: number, type: OscillatorType, vol: number) => ns.forEach((n, i) => tone(note(n), ctx!.currentTime + i * step, step * 2.5, type, vol));

const SFX: Record<Sound, () => void> = {
    bip: () => tone(1760, ctx!.currentTime, 0.09, 'square', 0.05),
    splat: () => hiss(ctx!.currentTime, 0.35, 1800, 0.5),
    carrello: () => { for (let i = 0; i < 8; i++) hiss(ctx!.currentTime + i * 0.05, 0.04, 3000, 0.15); },
    orso: () => arp([72, 76, 79, 84], 0.09, 'triangle', 0.15),
    fischio: () => {
        const t = ctx!.currentTime, o = tone(2600, t, 0.5, 'sine', 0.12), lfo = ctx!.createOscillator(), depth = ctx!.createGain();
        lfo.frequency.value = 28;
        depth.gain.value = 120;
        lfo.connect(depth).connect(o.frequency);
        lfo.start(t);
        lfo.stop(t + 0.55);
    },
    vittoria: () => arp([60, 64, 67, 72, 76, 79, 84], 0.12, 'triangle', 0.18),
    sconfitta: () => arp([67, 66, 65, 64], 0.35, 'triangle', 0.15),
};

/** Ding-dong, then the loudspeaker voice; music ducks while it talks. One announcement at a time. */
function announce(text: string) {
    if (!voice || voice.speaking) return;
    const t = ctx!.currentTime;
    tone(note(76), t, 1.2, 'sine', 0.25);
    tone(note(72), t + 0.5, 1.4, 'sine', 0.25);
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'it-IT';
    u.voice = voice.getVoices().find((v) => v.lang.startsWith('it')) ?? null;
    u.onstart = () => music.gain.setTargetAtTime(0.12, ctx!.currentTime, 0.2);
    u.onend = () => music.gain.setTargetAtTime(0.5, ctx!.currentTime, 0.5);
    setTimeout(() => voice.speak(u), 1300);
}

export function play({ sounds, say }: { sounds: Sound[]; say: string | null }) {
    if (!ctx || muted) return;
    sounds.forEach((s) => SFX[s]());
    if (say) announce(say);
}

// Muzak: lazy bossa in C, Cmaj7 – Am7 – Dm7 – G7, electric-piano chords, walking bass, a little tune. Eighths at 96 bpm.
const EIGHTH = 60 / 96 / 2;
const CHORDS = [[60, 64, 67, 71], [57, 60, 64, 67], [62, 65, 69, 72], [55, 59, 62, 65]];
const BASS = [[36, 43], [33, 40], [38, 45], [31, 38]];
// prettier-ignore
const TUNE = [76, 0, 79, 0, 76, 74, 72, 0,   72, 0, 76, 0, 74, 72, 69, 0,   69, 0, 72, 74, 77, 0, 76, 74,   74, 0, 71, 0, 67, 0, 0, 0,
              79, 0, 81, 79, 76, 0, 72, 0,   76, 0, 74, 72, 69, 0, 72, 0,   77, 76, 74, 0, 72, 0, 69, 0,   71, 0, 74, 0, 79, 0, 0, 0];
let step = 0, next = 0;
function muzak() {
    const c = ctx!;
    if (c.state !== 'running') return;
    next = Math.max(next, c.currentTime + 0.05);
    for (; next < c.currentTime + 0.6; next += EIGHTH, step++) {
        const bar = Math.floor(step / 8) % 4, e = step % 8;
        if (e === 0 || e === 3 || e === 6) CHORDS[bar].forEach((n) => tone(note(n), next, EIGHTH * 2.5, 'sine', 0.035, music));
        if (e === 0 || e === 4) tone(note(BASS[bar][e / 4]), next, EIGHTH * 3.5, 'triangle', 0.12, music);
        const m = TUNE[step % TUNE.length];
        if (m) {
            tone(note(m), next, EIGHTH * 1.8, 'sine', 0.06, music);
            tone(note(m + 12), next, EIGHTH * 0.8, 'sine', 0.015, music); // electric-piano shimmer
        }
    }
}
