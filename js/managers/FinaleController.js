import { FINALE_CONFIG } from "../config/finale.config.js";
import { FireworksSystem } from "../rendering/FireworksSystem.js";
import { createFriend } from "../entities/Friend.js";
import { FRIEND_TYPES_ORDERED, FRIEND_BASE_CONFIG } from "../config/friends.config.js";

/**
 * Финальная праздничная сцена после BOSS_DEFEATED.
 * Скриптованно управляет Player и Friends, игнорируя игровую физику и коллизии.
 *
 *  - Позиция Player вычисляется относительно центра текущего VIEWPORT
 *    (camera.x + camera.viewportWidth / 2), а не центра игрового мира.
 *  - Friends раскладываются симметрично относительно того же центра.
 *  - После прибытия все персонажи бесконечно и независимо прыгают на месте.
 *  - Раскладка пересчитывается каждый кадр, поэтому resize во время финала
 *    корректно адаптирует конечные позиции.
 */
export class FinaleController {
  /**
   * @param {import("../core/Game.js").Game} game
   */
  constructor(game) {
    this.game = game;
    this.active = false;
    this.phase = "idle"; // idle | moving | celebrating
    this.fireworks = new FireworksSystem(FINALE_CONFIG.fireworks);
    this.greetingEl = document.getElementById("finale-greeting");
  }

  start() {
    const game = this.game;
    const level = game.levelManager.currentLevel;
    const player = game.player;
    if (!level || !player) return;

    this.active = true;
    this.phase = "moving";

    if (this.greetingEl) {
      this.greetingEl.classList.add("hidden");
      this.greetingEl.textContent = FINALE_CONFIG.greeting;
    }

    this._ensureAllFriends();
  }

  stop() {
    this.active = false;
    this.phase = "idle";
    this.fireworks.stop();
  }

  update(dt) {
    if (!this.active) return;
    const game = this.game;
    const level = game.levelManager.currentLevel;
    const player = game.player;
    if (!level || !player) return;

    const viewportCenterX = this._viewportCenterX();
    const playerTargetX = viewportCenterX - player.width / 2;

    if (this.phase === "moving") {
      this._moveToward(player, playerTargetX, FINALE_CONFIG.playerMoveSpeed, dt);
      player.vx = 0;
      player.vy = 0;
      player.y = this._groundYFor(player, level);

      const friends = this._sortedFriends();
      const slots = this._buildSlotLayouts(friends, viewportCenterX);

      let allArrived = true;
      for (const slot of slots) {
        const f = slot.friend;
        if (!f.alive) continue;
        const arrived = this._moveToward(f, slot.targetX, FINALE_CONFIG.friendMoveSpeed, dt);
        if (!arrived) allArrived = false;
        f.vx = 0;
        f.vy = 0;
        f.y = this._groundYFor(f, level);
      }

      if (allArrived) {
        this.phase = "celebrating";
        if (this.greetingEl) this.greetingEl.classList.remove("hidden");
        this.fireworks.start();
      }
      return;
    }

    // celebrating
    player.x = playerTargetX;
    player.vx = 0;
    this._updateCelebrationJump(player, dt, level);

    const friends = this._sortedFriends();
    const slots = this._buildSlotLayouts(friends, viewportCenterX);
    for (const slot of slots) {
      const f = slot.friend;
      if (!f.alive) continue;
      f.x = slot.targetX;
      f.vx = 0;
      this._updateCelebrationJump(f, dt, level);
    }

    this.fireworks.update(dt, game.camera);
  }

  renderFireworks(ctx) {
    if (this.active && this.phase === "celebrating") {
      this.fireworks.render(ctx);
    }
  }

  // ---------------------------------------------------------------------------
  // Internals
  // ---------------------------------------------------------------------------

  _viewportCenterX() {
    const cam = this.game.camera;
    return cam.x + cam.viewportWidth / 2;
  }

  _groundYFor(entity, level) {
    const ground = level.platforms.find(p => p.id === "ground");
    if (!ground) return entity.y;
    return ground.y - entity.height;
  }

  /** @returns {boolean} true если сущность уже в пределах 2px от targetX */
  _moveToward(entity, targetX, speed, dt) {
    const dx = targetX - entity.x;
    if (Math.abs(dx) <= 2) {
      entity.x = targetX;
      return true;
    }
    const step = Math.sign(dx) * speed * dt;
    entity.x += Math.abs(step) > Math.abs(dx) ? dx : step;
    const s = Math.sign(dx);
    if (s !== 0) entity.facing = s;
    return false;
  }

