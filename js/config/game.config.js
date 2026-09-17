export const GAME_CONFIG = {
  physics: {
    gravity: 2000,
    maxFallSpeed: 1200,
    fixedTimeStep: 1 / 60,
    maxFrameDeltaMs: 250
  },
  viewport: {
    referenceHeight: 720,
    /** Общий zoom игрового мира. 1.0 = без изменений, >1 = крупнее. */
    zoom: 1.1
  },
  camera: {
    /**
     * Доля высоты viewport, на которой удерживается центр цели.
     * 0.5 — центр экрана, <0.5 — цель выше (камера визуально ниже, меньше пустоты сверху).
     */
    verticalAnchor: 0.45
  },
  visuals: {
    /** Визуальный overlap головы поверх тела (доля от bodyH). */
    headBodyOverlap: 0.15,
    /** Затемнение фонового слоя во время салютов (0..1). */
    finaleBackgroundDim: 0.5
  },
  damage: {
    enemy: 0.5,
    hazard: 0.5,
    bossContact: 2,
    bossProjectile: 1
  },
  player: {
    maxHealth: 3,
    invulnerabilityMs: 1000
  },
  nickname: {
    maxLength: 24,
    offsetY: 12
  },
  debug: {
    enabled: false
  },
  stompTolerance: 8,
  dropThroughDurationMs: 200
};