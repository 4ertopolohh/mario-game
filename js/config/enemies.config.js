export const ENEMY_BASE_CONFIG = {
  size: { width: 64, height: 96 },
  health: { max: 1 },
  damage: { contact: 0.5 },
  movement: { speed: 100 },
  visibilitySoundDelayMs: 1000
};

export const ENEMY_TYPE_1_CONFIG = {
  type: "enemy-1",
  nickname: "Враг 1",
  appearance: {
    headTexture: "./assets/images/enemies/type-1/head.webp",
    bodyTexture: "./assets/images/enemies/type-1/body.webp"
  },
  audio: {
    damage: "./assets/audio/enemies/type-1/damage.mp3",
    extra: { firstVisible: "./assets/audio/enemies/type-1/visible.mp3" }
  }
};

export const ENEMY_TYPE_2_CONFIG = {
  type: "enemy-2",
  nickname: "Враг 2",
  appearance: {
    headTexture: "./assets/images/enemies/type-2/head.webp",
    bodyTexture: "./assets/images/enemies/type-2/body.webp"
  },
  audio: {
    damage: "./assets/audio/enemies/type-2/damage.mp3",
    extra: { firstVisible: "./assets/audio/enemies/type-2/visible.mp3" }
  }
};

export const ENEMY_TYPE_3_CONFIG = {
  type: "enemy-3",
  nickname: "Враг 3",
  appearance: {
    headTexture: "./assets/images/enemies/type-3/head.webp",
    bodyTexture: "./assets/images/enemies/type-3/body.webp"
  },
  audio: {
    damage: "./assets/audio/enemies/type-3/damage.mp3",
    extra: { firstVisible: "./assets/audio/enemies/type-3/visible.mp3" }
  }
};