import { Character } from "./Character.js";
import { PLAYER_CONFIG } from "../config/player.config.js";
import { GAME_CONFIG } from "../config/game.config.js";
import { Actions } from "../managers/InputManager.js";
import { GameEvents } from "../core/EventBus.js";

export class Player extends Character {
  constructor(config = PLAYER_CONFIG) {
    super(config);
    this.type = "player";
    this.movement = config.movement || PLAYER_CONFIG.movement;
    this.invulnerabilityMs = 0;
    this.damageBlinkMs = 0;
    this.damageBlinkSwitches = 0;
    this.damageBlinkOn = true;
    this.dropThroughMs = 0;
    this.isGrounded = false;
    this.spawnX = 0;
    this.spawnY = 0;
    this.deathFired = false;
    this.applyGravity = true;
    // facing приходит из Character (default 1)
  }

  setSpawn(x, y) {
    this.spawnX = x; this.spawnY = y;
    this.x = x; this.y = y;
    this.vx = 0; this.vy = 0;
    this.isGrounded = false;
  }

  resetToSpawn() {
    this.setSpawn(this.spawnX, this.spawnY);
    this.health = PLAYER_CONFIG.health.max;
    this.invulnerabilityMs = 0;
    this.damageBlinkMs = 0;
    this.damageBlinkOn = true;
    this.dropThroughMs = 0;
    this.deathFired = false;
    this.alive = true;
  }

  update(dt, input, eventBus) {
    if (!this.alive) return;

    if (this.invulnerabilityMs > 0) {
      this.invulnerabilityMs -= dt * 1000;
      if (this.invulnerabilityMs < 0) this.invulnerabilityMs = 0;
    }

    if (this.damageBlinkMs > 0) {
      const total = PLAYER_CONFIG.damageAnimation.durationMs;
      const switches = PLAYER_CONFIG.damageAnimation.visibilitySwitches;
      const interval = total / switches;
      const beforeMs = this.damageBlinkMs;
      this.damageBlinkMs -= dt * 1000;
      if (this.damageBlinkMs < 0) this.damageBlinkMs = 0;
      const beforeBucket = Math.floor((total - beforeMs) / interval);
      const afterBucket = Math.floor((total - this.damageBlinkMs) / interval);
      if (afterBucket !== beforeBucket) this.damageBlinkOn = !this.damageBlinkOn;
      if (this.damageBlinkMs <= 0) this.damageBlinkOn = true;
    }

    const axis = input.getAxis();
    this.vx = axis * this.movement.speed;
    if (axis !== 0) this.facing = axis > 0 ? 1 : -1;

    if (this.dropThroughMs > 0) {
      this.dropThroughMs -= dt * 1000;
      if (this.dropThroughMs < 0) this.dropThroughMs = 0;
    } else if (this.isGrounded && input.isHeld(Actions.DOWN)) {
      this.dropThroughMs = GAME_CONFIG.dropThroughDurationMs;
      this.isGrounded = false;
    }

    if (this.isGrounded && input.wasPressed(Actions.JUMP)) {
      this.vy = this.movement.jumpVelocity;
      this.isGrounded = false;
    }
  }

  applyDamage(amount, eventBus) {
    if (!this.alive) return false;
    if (this.invulnerabilityMs > 0) return false;
    if (amount <= 0) return false;
    this.health = Math.max(0, Math.min(PLAYER_CONFIG.health.max, this.health - amount));
    this.invulnerabilityMs = PLAYER_CONFIG.health.invulnerabilityMs;
    this.damageBlinkMs = PLAYER_CONFIG.damageAnimation.durationMs;
    this.damageBlinkSwitches = PLAYER_CONFIG.damageAnimation.visibilitySwitches;
    this.damageBlinkOn = false;
    if (eventBus) {
      eventBus.emit(GameEvents.PLAYER_DAMAGED, { amount, health: this.health });
      eventBus.emit(GameEvents.PLAYER_HEALTH_CHANGED, { health: this.health });
    }
    if (this.health <= 0) {
      if (!this.deathFired) {
        this.deathFired = true;
        if (eventBus) eventBus.emit(GameEvents.PLAYER_DIED, {});
      }
    }
    return true;
  }

  render(ctx) {
    if (!this.alive) return;
    if (this.damageBlinkMs > 0 && !this.damageBlinkOn) return;
    super.render(ctx);
  }
}