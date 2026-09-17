export function intersects(a, b) {
  return a.x < b.x + b.width &&
         a.x + a.width > b.x &&
         a.y < b.y + b.height &&
         a.y + a.height > b.y;
}

export function overlapX(a, b) {
  return Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
}

export function overlapY(a, b) {
  return Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
}

export function contains(outer, inner) {
  return inner.x >= outer.x &&
         inner.y >= outer.y &&
         inner.x + inner.width <= outer.x + outer.width &&
         inner.y + inner.height <= outer.y + outer.height;
}

export function centerX(r) { return r.x + r.width / 2; }
export function centerY(r) { return r.y + r.height / 2; }