import { FINALE_CONFIG } from "../config/finale.config.js";
import { FireworksSystem } from "../rendering/FireworksSystem.js";
import { createFriend } from "../entities/Friend.js";
import { FRIEND_TYPES_ORDERED } from "../config/friends.config.js";

/**
 * Финальная праздничная сцена после BOSS_DEFEATED.
 * Игнорирует collision и физику: управляет персонажами прямо.
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
    this.friendSlots = [];
    this.playerTargetX = 0;
    this.greetingEl = document.getElementById("finale-greeting");
  }

  start() {
    const game = this.game;
    const level = game.levelManager.currentLevel;
    const player = game.player;
    if (!level || !player) return;

    this.active = true;
    this.phase = "moving";
    this.playerTargetX = level.world.width / 2 - player.width / 2;

    if (this.greetingEl) {
      this.greetingEl.classList.add("hidden");
      this.greetingEl.textContent = FINALE_CONFIG.greeting;
    }

    this._ensureAllFriends();
    this.friendSlots = this._buildSlots();
  }

  stop() {
    this.active = false;
    this.phase = "idle";
    this.fireworks.stop();
    this.friendSlots = [];
  }

  update(dt) {
    if (!this.active) return;
    const game = this.game;
    const level = game.levelManager.currentLevel;
    const player = game.player;
    if (!level || !player) return;

    // === Player: движение к центру по X, y притянут к земле ===
    const pdx = this.playerTargetX - player.x;
    if (Math.abs(pdx) > 2) {
      const step = Math.sign(pdx) * FINALE_CONFIG.playerMoveSpeed * dt;
      player.x += Math.abs(step) > Math.abs(pdx) ? pdx : step;
      player.facing = Math.sign(pdx);
    } else {
      player.x = this.playerTargetX;
    }
    player.vx = 0;
    player.vy = 0;
    this._snapToGround(player, level);

    // === Friends: движение к целевым X ===
    let allArrived = true;
    for (const slot of this.friendSlots) {
      const f = slot.friend;
      if (!f || !f.alive) continue;
      const fdx = slot.targetX - f.x;
      if (Math.abs(fdx) > 2) {
        const step = Math.sign(fdx) * FINALE_CONFIG.friendMoveSpeed * dt;
        f.x += Math.abs(step) > Math.abs(fdx) ? fdx : step;
        f.facing = Math.sign(fdx);
        allArrived = false;
      } else {
        f.x = slot.targetX;
        // Разворот к Player после прибытия
        f.facing = player.x < f.x ? -1 : 1;
      }
      f.vx = 0;
      f.vy = 0;
      this._snapToGround(f, level);
    }

    if (this.phase === "moving" && allArrived) {
      this.phase = "celebrating";
      if (this.greetingEl) this.greetingEl.classList.remove("hidden");
      this.fireworks.start();
    }

    if (this.phase === "celebrating") {
      this.fireworks.update(dt, game.camera);
    }
  }

  renderFireworks(ctx) {
    if (this.active && this.phase === "celebrating") {
      this.fireworks.render(ctx);
    }
  }

  _snapToGround(entity, level) {
    const ground = level.platforms.find(p => p.id === "ground");
    if (!ground) return;
    entity.y = ground.y - entity.height;
  }

  _ensureAllFriends() {
    const game = this.game;
    const level = game.levelManager.currentLevel;
    const player = game.player;

    const existing = game.entityManager.entities.filter(e => e.alive && e.isFriend);
    const existingTypes = new Set(existing.map(f => f.friendType));

    for (const typeKey of FRIEND_TYPES_ORDERED) {
      if (existingTypes.has(typeKey)) continue;
      const side = Math.random() < 0.5 ? 1 : -1;
      const spawnX = side < 0 ? 60 : level.world.width - 160;
      const f = createFriend(typeKey, {
        id: `finale-${typeKey}`,
        spawn: { x: spawnX, y: player.y }
      });
      if (!f) continue;
      f.setResourceManager(game.resourceManager);
      // Friend сразу «оживёт» в следующем кадре: spawn sound проиграет в update.
      game.entityManager.add(f);
    }
  }

  _buildSlots() {
    const game = this.game;
    const player = game.player;
    const friends = game.entityManager.entities
      .filter(e => e.alive && e.isFriend)
      .sort((a, b) => a.friendType.localeCompare(b.friendType));

    const spacing = FINALE_CONFIG.friendSpacing;
    const centerX = this.playerTargetX + player.width / 2;
    const slots = [];
    for (let i = 0; i < friends.length; i++) {
      // 0 -> right +1; 1 -> left -1; 2 -> right +2; ...
      const side = i % 2 === 0 ? 1 : -1;
      const ring = Math.floor(i / 2) + 1;
      const targetCenterX = centerX + side * spacing * ring;
      slots.push({
        friend: friends[i],
        targetX: targetCenterX - friends[i].width / 2
      });
    }
    return slots;
  }
}