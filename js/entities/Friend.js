import { Character } from "./Character.js";
import { FRIEND_BASE_CONFIG, FRIEND_CONFIG_BY_TYPE } from "../config/friends.config.js";

/**
 * Союзник Player-а.
 *  - Агрессивен только к обычным enemy-1/2/3.
 *  - Не атакует Player, не атакует Boss.
 *  - Урон Enemy-у наносится исключительно stomp-ом сверху.
 *    Само физическое определение stomp происходит в CollisionManager,
 *    Friend лишь формирует намерение движения и прыжка.
 *  - В финале скриптованно двигается FinaleController-ом без физики.
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
    this.jumpVelocity = merged.movement.jumpVelocity;
    this.stompBounceVelocity = merged.movement.stompBounceVelocity;

    this.x = spawnConfig.spawn.x;
    this.y = spawnConfig.spawn.y;
    this.prevX = this.x;
    this.prevY = this.y;

    this._spawnSoundPlayed = false;
    this._spawnSoundPath = (merged.audio && merged.audio.spawn) || null;

    this._holdPosition = false;
    this._holdX = 0;
  }

  /** Фиксация X в скриптованных сценах (используется при необходимости). */
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

    // Скриптованное удержание позиции (финал использует FinaleController напрямую,
    // но контракт остаётся).
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
      // Вне симуляционной зоны — не тратим вычисления.
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
    const dist = Math.abs(dx);

    // Разворот к цели
    if (dist > 4) this.facing = Math.sign(dx);

    // Упёрлись в стену — прыгаем, чтобы попытаться преодолеть препятствие.
    if (this.hitWallX) {
      this.hitWallX = false;
      if (this.isGrounded) {
        this.vy = this.jumpVelocity;
        this.isGrounded = false;
      }
    }

    // Прыжок-намерение: если враг близко по горизонтали и Friend на земле.
    // Сам stomp определит CollisionManager через prevBottom + vy > 0.
    if (this.isGrounded && dist > 6 && dist < 140) {
      this.vy = this.jumpVelocity;
      this.isGrounded = false;
    }

    // Горизонтальное преследование
    if (dist > 8) {
      const mul = dist < 40 ? 0.5 : 1;
      this.vx = Math.sign(dx) * this.speed * mul;
    } else {
      this.vx = 0;
    }
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