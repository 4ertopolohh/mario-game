import { Character } from "./Character.js";
import { FRIEND_BASE_CONFIG, FRIEND_CONFIG_BY_TYPE } from "../config/friends.config.js";

/**
 * Мирный к Player, агрессивный к обычным enemy-1/2/3.
 * Не атакует Boss, не получает stomp damage и не наносит его.
 */
export class Friend extends Character {
  /**
   * @param {object} typeConfig - один из FRIEND_TYPE_*_CONFIG
   * @param {{ id?: string, spawn: { x:number, y:number } }} spawnConfig
   */
  constructor(typeConfig, spawnConfig) {
    const merged = {
      ...FRIEND_BASE_CONFIG,
      ...typeConfig,
      size: { ...FRIEND_BASE_CONFIG.size, ...(typeConfig.size || {}) },
      health: { ...FRIEND_BASE_CONFIG.health, ...(typeConfig.health || {}) },
      movement: { ...FRIEND_BASE_CONFIG.movement, ...(typeConfig.movement || {}) },
      combat: { ...FRIEND_BASE_CONFIG.combat, ...(typeConfig.combat || {}) },
      appearance: typeConfig.appearance || {},
      audio: typeConfig.audio || {},
      nickname: typeConfig.nickname || "",
      id: spawnConfig.id,
      type: typeConfig.type || "friend"
    };
    super(merged);

    this.isFriend = true;
    this.friendType = typeConfig.type;

    this.applyGravity = true;
    this.speed = merged.movement.speed;
    this.damage = merged.combat.damage;
    this.attackCooldownMs = merged.combat.attackCooldownMs;
    this.attackCooldownRemaining = 0;

    this.x = spawnConfig.spawn.x;
    this.y = spawnConfig.spawn.y;
    this.prevX = this.x;
    this.prevY = this.y;

    this._spawnSoundPlayed = false;
    this._spawnSoundPath = (merged.audio && merged.audio.spawn) || null;

    this._holdPosition = false;
    this._holdX = 0;
  }

  /**
   * Зафиксировать Friend на конкретной X (используется финалом).
   * @param {number} x
   */
  holdAt(x) {
    this._holdPosition = true;
    this._holdX = x;
  }

  releaseHold() {
    this._holdPosition = false;
  }

  /**
   * @param {number} dt
   * @param {{
   *   camera: import("../rendering/Camera.js").Camera,
   *   entities: any[],
   *   audioManager: import("../managers/AudioManager.js").AudioManager,
   *   eventBus: import("../core/EventBus.js").EventBus
   * }} ctx
   */
  update(dt, ctx) {
    if (!this.alive) return;

    // Одноразовый spawn sound
    if (!this._spawnSoundPlayed) {
      this._spawnSoundPlayed = true;
      if (ctx && ctx.audioManager && this._spawnSoundPath) {
        ctx.audioManager.play(this._spawnSoundPath);
      }
    }

    if (this.attackCooldownRemaining > 0) {
      this.attackCooldownRemaining -= dt * 1000;
      if (this.attackCooldownRemaining < 0) this.attackCooldownRemaining = 0;
    }

    // Финал: удержание позиции
    if (this._holdPosition) {
      const dx = this._holdX - this.x;
      if (Math.abs(dx) <= 1) {
        this.x = this._holdX;
        this.vx = 0;
      } else {
        this.vx = Math.sign(dx) * this.speed;
        this.facing = Math.sign(dx);
      }
      return;
    }

    const camera = ctx && ctx.camera;
    if (camera && !camera.isVisible(this.rect)) {
      this.vx = 0;
      return;
    }

    const enemy = this._findNearestEnemy(ctx && ctx.entities);
    if (!enemy) {
      this.vx = 0;
      return;
    }

    const myCx = this.x + this.width / 2;
    const enCx = enemy.x + enemy.width / 2;
    const dx = enCx - myCx;

    if (Math.abs(dx) < 6) {
      this.vx = 0;
    } else {
      this.vx = Math.sign(dx) * this.speed;
      this.facing = Math.sign(dx);
    }

    if (this.attackCooldownRemaining <= 0 && this._overlaps(this.rect, enemy.rect)) {
      this.attackCooldownRemaining = this.attackCooldownMs;
      if (typeof enemy.takeDamage === "function") {
        enemy.takeDamage(this.damage);
      }
      if (ctx && ctx.eventBus && !enemy.alive) {
        ctx.eventBus.emit("ENEMY_DEFEATED", { enemy });
      }
    }
  }

  _overlaps(a, b) {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
  }

  _findNearestEnemy(entities) {
    if (!entities || entities.length === 0) return null;
    let best = null;
    let bestDist = Infinity;
    const myCx = this.x + this.width / 2;
    const myCy = this.y + this.height / 2;
    for (const e of entities) {
      if (!e || !e.alive) continue;
      if (e === this) continue;
      if (e.type !== "enemy-1" && e.type !== "enemy-2" && e.type !== "enemy-3") continue;
      const dx = (e.x + e.width / 2) - myCx;
      const dy = (e.y + e.height / 2) - myCy;
      const d = dx * dx + dy * dy;
      if (d < bestDist) { bestDist = d; best = e; }
    }
    return best;
  }
}

/**
 * Фабрика Friend по типу.
 * @param {string} typeKey  например "friend-1"
 * @param {{ id?: string, spawn: {x:number,y:number} }} spawnConfig
 * @returns {Friend|null}
 */
export function createFriend(typeKey, spawnConfig) {
  const cfg = FRIEND_CONFIG_BY_TYPE[typeKey];
  if (!cfg) return null;
  return new Friend(cfg, spawnConfig);
}