import { LEVELS } from "../levels/index.js";
import { Player } from "../entities/Player.js";
import { EnemyType1 } from "../entities/EnemyType1.js";
import { EnemyType2 } from "../entities/EnemyType2.js";
import { EnemyType3 } from "../entities/EnemyType3.js";
import { createFriend } from "../entities/Friend.js";
import { FRIEND_CONFIG_BY_TYPE, FRIEND_TYPES_ORDERED, FRIEND_RANDOM_SPAWN } from "../config/friends.config.js";
import { Boss } from "../entities/Boss.js";
import { Trap } from "../entities/Trap.js";
import { PLAYER_CONFIG } from "../config/player.config.js";
import { ASSETS_CONFIG } from "../config/assets.config.js";
import { ENEMY_TYPE_1_CONFIG, ENEMY_TYPE_2_CONFIG, ENEMY_TYPE_3_CONFIG } from "../config/enemies.config.js";
import { BOSS_CONFIG } from "../config/boss.config.js";
import { TRAP_DEFAULT_CONFIG } from "../config/traps.config.js";
import { GameEvents } from "../core/EventBus.js";
import { Logger } from "../utils/Logger.js";
import { GameState } from "../core/GameState.js";
import { intersects } from "../utils/aabb.js";

export class LevelManager {
  constructor(game) {
    this.game = game;
    this.currentLevelId = 1;
    this.currentLevel = null;
    this.player = null;
    this.boss = null;
    this.traps = [];
    this.audioManager = game.audioManager;
    this.resourceManager = game.resourceManager;
    this.entityManager = game.entityManager;
    this.eventBus = game.eventBus;

    /**
     * Результат последнего random roll.
     * Структура: { levelId:number, spawn:boolean, type:string|null }.
     * Переиспользуется при restart того же уровня.
     */
    this._randomFriendState = null;
  }

  getLevelConfig(id) {
    return LEVELS.find(l => l.id === id) || null;
  }

  async load(levelId, { resetHealth = true, isRestart = false } = {}) {
    Logger.info(`Loading level ${levelId}${isRestart ? " (restart)" : ""}`);
    this.unload();

    const cfg = this.getLevelConfig(levelId);
    if (!cfg) {
      Logger.error(`Level ${levelId} not found`);
      return false;
    }
    this.currentLevelId = levelId;
    this.currentLevel = { ...cfg, traps: [] };

    // Случайный Friend roll — до preload, чтобы включить его ассеты.
    const friendDecision = this._getOrCreateRandomFriendDecision(levelId, isRestart);
    const friendTypeToPreload = friendDecision.spawn ? friendDecision.type : null;

    await this._preloadLevelAssets(cfg, friendTypeToPreload);

    // Player
    const player = new Player(PLAYER_CONFIG);
    player.setResourceManager(this.resourceManager);
    player.setSpawn(cfg.playerSpawn.x, cfg.playerSpawn.y);
    if (resetHealth) player.health = PLAYER_CONFIG.health.max;
    this.player = player;
    this.entityManager.add(player);

    // Enemies (обычные)
    for (const spawn of (cfg.enemies || [])) {
      let e;
      if (spawn.type === "enemy1") e = new EnemyType1(spawn);
      else if (spawn.type === "enemy2") e = new EnemyType2(spawn);
      else if (spawn.type === "enemy3") e = new EnemyType3(spawn);
      else continue;
      e.setResourceManager(this.resourceManager);
      this.entityManager.add(e);
    }

    // Случайный Friend (Levels 1–4, 10%, максимум один)
    if (friendDecision.spawn && friendDecision.type) {
      const spawnPos = this._findSafeFriendSpawn(cfg);
      const f = createFriend(friendDecision.type, {
        id: `random-friend-${levelId}-${friendDecision.type}`,
        spawn: spawnPos
      });
      if (f) {
        f.setResourceManager(this.resourceManager);
        this.entityManager.add(f);
      }
    }

    // Boss
    if (cfg.boss) {
      const boss = new Boss(cfg.boss);
      boss.setResourceManager(this.resourceManager);
      this.entityManager.add(boss);
      this.boss = boss;
    }

    // Traps. Единый источник истины — BOSS_CONFIG: damage = max / requiredTrapHits.
    if (cfg.bossTraps && cfg.bossTraps.length > 0) {
      const requiredHits = BOSS_CONFIG.requiredTrapHits || 5;
      const computedDamage = BOSS_CONFIG.health.max / requiredHits;
      for (const t of cfg.bossTraps) {
        const trap = new Trap({
          ...TRAP_DEFAULT_CONFIG,
          ...t,
          damage: computedDamage,
          appearance: {
            ...TRAP_DEFAULT_CONFIG.appearance,
            ...(t.appearance || {})
          }
        });
        trap.setResourceManager(this.resourceManager);
        this.currentLevel.traps.push(trap);
        this.traps.push(trap);
      }
    }

    this.game.camera.setWorldBounds(cfg.world.width, cfg.world.height);

    this.eventBus.emit(GameEvents.LEVEL_LOADED, { levelId, level: this.currentLevel });

    // Level-enter звук — только при заходе на НОВЫЙ уровень
    if (!isRestart &&
        PLAYER_CONFIG.audio && PLAYER_CONFIG.audio.extra &&
        PLAYER_CONFIG.audio.extra.levelEntered) {
      this.audioManager.play(PLAYER_CONFIG.audio.extra.levelEntered);
    }

    // Фоновая музыка: idempotent для того же уровня
    if (cfg.music) {
      this.audioManager.ensureMusic(cfg.music, `level:${levelId}`);
    }

    this._preloadRemainingLevels();

    return true;
  }

