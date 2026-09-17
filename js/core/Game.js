import { GameLoop } from "./GameLoop.js";
import { GameState } from "./GameState.js";
import { EventBus, GameEvents } from "./EventBus.js";
import { TimerManager } from "./TimerManager.js";
import { InputManager, Actions } from "../managers/InputManager.js";
import { EntityManager } from "../managers/EntityManager.js";
import { CollisionManager } from "../managers/CollisionManager.js";
import { LevelManager } from "../managers/LevelManager.js";
import { ResourceManager } from "../managers/ResourceManager.js";
import { AudioManager } from "../managers/AudioManager.js";
import { HUDManager } from "../managers/HUDManager.js";
import { StorageManager } from "../managers/StorageManager.js";
import { DebugManager } from "../managers/DebugManager.js";
import { LevelIntroController } from "../managers/LevelIntroController.js";
import { FinaleController } from "../managers/FinaleController.js";
import { Renderer } from "../rendering/Renderer.js";
import { Camera } from "../rendering/Camera.js";
import { GAME_CONFIG } from "../config/game.config.js";
import { Logger } from "../utils/Logger.js";

export class Game {
  /**
   * @param {HTMLCanvasElement} canvas
   */
  constructor(canvas) {
    this.canvas = canvas;
    this.eventBus = new EventBus();
    this.storage = new StorageManager();
    this.resourceManager = new ResourceManager(this.eventBus);
    this.audioManager = new AudioManager(this.resourceManager);
    this.inputManager = new InputManager();
    this.timerManager = new TimerManager();
    this.camera = new Camera();
    this.renderer = new Renderer(canvas, this.camera, this.resourceManager);
    this.entityManager = new EntityManager();
    this.collisionManager = new CollisionManager(this.eventBus);
    this.debugManager = new DebugManager();

    this.state = GameState.LOADING;
    this.player = null;
    this.levelManager = new LevelManager(this);

    this.gameLoop = new GameLoop(
      (dt) => this.update(dt),
      (alpha) => this.render(alpha),
      GAME_CONFIG.physics.fixedTimeStep,
      GAME_CONFIG.physics.maxFrameDeltaMs
    );

    this.hudManager = new HUDManager(document.body, this.eventBus, this.inputManager);
    this.levelIntro = new LevelIntroController(this.timerManager);
    this.finaleController = new FinaleController(this);

    this._audioUnlockRequested = false;
    this._restartHandler = this._restartHandler.bind(this);
    this._onVisibilityChange = this._onVisibilityChange.bind(this);
    this._onResize = this._onResize.bind(this);
    this._onUserGesture = this._onUserGesture.bind(this);
    this._previousStateBeforeHide = null;
  }

  async init() {
    Logger.info("Game init");
    this.inputManager.attach(window);
    window.addEventListener("resize", this._onResize);
    document.addEventListener("visibilitychange", this._onVisibilityChange);
    window.addEventListener("keydown", this._onUserGesture, { once: false });
    window.addEventListener("pointerdown", this._onUserGesture, { once: false });

    this.eventBus.on("RESTART_REQUESTED", this._restartHandler);

    this._onResize();
    this.hudManager.showAudioUnlock();

    const stored = this.storage.load();
    const startLevel = stored ? stored.lastReachedLevel : 1;

    this.setState(GameState.LOADING);
    await this.levelManager.load(startLevel, { resetHealth: true, isRestart: false });
    this.player = this.levelManager.player;

    this.eventBus.on(GameEvents.PLAYER_HEALTH_CHANGED, (p) => {
      this.hudManager.updateHealth(p.health);
    });
    this.eventBus.on(GameEvents.PLAYER_DIED, () => {
      this.setState(GameState.GAME_OVER);
    });
    this.eventBus.on(GameEvents.BOSS_DEFEATED, () => {
      this._startFinale();
    });

    this.hudManager.updateHealth(this.player.health);

    this.setState(GameState.PLAYING);
    this.levelIntro.show(this.levelManager.currentLevelId);
    this.gameLoop.start();
    Logger.info("Game started");
  }

  setState(state) {
    if (this.state === state) return;
    const prev = this.state;
    this.state = state;
    this.eventBus.emit(GameEvents.GAME_STATE_CHANGED, { state, previous: prev });
    Logger.info(`State: ${prev} -> ${state}`);
  }

  update(dt) {
    if (this.state === GameState.PLAYING) {
      this._updatePlaying(dt);
    } else if (this.state === GameState.PAUSED) {
      // nothing
    } else if (this.state === GameState.GAME_OVER) {
      if (this.inputManager.wasPressed(Actions.RESTART)) {
        this._restartHandler();
      }
    } else if (this.state === GameState.FINALE) {
      this._updateFinale(dt);
    }
    if (this.state === GameState.PLAYING) {
      this.timerManager.update(dt * 1000);
    }
    this.inputManager.endFrame();
  }