  /**
   * Независимый праздничный прыжок. Хранится прямо на entity в `_celebration`.
   * При приземлении сразу задаётся новая случайная скорость — пауз нет.
   */
  _updateCelebrationJump(entity, dt, level) {
    const cfg = FINALE_CONFIG.jump;
    const groundY = this._groundYFor(entity, level);

    let c = entity._celebration;
    if (!c) {
      c = {
        offset: Math.random() * 20,
        vy: cfg.basePower * (1 - cfg.variation + Math.random() * cfg.variation * 2),
        groundY
      };
      entity._celebration = c;
    }
    c.groundY = groundY;

    c.vy -= cfg.gravity * dt;
    c.offset += c.vy * dt;

    if (c.offset <= 0) {
      c.offset = 0;
      const v = cfg.variation;
      c.vy = cfg.basePower * (1 - v + Math.random() * v * 2);
    }

    entity.y = c.groundY - c.offset;
    entity.vy = 0;
  }

  _sortedFriends() {
    const order = new Map();
    for (let i = 0; i < FRIEND_TYPES_ORDERED.length; i++) {
      order.set(FRIEND_TYPES_ORDERED[i], i);
    }
    return this.game.entityManager.entities
      .filter(e => e.alive && e.isFriend)
      .sort((a, b) => {
        const ia = order.has(a.friendType) ? order.get(a.friendType) : Number.MAX_SAFE_INTEGER;
        const ib = order.has(b.friendType) ? order.get(b.friendType) : Number.MAX_SAFE_INTEGER;
        return ia - ib;
      });
  }

  /**
   * Создание отсутствующих типов. Уже существующий (например, random helper
   * на Level 5) НЕ дублируется. Итог — ровно по одному Friend каждого типа.
   */
  _ensureAllFriends() {
    const game = this.game;
    const level = game.levelManager.currentLevel;
    const player = game.player;
    const camera = game.camera;

    const existing = game.entityManager.entities.filter(e => e.alive && e.isFriend);
    const existingTypes = new Set(existing.map(f => f.friendType));

    const total = FRIEND_TYPES_ORDERED.length;
    const half = Math.floor(total / 2);
    const fw = FRIEND_BASE_CONFIG.size.width;

    const leftSpawnX = Math.max(0, Math.min(level.world.width - fw, camera.x + 40));
    const rightSpawnX = Math.max(0, Math.min(level.world.width - fw, camera.x + camera.viewportWidth - fw - 40));

    for (let idx = 0; idx < total; idx++) {
      const typeKey = FRIEND_TYPES_ORDERED[idx];
      if (existingTypes.has(typeKey)) continue;

      const spawnLeft = idx < half;
      const spawnX = spawnLeft ? leftSpawnX : rightSpawnX;

      const f = createFriend(typeKey, {
        id: `finale-${typeKey}`,
        spawn: { x: spawnX, y: player.y }
      });
      if (!f) continue;
      f.setResourceManager(game.resourceManager);
      game.entityManager.add(f);
    }
  }

  /**
   * Симметричная раскладка относительно центра viewport.
   * Первая половина Friends идёт влево (кольца 1..half),
   * вторая — вправо (кольца 1..total-half).
   * Spacing динамически уменьшается на узких экранах.
   */
  _buildSlotLayouts(friends, viewportCenterX) {
    const total = friends.length;
    if (total === 0) return [];

    const half = Math.floor(total / 2);
    const outerRing = Math.max(1, Math.max(half, total - half));

    const cam = this.game.camera;
    const friendHalfW = (friends[0].width || FRIEND_BASE_CONFIG.size.width) / 2;
    const margin = 16;
    const maxCenterDistance = Math.max(20, cam.viewportWidth / 2 - margin - friendHalfW);

    const configuredSpacing = FINALE_CONFIG.friendSpacing;
    const minSpacing = FINALE_CONFIG.minFriendSpacing;
    const effectiveSpacing = Math.max(
      minSpacing,
      Math.min(configuredSpacing, maxCenterDistance / outerRing)
    );

    const slots = [];
    for (let i = 0; i < total; i++) {
      let side, ring;
      if (i < half) {
        side = -1;
        ring = i + 1;
      } else {
        side = 1;
        ring = i - half + 1;
      }
      const targetCenterX = viewportCenterX + side * effectiveSpacing * ring;
      const targetX = targetCenterX - friends[i].width / 2;
      slots.push({ friend: friends[i], targetX });
    }
    return slots;
  }
}