  // ---------------------------------------------------------------------------
  // Random Friend helper (Levels 1–4, 10%, без reroll при restart)
  // ---------------------------------------------------------------------------

  _getOrCreateRandomFriendDecision(levelId, isRestart) {
    if (isRestart &&
        this._randomFriendState &&
        this._randomFriendState.levelId === levelId) {
      return this._randomFriendState;
    }
    const state = this._rollRandomFriend(levelId);
    this._randomFriendState = state;
    return state;
  }

  _rollRandomFriend(levelId) {
    if (FRIEND_RANDOM_SPAWN.disabledLevelIds.includes(levelId)) {
      return { levelId, spawn: false, type: null };
    }
    if (Math.random() < FRIEND_RANDOM_SPAWN.chance) {
      const idx = Math.floor(Math.random() * FRIEND_TYPES_ORDERED.length);
      return { levelId, spawn: true, type: FRIEND_TYPES_ORDERED[idx] };
    }
    return { levelId, spawn: false, type: null };
  }

  _findSafeFriendSpawn(cfg) {
    const baseX = (cfg.playerSpawn && cfg.playerSpawn.x) || 120;
    const baseY = (cfg.playerSpawn && cfg.playerSpawn.y) || 500;

    const candidates = [
      { x: baseX + 240, y: baseY },
      { x: baseX + 400, y: baseY },
      { x: baseX - 200, y: baseY }
    ];
    const W = 64, H = 96;
    for (const c of candidates) {
      if (c.x < 40) continue;
      if (c.x + W > cfg.world.width - 40) continue;
      if (this._isSpotBlocked(c, W, H, cfg)) continue;
      return { x: c.x, y: c.y };
    }
    return { x: baseX + 240, y: baseY };
  }

  _isSpotBlocked(pos, w, h, cfg) {
    const r = { x: pos.x, y: pos.y, width: w, height: h };
    if (cfg.platforms) {
      for (const p of cfg.platforms) {
        if (p.type !== "solid") continue;
        if (intersects(r, p)) return true;
      }
    }
    if (cfg.obstacles) {
      for (const o of cfg.obstacles) {
        if (intersects(r, o)) return true;
      }
    }
    if (cfg.hazards) {
      for (const hz of cfg.hazards) {
        if (intersects(r, hz)) return true;
      }
    }
    return false;
  }

  // ---------------------------------------------------------------------------
  // Asset preload
  // ---------------------------------------------------------------------------

