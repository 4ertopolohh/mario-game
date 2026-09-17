import { Character } from "./Character.js";
import { BOSS_CONFIG } from "../config/boss.config.js";
import { Projectile } from "./Projectile.js";
import { GameEvents } from "../core/EventBus.js";

export class Boss extends Character {
  constructor(spawn) {
    const cfg = {
      ...BOSS_CONFIG,
      id: "boss",
      type: "boss",
      x: spawn.x,
      y: spawn.y
    };
    super(cfg);
    this.applyGravity = false;
    this.x = spawn.x;
    this.y = spawn.y;
    this.prevX = this.x; this.prevY = this.y;
    this.contactDamage = BOSS_CONFIG.damage.contact;
    this.projectileConfig = BOSS_CONFIG.projectile;
    this.projectileTimer = this.projectileConfig.intervalMs;
    this.projectileAudioPath = BOSS_CONFIG.audio && BOSS_CONFIG.audio.extra
      ? BOSS_CONFIG.audio.extra.projectile : null;
    this.projectileTexture = (this.projectileConfig.appearance && this.projectileConfig.appearance.texture) || null;
  }

  update(dt, camera, player, entityManager, audioManager, eventBus) {
    if (!this.alive) return;

    // Визуальный разворот к игроку
    if (player && player.alive) {
      const playerCx = player.x + player.width / 2;
      const bossCx = this.x + this.width / 2;
      this.facing = playerCx < bossCx ? -1 : 1;
    }

    if (!camera.isVisible(this.rect)) return;
    if (!player || !player.alive) return;

    this.projectileTimer -= dt * 1000;
    if (this.projectileTimer <= 0) {
      this.projectileTimer = this.projectileConfig.intervalMs;
      this._fireProjectile(player, entityManager, audioManager, eventBus);
    }
  }

  _fireProjectile(player, entityManager, audioManager, eventBus) {
    const pcx = this.x + this.width / 2;
    const pcy = this.y + this.height / 2;
    const tcx = player.x + player.width / 2;
    const tcy = player.y + player.height / 2;
    const dx = tcx - pcx;
    const dy = tcy - pcy;
    const len = Math.hypot(dx, dy) || 1;
    const dirX = dx / len;
    const dirY = dy / len;
    const speed = this.projectileConfig.speed;
    const proj = new Projectile({
      x: pcx - 12,
      y: pcy - 12,
      width: 24, height: 24,
      vx: dirX * speed,
      vy: dirY * speed,
      damage: BOSS_CONFIG.damage.projectile,
      texture: this.projectileTexture,
      resourceManager: this.resourceManager
    });
    entityManager.add(proj);
    if (audioManager && this.projectileAudioPath) {
      audioManager.play(this.projectileAudioPath);
    }
    if (eventBus) eventBus.emit("BOSS_PROJECTILE", {});
  }

  takeDamage(amount, eventBus) {
    if (!this.alive) return;
    this.health = Math.max(0, this.health - amount);
    if (eventBus) eventBus.emit(GameEvents.BOSS_DAMAGED, { amount, health: this.health });
    if (this.health <= 0) {
      this.alive = false;
      if (eventBus) eventBus.emit(GameEvents.BOSS_DEFEATED, {});
    }
  }
}