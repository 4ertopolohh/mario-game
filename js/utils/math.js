export function clamp(v, min, max) {
  return v < min ? min : (v > max ? max : v);
}
export function lerp(a, b, t) { return a + (b - a) * t; }
export function sign(v) { return v > 0 ? 1 : (v < 0 ? -1 : 0); }