  async _preloadLevelAssets(cfg, randomFriendType = null) {
    const paths = [];

    if (PLAYER_CONFIG.appearance) {
      paths.push(PLAYER_CONFIG.appearance.headTexture, PLAYER_CONFIG.appearance.bodyTexture);
    }

    const typesUsed = new Set((cfg.enemies || []).map(e => e.type));
    if (typesUsed.has("enemy1")) paths.push(ENEMY_TYPE_1_CONFIG.appearance.headTexture, ENEMY_TYPE_1_CONFIG.appearance.bodyTexture);
    if (typesUsed.has("enemy2")) paths.push(ENEMY_TYPE_2_CONFIG.appearance.headTexture, ENEMY_TYPE_2_CONFIG.appearance.bodyTexture);
    if (typesUsed.has("enemy3")) paths.push(ENEMY_TYPE_3_CONFIG.appearance.headTexture, ENEMY_TYPE_3_CONFIG.appearance.bodyTexture);

    // Assets случайного Friend-а (если он будет создан).
    if (randomFriendType) {
      const fc = FRIEND_CONFIG_BY_TYPE[randomFriendType];
      if (fc && fc.appearance) {
        paths.push(fc.appearance.headTexture, fc.appearance.bodyTexture);
      }
    }

    if (cfg.boss) {
      paths.push(BOSS_CONFIG.appearance.headTexture, BOSS_CONFIG.appearance.bodyTexture);
      if (BOSS_CONFIG.projectile.appearance) {
        paths.push(BOSS_CONFIG.projectile.appearance.texture);
      }
    }

    if (cfg.bossTraps && cfg.bossTraps.length > 0) {
      paths.push(TRAP_DEFAULT_CONFIG.appearance.texture);
    }

    if (cfg.hazards) {
      for (const h of cfg.hazards) {
        if (h.texture) paths.push(h.texture);
      }
    }

    paths.push(ASSETS_CONFIG.heart);

    await this.resourceManager.loadImages(paths);

    const audios = [];
    if (PLAYER_CONFIG.audio) {
      if (PLAYER_CONFIG.audio.damage) audios.push(PLAYER_CONFIG.audio.damage);
      if (PLAYER_CONFIG.audio.extra) {
        for (const v of Object.values(PLAYER_CONFIG.audio.extra)) if (v) audios.push(v);
      }
    }
    for (const [used, conf] of [
      [typesUsed.has("enemy1"), ENEMY_TYPE_1_CONFIG],
      [typesUsed.has("enemy2"), ENEMY_TYPE_2_CONFIG],
      [typesUsed.has("enemy3"), ENEMY_TYPE_3_CONFIG]
    ]) {
      if (used && conf.audio) {
        if (conf.audio.damage) audios.push(conf.audio.damage);
        if (conf.audio.extra) for (const v of Object.values(conf.audio.extra)) if (v) audios.push(v);
      }
    }
    if (randomFriendType) {
      const fc = FRIEND_CONFIG_BY_TYPE[randomFriendType];
      if (fc && fc.audio && fc.audio.spawn) audios.push(fc.audio.spawn);
    }
    if (cfg.boss && BOSS_CONFIG.audio) {
      if (BOSS_CONFIG.audio.damage) audios.push(BOSS_CONFIG.audio.damage);
      if (BOSS_CONFIG.audio.extra) for (const v of Object.values(BOSS_CONFIG.audio.extra)) if (v) audios.push(v);
    }
    if (cfg.music) audios.push(cfg.music);

    this.resourceManager.loadAudios(audios).catch(() => {});
  }

  _preloadRemainingLevels() {
    setTimeout(async () => {
      try {
        for (const lvl of LEVELS) {
          if (lvl.id === this.currentLevelId) continue;
          const paths = [];
          const typesUsed = new Set((lvl.enemies || []).map(e => e.type));
          if (typesUsed.has("enemy1")) paths.push(ENEMY_TYPE_1_CONFIG.appearance.headTexture, ENEMY_TYPE_1_CONFIG.appearance.bodyTexture);
          if (typesUsed.has("enemy2")) paths.push(ENEMY_TYPE_2_CONFIG.appearance.headTexture, ENEMY_TYPE_2_CONFIG.appearance.bodyTexture);
          if (typesUsed.has("enemy3")) paths.push(ENEMY_TYPE_3_CONFIG.appearance.headTexture, ENEMY_TYPE_3_CONFIG.appearance.bodyTexture);
          if (lvl.boss) paths.push(BOSS_CONFIG.appearance.headTexture, BOSS_CONFIG.appearance.bodyTexture);
          await this.resourceManager.loadImages(paths);
        }
      } catch (e) { /* ignore */ }
    }, 200);
  }

  unload() {
    this.entityManager.clear();
    this.traps = [];
    this.currentLevel = null;
    this.player = null;
    this.boss = null;
    this.game.timerManager.clearScope("level");
    this.game.timerManager.clearScopePrefix("entity:");
  }

  async completeLevel() {
    if (!this.currentLevel) return;
    const currentId = this.currentLevelId;
    this.eventBus.emit(GameEvents.LEVEL_COMPLETED, { levelId: currentId });

    if (currentId >= 5) {
      this.game.setState(GameState.GAME_COMPLETED);
      return;
    }
    const nextId = currentId + 1;
    this.game.storage.save(nextId);
    await this.load(nextId, { resetHealth: true, isRestart: false });
    this.game.setState(GameState.PLAYING);
  }

  async restart() {
    await this.load(this.currentLevelId, { resetHealth: true, isRestart: true });
    this.game.setState(GameState.PLAYING);
  }

  async loadNext() {
    if (this.currentLevelId >= 5) return;
    this.game.storage.save(this.currentLevelId + 1);
    await this.load(this.currentLevelId + 1, { resetHealth: true, isRestart: false });
  }
}