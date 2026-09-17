export class GameLoop {
  /**
   * @param {(dt:number)=>void} updateFn
   * @param {(alpha:number)=>void} renderFn
   * @param {number} fixedDt seconds
   * @param {number} maxDeltaMs
   */
  constructor(updateFn, renderFn, fixedDt = 1 / 60, maxDeltaMs = 250) {
    this.updateFn = updateFn;
    this.renderFn = renderFn;
    this.fixedDt = fixedDt;
    this.maxDeltaMs = maxDeltaMs;
    this.accumulator = 0;
    this.lastTime = 0;
    this.running = false;
    this._rafId = 0;
    this._frame = this._frame.bind(this);
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.accumulator = 0;
    this._rafId = requestAnimationFrame(this._frame);
  }

  stop() {
    this.running = false;
    if (this._rafId) cancelAnimationFrame(this._rafId);
    this._rafId = 0;
  }

  clearAccumulator() { this.accumulator = 0; }

  _frame(timestamp) {
    if (!this.running) return;
    let deltaMs = timestamp - this.lastTime;
    this.lastTime = timestamp;
    if (deltaMs > this.maxDeltaMs) deltaMs = this.maxDeltaMs;
    if (deltaMs < 0) deltaMs = 0;
    this.accumulator += deltaMs / 1000;
    let steps = 0;
    const maxSteps = 8;
    while (this.accumulator >= this.fixedDt && steps < maxSteps) {
      this.updateFn(this.fixedDt);
      this.accumulator -= this.fixedDt;
      steps++;
    }
    if (steps >= maxSteps) this.accumulator = 0;
    const alpha = this.accumulator / this.fixedDt;
    this.renderFn(alpha);
    this._rafId = requestAnimationFrame(this._frame);
  }
}