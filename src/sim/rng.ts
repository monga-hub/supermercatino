// Seeded RNG (mulberry32). Its state lives in GameState.rng so the sim stays deterministic and serializable.
export function rand(s: { rng: number }) {
    let t = (s.rng = (s.rng + 0x6d2b79f5) | 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export const pick = <T>(s: { rng: number }, arr: readonly T[]) => arr[Math.floor(rand(s) * arr.length)];
