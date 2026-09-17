import { Entity } from "./Entity.js";

export class Projectile extends Entity {
  constructor(config) {
    super({ id: `proj-${Entity._nextId++}`, type: "projectile" });
    this.x = config.x;
    this.y = config.y;
    this.width = config.width || 20;
    this.height = config.height || 20;
    this.vx = config.vx || 0;
    this.vy = config.vy || 0;
    this.damage = config.damage || 1;
    this.applyGravity = false;
    this.lifeMs = 6000;
    this.texture = config.texture || null;
    this.resourceManager = config.resourceManager || null;
  }

  setResourceManager(rm) { this.resourceManager = rm; }

  update(dt, camera) {
    this.lifeMs -= dt * 1000;
    if (this.lifeMs <= 0) { this.alive = false; return; }
    const margin = camera.viewportWidth;
    if (this.x < camera.x - margin || this.x > camera.x + camera.viewportWidth + margin ||
        this.y < camera.y - margin || this.y > camera.y + camera.viewportHeight + margin) {
      this.alive = false;
    }
  }

  render(ctx) {
    const img = this.texture && this.resourceManager
      ? this.resourceManager.getImage(this.texture)
      : null;
    if (img) {
      ctx.drawImage(img, this.x, this.y, this.width, this.height);
      return;
    }
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    ctx.fillStyle = "#ffcc00";
    ctx.beginPath();
    ctx.arc(cx, cy, this.width / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#ff6600";
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}