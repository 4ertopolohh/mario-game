import { Character } from "./Character.js";
import { ENEMY_BASE_CONFIG } from "../config/enemies.config.js";

export class Enemy extends Character {
  /**
   * @param {object} typeConfig
   * @param {object} spawnConfig
   */
  constructor(typeConfig, spawnConfig) {
    const merged = {
      ...ENEMY_BASE_CONFIG,
      ...typeConfig,
      size: { ...ENEMY_BASE_CONFIG.size, ...(typeConfig.size || {}) },
      health: { ...ENEMY_BASE_CONFIG.health, ...(typeConfig.health || {}) },
      damage: { ...ENEMY_BASE_CONFIG.damage, ...(typeConfig.damage || {}) },
      movement: { ...ENEMY_BASE_CONFIG.movement, ...(typeConfig.movement || {}) },
      appearance: typeConfig.appearance || {},
      audio: typeConfig.audio || {},
      nickname: typeConfig.nickname || "",
      id: spawnConfig.id,
      type: typeConfig.type || "enemy"
    };
    super(merged);
    this.applyGravity = true;
    this.speed = merged.movement.speed;
    this.contactDamage = merged.damage.contact;
    this.x = spawnConfig.spawn.x;
    this.y = spawnConfig.spawn.y;
    this.prevX = this.x; this.prevY = this.y;

    const pts = (spawnConfig.patrol && spawnConfig.patrol.points) || [{ x: this.x, y: this.y }];
    this.patrol = {
      mode: (spawnConfig.patrol && spawnConfig.patrol.mode) || "pingPong",
      points: pts,
      targetIndex: pts.length > 1 ? 1 : 0,
      dir: 1
    };
  }

  _advancePatrol(flipDir = false) {
    const pts = this.patrol.points;
    if (pts.length < 2) return;
    if (this.patrol.mode === "pingPong") {
      if (flipDir) this.patrol.dir = -this.patrol.dir;
      let next = this.patrol.targetIndex + this.patrol.dir;
      if (next >= pts.length) {
        next = pts.length - 2;
        this.patrol.dir = -1;
      } else if (next < 0) {
        next = 1;
        this.patrol.dir = 1;
      }
      this.patrol.targetIndex = Math.max(0, Math.min(pts.length - 1, next));
    } else {
      this.patrol.targetIndex = (this.patrol.targetIndex + 1) % pts.length;
    }
  }

  update(dt, camera) {
    if (!this.alive) return;
    if (!camera.isVisible(this.rect)) {
      this.vx = 0;
      return;
    }
    if (this.hitWallX) {
      this.hitWallX = false;
      this._advancePatrol(true);
    }
    const pts = this.patrol.points;
    const target = pts[this.patrol.targetIndex];
    if (!target) { this.vx = 0; return; }
    const centerX = this.x + this.width / 2;
    const dx = target.x - centerX;
    if (Math.abs(dx) < 6) {
      this.vx = 0;
      this._advancePatrol(false);
    } else {
      this.vx = Math.sign(dx) * this.speed;
      this.facing = Math.sign(dx);
    }
  }
}