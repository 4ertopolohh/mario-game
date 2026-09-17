export const PLAYER_CONFIG = {
  id: "player",
  nickname: "Мария",
  appearance: {
    headTexture: "./assets/images/player/head.png",
    bodyTexture: "./assets/images/player/body.png",
    finalBodyTexture: "./assets/images/player/body-final.png"
  },
  audio: {
    damage: "./assets/audio/player/damage.mp3",
    extra: {
      levelEntered: "./assets/audio/player/level-enter.mp3"
    }
  },
  size: { width: 64, height: 96 },
  movement: {
    speed: 240,
    jumpVelocity: -760,
    stompBounceVelocity: -420
  },
  health: { max: 3, invulnerabilityMs: 1000 },
  damageAnimation: { durationMs: 500, visibilitySwitches: 5 }
};