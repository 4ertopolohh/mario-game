export const BOSS_CONFIG = {
  id: "boss",
  nickname: "Босс",
  size: { width: 128, height: 192 },
  appearance: {
    headTexture: "./assets/images/boss/head.webp",
    bodyTexture: "./assets/images/boss/body.webp"
  },
  health: { max: 10 },
  /** Ровно 5 успешных trap hit убивают босса. */
  requiredTrapHits: 5,
  damage: { contact: 2, projectile: 1 },
  projectile: {
    intervalMs: 1800,
    speed: 360,
    appearance: {
      texture: "./assets/images/boss/projectile.webp"
    }
  },
  audio: {
    damage: "./assets/audio/boss/damage.mp3",
    extra: {
      firstVisible: "./assets/audio/boss/visible.mp3",
      projectile: "./assets/audio/boss/projectile.mp3"
    }
  },
  visibilitySoundDelayMs: 1000
};