export const ENEMY_BASE_CONFIG = {
  size: { width: 64, height: 96 },
  health: { max: 1 },
  damage: { contact: 0.5 },
  movement: { speed: 100 },
  visibilitySoundDelayMs: 1000
};

export const ENEMY_TYPE_1_CONFIG = {
  type: "enemy-1",
  nickname: "Максимка",
  appearance: {
    headTexture: "./assets/images/enemies/type-1/head.png",
    bodyTexture: "./assets/images/enemies/type-1/body.png"
  },
  audio: {
    damage: "./assets/audio/enemies/type-1/damage.mp3",
    extra: { firstVisible: "./assets/audio/enemies/type-1/extra.mp3" }
  }
};

export const ENEMY_TYPE_2_CONFIG = {
  type: "enemy-2",
  nickname: "Богданчик",
  appearance: {
    headTexture: "./assets/images/enemies/type-2/head.png",
    bodyTexture: "./assets/images/enemies/type-2/body.png",
    // Визуальный масштаб головы относительно её базового центра.
    // Был 1.3, увеличен ещё на 10%: 1.3 * 1.10 = 1.43.
    // Hitbox/size/rect не затрагиваются.
    headScale: 1.43
  },
  audio: {
    damage: "./assets/audio/enemies/type-2/damage.mp3",
    extra: { firstVisible: "./assets/audio/enemies/type-2/extra.mp3" }
  }
};

export const ENEMY_TYPE_3_CONFIG = {
  type: "enemy-3",
  nickname: "Деревянко",
  appearance: {
    headTexture: "./assets/images/enemies/type-3/head.png",
    bodyTexture: "./assets/images/enemies/type-3/body.png"
  },
  audio: {
    damage: "./assets/audio/enemies/type-3/damage.mp3",
    extra: { firstVisible: "./assets/audio/enemies/type-3/extra.mp3" }
  }
};