export const TrapState = Object.freeze({
  READY: "READY",
  ACTIVE: "ACTIVE",
  COOLDOWN: "COOLDOWN"
});

export class Trap {
  constructor(config) {
    this.id = config.id;
    this.trigger = { ...config.trigger };
    this.damageZone = { ...config.damageZone };
    this.damage = config.damage;
    this.activeDurationMs = config.activeDurationMs ?? 350;
    this.rearmMs = config.rearmMs ?? 1500;
    this.appearance = config.appearance || {};
    this.state = TrapState.READY;
    this.timerMs = 0;
    this.hitThisActivation = false;
    this.resourceManager = null;
    this.disabled = false;
  }

  setResourceManager(rm) { this.resourceManager = rm; }

  /**
   * Полное выключение ловушки (например, после BOSS_DEFEATED).
   * Идемпотентно.
   */
  disable() {
    this.disabled = true;
    this.state = TrapState.COOLDOWN;
    this.timerMs = Number.POSITIVE_INFINITY;
    this.hitThisActivation = true;
  }

  update(dt, player) {
    if (this.disabled) return;

    if (this.state === TrapState.READY) {
      if (player && player.alive && this._playerInTrigger(player)) {
        this.state = TrapState.ACTIVE;
        this.timerMs = this.activeDurationMs;
        this.hitThisActivation = false;
      }
    } else if (this.state === TrapState.ACTIVE) {
      this.timerMs -= dt * 1000;
      if (this.timerMs <= 0) {
        this.state = TrapState.COOLDOWN;
        this.timerMs = this.rearmMs;
      }
    } else if (this.state === TrapState.COOLDOWN) {
      this.timerMs -= dt * 1000;
      if (this.timerMs <= 0) {
        this.state = TrapState.READY;
        this.timerMs = 0;
      }
    }
  }

  _playerInTrigger(player) {
    const t = this.trigger;
    return player.x < t.x + t.width &&
           player.x + player.width > t.x &&
           player.y < t.y + t.height &&
           player.y + player.height > t.y;
  }

  /** @returns {number} damage if boss intersects active damage zone, else 0 */
  tryDamageBoss(boss) {
    if (this.disabled) return 0;
    if (this.state !== TrapState.ACTIVE) return 0;
    if (this.hitThisActivation) return 0;
    const d = this.damageZone;
    const overlap = boss.x < d.x + d.width &&
                    boss.x + boss.width > d.x &&
                    boss.y < d.y + d.height &&
                    boss.y + boss.height > d.y;
    if (!overlap) return 0;
    this.hitThisActivation = true;
    return this.damage;
  }

  render(ctx, debug = false) {
    const t = this.trigger;
    const d = this.damageZone;

    if (debug) {
      ctx.strokeStyle = "#00ffff";
      ctx.lineWidth = 1;
      ctx.strokeRect(t.x, t.y, t.width, t.height);
      ctx.strokeStyle = this.state === TrapState.ACTIVE ? "#ff0000" : "#ff8800";
      ctx.strokeRect(d.x, d.y, d.width, d.height);
    }

    const path = this.appearance && this.appearance.texture;
    const img = path && this.resourceManager ? this.resourceManager.getImage(path) : null;

    if (img) {
      ctx.save();
      if (this.disabled) ctx.globalAlpha = 0.2;
      else if (this.state === TrapState.COOLDOWN) ctx.globalAlpha = 0.45;
      else if (this.state === TrapState.READY) ctx.globalAlpha = 0.85;
      ctx.drawImage(img, t.x, t.y, t.width, t.height);
      ctx.restore();

      if (!this.disabled && this.state === TrapState.ACTIVE) {
        ctx.fillStyle = "rgba(255, 60, 60, 0.22)";
        ctx.fillRect(d.x, d.y, d.width, d.height);
      }
      return;
    }

    if (!debug) {
      ctx.fillStyle = this.disabled
        ? "#444"
        : (this.state === TrapState.ACTIVE
          ? "#ff3030"
          : (this.state === TrapState.COOLDOWN ? "#666" : "#aa3030"));
      ctx.fillRect(t.x + t.width / 2 - 6, t.y + t.height - 12, 12, 12);
      if (!this.disabled && this.state === TrapState.ACTIVE) {
        ctx.fillStyle = "rgba(255, 60, 60, 0.25)";
        ctx.fillRect(d.x, d.y, d.width, d.height);
      }
    }
  }
}