  _updatePlaying(dt) {
    const input = this.inputManager;
    const level = this.levelManager.currentLevel;
    if (!level) return;

    for (const e of this.entityManager.entities) {
      e.prevX = e.x;
      e.prevY = e.y;
    }

    if (this.player && this.player.alive) {
      this.player.update(dt, input, this.eventBus);
    }

    const ctx = {
      camera: this.camera,
      entities: this.entityManager.entities,
      audioManager: this.audioManager,
      eventBus: this.eventBus
    };

    for (const e of this.entityManager.entities) {
      if (!e.alive) continue;
      if (e.type === "enemy-1" || e.type === "enemy-2" || e.type === "enemy-3") {
        e.update(dt, this.camera);
      } else if (e.isFriend) {
        e.update(dt, ctx);
      } else if (e.type === "boss") {
        e.update(dt, this.camera, this.player, this.entityManager, this.audioManager, this.eventBus);
      } else if (e.type === "projectile") {
        e.update(dt, this.camera);
      }
    }

    for (const trap of this.levelManager.traps) {
      trap.update(dt, this.player);
    }

    for (const e of this.entityManager.entities) {
      if (!e.alive) continue;
      if (e.applyGravity || e.type === "projectile") {
        this.collisionManager.moveEntity(e, dt, level);
      }
    }

    this._updateVisibilityEvents();

    const enemies = this.entityManager.entities.filter(e =>
      e.alive && (e.type === "enemy-1" || e.type === "enemy-2" || e.type === "enemy-3"));
    const projectiles = this.entityManager.entities.filter(e => e.alive && e.type === "projectile");
    const boss = this.entityManager.entities.find(e => e.alive && e.type === "boss") || null;

    const result = this.collisionManager.resolveEntityInteractions({
      player: this.player,
      enemies,
      boss,
      projectiles,
      level,
      audioManager: this.audioManager,
      eventBus: this.eventBus
    });

    if (result.damageCandidates.length > 0 && this.player && this.player.alive) {
      const maxDmg = Math.max(...result.damageCandidates);
      const applied = this.player.applyDamage(maxDmg, this.eventBus);
      if (applied && this.player.audio && this.player.audio.damage) {
        this.audioManager.play(this.player.audio.damage);
      }
    }

    if (result.levelComplete && this.state === GameState.PLAYING) {
      this._handleLevelComplete();
      return;
    }

    if (this.player) this.camera.follow(this.player);

    this.entityManager.flushRemovals();

    this.debugManager.update(dt * 1000);
  }

  _updateFinale(dt) {
    this.finaleController.update(dt);
    this.entityManager.flushRemovals();
    this.debugManager.update(dt * 1000);
  }

  _startFinale() {
    if (this.state === GameState.FINALE) return;
    this.setState(GameState.FINALE);
    this.finaleController.start();
  }

  _updateVisibilityEvents() {
    for (const e of this.entityManager.entities) {
      if (!e.alive) continue;
      if (e.type === "player") continue;
      if (e.isFriend) continue; // Friend-ы играют spawn-звук самостоятельно
      if (!e.firstVisibleScheduled) e.firstVisibleScheduled = false;
      if (e.visibilityScheduled) continue;
      if (!this.camera.isCenterVisible(e)) continue;
      e.visibilityScheduled = true;
      const delay = e.visibilitySoundDelayMs ?? 1000;
      const id = this.timerManager.schedule(() => {
        if (e.alive && this.camera.isCenterVisible(e)) {
          const path = e.audio && e.audio.extra && e.audio.extra.firstVisible;
          if (path) this.audioManager.play(path);
          this.eventBus.emit(GameEvents.ENTITY_FIRST_VISIBLE, { entity: e });
        }
      }, delay, `entity:${e.id}`);
      e.visibilityTimerId = id;
    }
  }

  async _handleLevelComplete() {
    Logger.info("Level complete");
    await this.levelManager.completeLevel();
    this.player = this.levelManager.player;
    if (this.player) this.hudManager.updateHealth(this.player.health);
    // Показываем интро нового уровня
    if (this.state === GameState.PLAYING) {
      this.levelIntro.show(this.levelManager.currentLevelId);
    }
  }

  async _restartHandler() {
    await this.levelManager.restart();
    this.player = this.levelManager.player;
    if (this.player) {
      this.hudManager.updateHealth(this.player.health);
      this.setState(GameState.PLAYING);
      this.gameLoop.clearAccumulator();
    }
  }

  render(alpha) {
    this.renderer.resize();
    this.renderer.beginFrame();
    const level = this.levelManager.currentLevel;
    if (level) {
      this.renderer.drawBackground(level);
      // Fireworks — «фон» праздника
      if (this.state === GameState.FINALE) {
        this.finaleController.renderFireworks(this.renderer.ctx);
      }
      this.renderer.drawPlatforms(level);
      this.renderer.drawObstacles(level);
      this.renderer.drawHazards(level);
      this.renderer.drawExit(level, this.debugManager.enabled);
      for (const trap of this.levelManager.traps) {
        trap.render(this.renderer.ctx, this.debugManager.enabled);
      }
      this.renderer.drawWorldBounds(level);
      this.renderer.drawEntities(this.entityManager.entities);
      if (this.debugManager.enabled) {
        this.renderer.drawDebug(this.camera, this.entityManager.entities, level);
      }
    }
    this.renderer.endFrame();

    if (this.debugManager.enabled) {
      this.hudManager.setDebugVisible(true);
      this.hudManager.setDebugText(this.debugManager.formatText(this));
    } else {
      this.hudManager.setDebugVisible(false);
    }
  }

  _onResize() {
    this.renderer.resize();
  }

  _onVisibilityChange() {
    if (document.visibilityState === "hidden") {
      if (this.state === GameState.PLAYING || this.state === GameState.FINALE) {
        this._previousStateBeforeHide = this.state;
        this.setState(GameState.PAUSED);
      }
    } else {
      if (this.state === GameState.PAUSED && this._previousStateBeforeHide) {
        this.gameLoop.clearAccumulator();
        this.setState(this._previousStateBeforeHide);
      }
      this._previousStateBeforeHide = null;
    }
  }

  _onUserGesture() {
    if (this._audioUnlockRequested) return;
    this._audioUnlockRequested = true;
    this.audioManager.markUnlocked();
    this.hudManager.hideAudioUnlock();
  }
}