import { intersects } from "../utils/aabb.js";
import { GAME_CONFIG } from "../config/game.config.js";
import { TrapState } from "../entities/Trap.js";
import { GameEvents } from "../core/EventBus.js";

export class CollisionManager {
  constructor(eventBus) {
    this.eventBus = eventBus;
  }

  moveEntity(entity, dt, level) {
    if (entity.applyGravity) {
      entity.vy += GAME_CONFIG.physics.gravity * dt;
      if (entity.vy > GAME_CONFIG.physics.maxFallSpeed) {
        entity.vy = GAME_CONFIG.physics.maxFallSpeed;
      }
    }
    entity.x += entity.vx * dt;
    this._resolveX(entity, level);
    const prevBottom = entity.y + entity.height;
    entity.y += entity.vy * dt;
    this._resolveY(entity, level, prevBottom);
    if (entity.x < 0) { entity.x = 0; entity.vx = 0; entity.hitWallX = true; }
    const rightLimit = level.world.width - entity.width;
    if (entity.x > rightLimit) { entity.x = rightLimit; entity.vx = 0; entity.hitWallX = true; }
  }

  _resolveX(entity, level) {
    const rect = entity.rect;
    for (const p of level.platforms) {
      if (p.type !== "solid") continue;
      if (!intersects(rect, p)) continue;
      const overlapLeft = (entity.x + entity.width) - p.x;
      const overlapRight = (p.x + p.width) - entity.x;
      if (overlapLeft < overlapRight) entity.x = p.x - entity.width;
      else entity.x = p.x + p.width;
      entity.vx = 0;
      entity.hitWallX = true;
      rect.x = entity.x;
    }
    if (level.obstacles) {
      for (const o of level.obstacles) {
        if (!intersects(rect, o)) continue;
        const overlapLeft = (entity.x + entity.width) - o.x;
        const overlapRight = (o.x + o.width) - entity.x;
        if (overlapLeft < overlapRight) entity.x = o.x - entity.width;
        else entity.x = o.x + o.width;
        entity.vx = 0;
        entity.hitWallX = true;
        rect.x = entity.x;
      }
    }
  }

  _resolveY(entity, level, prevBottom) {
    entity.isGrounded = false;
    const rect = entity.rect;

    for (const p of level.platforms) {
      if (p.type !== "solid") continue;
      if (!intersects(rect, p)) continue;
      const eBottom = entity.y + entity.height;
      const eTop = entity.y;
      const pBottom = p.y + p.height;
      const pTop = p.y;
      const overlapTop = eBottom - pTop;
      const overlapBottom = pBottom - eTop;
      if (overlapTop < overlapBottom) {
        entity.y = pTop - entity.height;
        if (entity.vy > 0) entity.vy = 0;
        entity.isGrounded = true;
      } else {
        entity.y = pBottom;
        if (entity.vy < 0) entity.vy = 0;
      }
      rect.y = entity.y;
    }

    if (level.obstacles) {
      for (const o of level.obstacles) {
        if (!intersects(rect, o)) continue;
        const eBottom = entity.y + entity.height;
        const eTop = entity.y;
        const oBottom = o.y + o.height;
        const oTop = o.y;
        const overlapTop = eBottom - oTop;
        const overlapBottom = oBottom - eTop;
        if (overlapTop < overlapBottom) {
          entity.y = oTop - entity.height;
          if (entity.vy > 0) entity.vy = 0;
          entity.isGrounded = true;
        } else {
          entity.y = oBottom;
          if (entity.vy < 0) entity.vy = 0;
        }
        rect.y = entity.y;
      }
    }

    const isDropping = entity.type === "player" && entity.dropThroughMs > 0;
    if (isDropping) return;
    for (const p of level.platforms) {
      if (p.type !== "oneWay") continue;
      if (!intersects(rect, p)) continue;
      if (entity.vy <= 0) continue;
      if (prevBottom > p.y + 2) continue;
      entity.y = p.y - entity.height;
      entity.vy = 0;
      entity.isGrounded = true;
      rect.y = entity.y;
    }
  }

