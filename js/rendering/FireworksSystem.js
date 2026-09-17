import { FINALE_CONFIG } from "../config/finale.config.js";

/**
 * Пиксельные салюты: ракеты + частицы.
 *  - Каждая ракета летит снизу вверх к индивидуальному targetY.
 *  - Взрыв при достижении targetY (или остановке, или истечении lifeMs).
 *  - Частицы: радиальный разлёт, gravity, drag, затухание alpha, уменьшение размера.
 *  - Яркий glow через globalCompositeOperation = "lighter" с save/restore.
 *  - Высоты и интервалы — responsive относительно текущего viewport.
 *  - Массивы ракет/частиц очищаются от погибших — рост ограничен.
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
      this.spawnTimer = base * (0.55 + Math.random() * 0.9);
      this._spawnRocket(camera);
    }

    // Ракеты
    const rg = this.config.rocketGravity;
    for (let i = this.rockets.length - 1; i >= 0; i--) {
      const r = this.rockets[i];
      r.vy += rg * dt;
      r.x += r.vx * dt;
      r.y += r.vy * dt;
      r.lifeMs -= dt * 1000;
      if (r.y <= r.targetY || r.vy >= 0 || r.lifeMs <= 0) {
        this._explode(r);
        this.rockets.splice(i, 1);
      }
    }

    // Частицы
    const pg = this.config.particleGravity;
    const drag = this.config.particleDrag;
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.vy += pg * dt;
      p.vx *= drag;
      p.vy *= drag;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.lifeMs -= dt * 1000;
      if (p.lifeMs <= 0) this.particles.splice(i, 1);
    }
  }

  render(ctx) {
    if (!this.active) return;

    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    // Ракеты
    for (const r of this.rockets) {
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = r.color;
      ctx.fillRect(Math.round(r.x) - 4, Math.round(r.y) - 10, 8, 16);

      ctx.globalAlpha = 1;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(Math.round(r.x) - 2, Math.round(r.y) - 6, 4, 10);
    }

    // Частицы
    for (const p of this.particles) {
      const t = Math.max(0, p.lifeMs / p.maxLifeMs);
      const alpha = Math.pow(t, 1.35);
      const s = Math.max(1, Math.round(p.size * (0.35 + 0.65 * t)));
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.round(p.x - s / 2), Math.round(p.y - s / 2), s, s);
    }

    ctx.globalAlpha = 1;
    ctx.restore();
  }

  _spawnRocket(camera) {
    const cfg = this.config;
    const vw = camera.viewportWidth;
    const vh = camera.viewportHeight;

    const x = camera.x + 40 + Math.random() * Math.max(1, vw - 80);
    const spawnY = camera.y + vh + 12;

    const frac = cfg.minHeightFraction +
      Math.random() * (cfg.maxHeightFraction - cfg.minHeightFraction);
    const targetY = camera.y + vh * frac;

    const distance = Math.max(40, spawnY - targetY);
    const v0 = Math.sqrt(2 * cfg.rocketGravity * distance);

    this.rockets.push({
      x,
      y: spawnY,
      vx: (Math.random() - 0.5) * 60,
      vy: -v0,
      targetY,
      color: this._randomColor(),
      lifeMs: 5000
    });
  }

  _explode(rocket) {
    const cfg = this.config;

    // Центральный flash
    this.particles.push({
      x: rocket.x,
      y: rocket.y,
      vx: 0,
      vy: 0,
      lifeMs: cfg.flashLifeMs,
      maxLifeMs: cfg.flashLifeMs,
      color: "#ffffff",
      size: cfg.flashSize
    });

    // Радиальный разлёт
    const count = cfg.particleCount;
    const baseAngle = Math.random() * Math.PI * 2;

    for (let i = 0; i < count; i++) {
      const angle = baseAngle + (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.35;
      const speed = cfg.particleSpeed * (0.35 + Math.random() * 0.95);
      const life = cfg.particleLifeMs * (0.6 + Math.random() * 0.8);
      const color = Math.random() < 0.5 ? rocket.color : this._randomColor();
      this.particles.push({
        x: rocket.x,
        y: rocket.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        lifeMs: life,
        maxLifeMs: life,
        color,
        size: cfg.particleSize * (0.55 + Math.random() * 1.0)
      });
    }
  }

  _randomColor() {
    const c = this.config.colors;
    return c[Math.floor(Math.random() * c.length)];
  }
}