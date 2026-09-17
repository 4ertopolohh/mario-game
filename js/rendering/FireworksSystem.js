import { FINALE_CONFIG } from "../config/finale.config.js";

/**
 * Пиксельные салюты: ракеты + частицы.
 * Работает в мировых координатах, обновляется через update(dt).
 */
export class FireworksSystem {
  constructor(config = FINALE_CONFIG.fireworks) {
    this.config = config;
    this.active = false;
    this.rockets = [];
    this.particles = [];
    this.spawnTimer = 0;
  }

  start() {
    this.active = true;
    this.spawnTimer = 0;
    this.rockets.length = 0;
    this.particles.length = 0;
  }

  stop() {
    this.active = false;
    this.rockets.length = 0;
    this.particles.length = 0;
  }

  /**
   * @param {number} dt
   * @param {import("./Camera.js").Camera} camera
   */
  update(dt, camera) {
    if (!this.active || !camera) return;

    this.spawnTimer -= dt * 1000;
    if (this.spawnTimer <= 0) {
      const base = this.config.spawnIntervalMs;
      this.spawnTimer = base * (0.55 + Math.random() * 0.7);
      this._spawnRocket(camera);
    }

    // Ракеты
    for (let i = this.rockets.length - 1; i >= 0; i--) {
      const r = this.rockets[i];
      r.vy += this.config.gravity * dt;
      r.x += r.vx * dt;
      r.y += r.vy * dt;
      r.lifeMs -= dt * 1000;
      if (r.vy >= -30 || r.lifeMs <= 0) {
        this._explode(r);
        this.rockets.splice(i, 1);
      }
    }

    // Частицы
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.vy += this.config.particleGravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.lifeMs -= dt * 1000;
      if (p.lifeMs <= 0) this.particles.splice(i, 1);
    }
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   */
  render(ctx) {
    if (!this.active) return;

    // Ракеты
    for (const r of this.rockets) {
      ctx.fillStyle = r.color;
      ctx.fillRect(Math.round(r.x) - 2, Math.round(r.y) - 8, 4, 8);
    }

    // Частицы
    for (const p of this.particles) {
      const alpha = Math.max(0, p.lifeMs / p.maxLifeMs);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      const s = p.size;
      ctx.fillRect(Math.round(p.x - s / 2), Math.round(p.y - s / 2), s, s);
    }
    ctx.globalAlpha = 1;
  }

  _spawnRocket(camera) {
    const x = camera.x + Math.random() * camera.viewportWidth;
    const y = camera.y + camera.viewportHeight + 10;
    const targetH = this.config.minHeight +
      Math.random() * (this.config.maxHeight - this.config.minHeight);
    // v0 = sqrt(2 * |g| * h)
    const vy = -Math.sqrt(2 * Math.abs(this.config.gravity) * targetH);
    this.rockets.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 40,
      vy,
      color: this._randomColor(),
      lifeMs: 4000
    });
  }

  _explode(rocket) {
    const count = this.config.particleCount;
    const baseAngle = Math.random() * Math.PI * 2;
    for (let i = 0; i < count; i++) {
      const angle = baseAngle + (i / count) * Math.PI * 2 + Math.random() * 0.25;
      const speed = this.config.particleSpeed * (0.45 + Math.random() * 0.75);
      const life = this.config.particleLifeMs * (0.7 + Math.random() * 0.6);
      this.particles.push({
        x: rocket.x,
        y: rocket.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        lifeMs: life,
        maxLifeMs: life,
        color: Math.random() < 0.5 ? rocket.color : this._randomColor(),
        size: this.config.particleSize
      });
    }
  }

  _randomColor() {
    const c = this.config.colors;
    return c[Math.floor(Math.random() * c.length)];
  }
}