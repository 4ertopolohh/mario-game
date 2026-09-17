export class TimerManager {
  constructor() {
    this._timers = [];
    this._nextId = 1;
  }

  /**
   * @param {Function} callback
   * @param {number} delayMs
   * @param {string} scope - "global" | "level" | "entity:<id>"
   * @returns {number} timer id
   */
  schedule(callback, delayMs, scope = "global") {
    const id = this._nextId++;
    this._timers.push({
      id, callback,
      remaining: delayMs,
      scope, cancelled: false
    });
    return id;
  }

  cancel(id) {
    const t = this._timers.find(x => x.id === id);
    if (t) t.cancelled = true;
  }

  clearScope(scope) {
    for (const t of this._timers) {
      if (t.scope === scope) t.cancelled = true;
    }
    this._timers = this._timers.filter(t => !t.cancelled);
  }

  clearScopePrefix(prefix) {
    for (const t of this._timers) {
      if (typeof t.scope === "string" && t.scope.startsWith(prefix)) t.cancelled = true;
    }
    this._timers = this._timers.filter(t => !t.cancelled);
  }

  update(dtMs) {
    const toFire = [];
    for (const t of this._timers) {
      if (t.cancelled) continue;
      t.remaining -= dtMs;
      if (t.remaining <= 0) toFire.push(t);
    }
    this._timers = this._timers.filter(t => !t.cancelled && t.remaining > 0);
    for (const t of toFire) {
      try { t.callback(); }
      catch (e) { console.error("Timer callback error:", e); }
    }
  }

  pause() { /* update() is not called while paused */ }
  resume() { /* reset internal accumulation if needed (n/a) */ }

  clear() { this._timers = []; }
}