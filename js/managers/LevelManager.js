import { LEVELS } from "../levels/index.js";
import { Player } from "../entities/Player.js";
import { EnemyType1 } from "../entities/EnemyType1.js";
import { EnemyType2 } from "../entities/EnemyType2.js";
import { EnemyType3 } from "../entities/EnemyType3.js";
import { createFriend } from "../entities/Friend.js";
import { FRIEND_CONFIG_BY_TYPE, FRIEND_TYPES_ORDERED } from "../config/friends.config.js";
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

    await this._preloadLevelAssets(cfg);

    // Player
    const player = new Player(PLAYER_CONFIG);
    player.setResourceManager(this.resourceManager);
    player.setSpawn(cfg.playerSpawn.x, cfg.playerSpawn.y);
    if (resetHealth) player.health = PLAYER_CONFIG.health.max;
    this.player = player;
    this.entityManager.add(player);

    // Enemies
    for (const spawn of (cfg.enemies || [])) {
      let e;
      if (spawn.type === "enemy1") e = new EnemyType1(spawn);
      else if (spawn.type === "enemy2") e = new EnemyType2(spawn);
      else if (spawn.type === "enemy3") e = new EnemyType3(spawn);
      else continue;
      e.setResourceManager(this.resourceManager);
      this.entityManager.add(e);
    }

    // Friends
    for (const spawn of (cfg.friends || [])) {
      const f = createFriend(spawn.type, spawn);
      if (!f) continue;
      f.setResourceManager(this.resourceManager);
      this.entityManager.add(f);
    }

    // Boss
    if (cfg.boss) {
      const boss = new Boss(cfg.boss);
      boss.setResourceManager(this.resourceManager);
      this.entityManager.add(boss);
      this.boss = boss;
    }

    // Traps: damage = boss.max / requiredTrapHits
    if (cfg.bossTraps) {
      const requiredHits = BOSS_CONFIG.requiredTrapHits || 5;
      const computedDamage = BOSS_CONFIG.health.max / requiredHits;
      for (const t of cfg.bossTraps) {
        const trap = new Trap({
          ...TRAP_DEFAULT_CONFIG,
          ...t,
          damage: typeof t.damage === "number" ? t.damage : computedDamage,
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

    // Фоновая подгрузка остальных уровней
    this._preloadRemainingLevels();

    return true;
  }

  async _preloadLevelAssets(cfg) {
    const paths = [];

    if (PLAYER_CONFIG.appearance) {
      paths.push(PLAYER_CONFIG.appearance.headTexture, PLAYER_CONFIG.appearance.bodyTexture);
    }

    const typesUsed = new Set((cfg.enemies || []).map(e => e.type));
    if (typesUsed.has("enemy1")) paths.push(ENEMY_TYPE_1_CONFIG.appearance.headTexture, ENEMY_TYPE_1_CONFIG.appearance.bodyTexture);
    if (typesUsed.has("enemy2")) paths.push(ENEMY_TYPE_2_CONFIG.appearance.headTexture, ENEMY_TYPE_2_CONFIG.appearance.bodyTexture);
    if (typesUsed.has("enemy3")) paths.push(ENEMY_TYPE_3_CONFIG.appearance.headTexture, ENEMY_TYPE_3_CONFIG.appearance.bodyTexture);

    // Friends
    const friendTypes = new Set((cfg.friends || []).map(f => f.type));
    for (const t of friendTypes) {
      const fc = FRIEND_CONFIG_BY_TYPE[t];
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

    // Trap texture
    if (cfg.bossTraps && cfg.bossTraps.length > 0) {
      paths.push(TRAP_DEFAULT_CONFIG.appearance.texture);
    }

    // Hazard textures
    if (cfg.hazards) {
      for (const h of cfg.hazards) {
        if (h.texture) paths.push(h.texture);
      }
    }

    paths.push(ASSETS_CONFIG.heart);

    await this.resourceManager.loadImages(paths);

    // Аудио грузится асинхронно, чтобы не задерживать старт уровня.
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
    for (const t of friendTypes) {
      const fc = FRIEND_CONFIG_BY_TYPE[t];
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
          const friendTypes = new Set((lvl.friends || []).map(f => f.type));
          for (const t of friendTypes) {
            const fc = FRIEND_CONFIG_BY_TYPE[t];
            if (fc && fc.appearance) paths.push(fc.appearance.headTexture, fc.appearance.bodyTexture);
          }
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