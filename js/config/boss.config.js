export const BOSS_CONFIG = {
  id: "boss",
  nickname: "Раиса",
  size: { width: 128, height: 192 },
  appearance: {
    headTexture: "./assets/images/boss/head.png",
    bodyTexture: "./assets/images/boss/body.png"
  },
  health: { max: 10 },
  /** Ровно 5 успешных trap hit убивают босса. */
  requiredTrapHits: 5,
  damage: { contact: 2, projectile: 1 },
  projectile: {
    intervalMs: 1800,
    speed: 200,
    appearance: {
      texture: "./assets/images/ui/sperm.png"
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