  /**
   * Единый критерий stomp-а: атакующий падает вниз, и его предыдущий нижний
   * край был около/над верхней гранью цели. Используется Player-ом и Friend-ом.
   */
  _isStomp(attacker, target) {
    const prevBottom = (attacker.prevY ?? attacker.y) + attacker.height;
    return attacker.vy > 0 &&
           prevBottom <= target.y + GAME_CONFIG.stompTolerance;
  }

  /**
   * @returns {{damageCandidates:number[], bossDamage:number, levelComplete:boolean}}
   */
  resolveEntityInteractions(ctx) {
    const { player, enemies, friends, boss, projectiles, level, audioManager, eventBus } = ctx;
    const result = { damageCandidates: [], bossDamage: 0, levelComplete: false };
    if (!player || !player.alive) return result;

    // Player vs hazards
    if (level.hazards) {
      for (const h of level.hazards) {
        if (intersects(player.rect, h)) {
          const dmg = typeof h.damage === "number" ? h.damage : GAME_CONFIG.damage.hazard;
          result.damageCandidates.push(dmg);
        }
      }
    }

    // Player vs enemies (stomp / contact damage)
    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      if (!intersects(player.rect, enemy.rect)) continue;
      if (this._isStomp(player, enemy)) {
        enemy.takeDamage(enemy.maxHealth);
        player.vy = player.movement.stompBounceVelocity;
        player.isGrounded = false;
        if (audioManager && enemy.audio && enemy.audio.damage) {
          audioManager.play(enemy.audio.damage);
        }
        if (eventBus) eventBus.emit(GameEvents.ENEMY_DEFEATED, { enemy });
      } else {
        result.damageCandidates.push(enemy.contactDamage || GAME_CONFIG.damage.enemy);
      }
    }

    // Friend vs enemies (только stomp, друзья не наносят боковой урон)
    if (friends && friends.length > 0) {
      for (const friend of friends) {
        if (!friend.alive) continue;
        for (const enemy of enemies) {
          if (!enemy.alive) continue;
          if (!intersects(friend.rect, enemy.rect)) continue;
          if (!this._isStomp(friend, enemy)) continue;
          enemy.takeDamage(enemy.maxHealth);
          const bounce = friend.stompBounceVelocity ?? -420;
          friend.vy = bounce;
          friend.isGrounded = false;
          if (audioManager && enemy.audio && enemy.audio.damage) {
            audioManager.play(enemy.audio.damage);
          }
          if (eventBus) eventBus.emit(GameEvents.ENEMY_DEFEATED, { enemy });
        }
      }
    }

    // Player vs boss
    if (boss && boss.alive && intersects(player.rect, boss.rect)) {
      result.damageCandidates.push(boss.contactDamage || GAME_CONFIG.damage.bossContact);
    }

    // Player vs projectiles
    for (const proj of projectiles) {
      if (!proj.alive) continue;
      if (intersects(player.rect, proj.rect)) {
        result.damageCandidates.push(proj.damage || GAME_CONFIG.damage.bossProjectile);
        proj.alive = false;
      }
    }

    // Projectiles vs environment
    for (const proj of projectiles) {
      if (!proj.alive) continue;
      let hit = false;
      for (const p of level.platforms) {
        if (p.type !== "solid") continue;
        if (intersects(proj.rect, p)) { hit = true; break; }
      }
      if (!hit && level.obstacles) {
        for (const o of level.obstacles) {
          if (intersects(proj.rect, o)) { hit = true; break; }
        }
      }
      if (hit) proj.alive = false;
    }

    // Player vs exit (levels 1-4)
    if (level.exit && player.alive) {
      if (intersects(player.rect, level.exit)) result.levelComplete = true;
    }

    // Traps vs boss
    if (boss && boss.alive && level.traps) {
      for (const trap of level.traps) {
        const dmg = trap.tryDamageBoss(boss);
        if (dmg > 0) {
          boss.takeDamage(dmg, eventBus);
          if (audioManager && boss.audio && boss.audio.damage) {
            audioManager.play(boss.audio.damage);
          }
        }
      }
    }

    // Kill plane
    if (player.y > level.world.height + 200) {
      player.setSpawn(player.spawnX, player.spawnY);
      player.vx = 0; player.vy = 0;
    }

    return result;
  }
}