import { GAME_CONFIG } from "../config/game.config.js";

export class DebugManager {
  constructor() {
    this.enabled = !!GAME_CONFIG.debug.enabled;
    this.fps = 0;
    this._lastTime = 0;
    this._frames = 0;
    this._acc = 0;
  }

  update(dtMs) {
    if (!this.enabled) return;
    this._frames++;
    this._acc += dtMs;
    if (this._acc >= 500) {
      this.fps = Math.round((this._frames * 1000) / this._acc);
      this._frames = 0;
      this._acc = 0;
    }
  }

  formatText(game) {
    const lines = [];
    lines.push(`FPS: ${this.fps}`);
    if (game.player) {
      const p = game.player;
      lines.push(`P pos: ${p.x.toFixed(0)},${p.y.toFixed(0)} v: ${p.vx.toFixed(0)},${p.vy.toFixed(0)}`);
      lines.push(`P grounded: ${p.isGrounded} inv: ${Math.round(p.invulnerabilityMs)}ms`);
    }
    lines.push(`State: ${game.state}`);
    if (game.levelManager && game.levelManager.currentLevel) {
      lines.push(`Level: ${game.levelManager.currentLevelId}`);
    }
    lines.push(`Entities: ${game.entityManager.entities.length}`);
    return lines.join("\n");
  }
}