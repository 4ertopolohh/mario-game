export const GAME_CONFIG = {
  physics: {
    gravity: 2000,
    maxFallSpeed: 1200,
    fixedTimeStep: 1 / 60,
    maxFrameDeltaMs: 250
  },
  viewport: {
    referenceHeight: 720,
    zoom: 1.6
  },
  camera: {
    verticalAnchor: 0.4
  },
  visuals: {
    headBodyOverlap: 0.15,
    finaleBackgroundDim: 0.5
  },
  audio: {
    /**
     * Коэффициент усиления character SFX через Web Audio GainNode.
     * HTMLAudioElement.volume ограничен 1.0, поэтому реальное усиление
     * выполняется здесь. Применяется только к one-shot SFX (play()),
     * музыка уровней использует собственный volume и не усиливается.
     */
    sfxGain: 10,
    /**
     * Громкость фоновой музыки уровней.
     * Заметно ниже SFX, чтобы character-звуки читались на фоне трека.
     * Задаётся одним числом: AudioManager применяет его к каждому
     * looped music node при старте.
     */
    musicVolume: 0.30
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