export const FINALE_CONFIG = Object.freeze({
  playerMoveSpeed: 300,
  friendMoveSpeed: 420,
  friendSpacing: 90,
  minFriendSpacing: 32,
  greeting: "С днем рождения Мария!!!",

  /**
   * Праздничные прыжки во время фазы celebrating.
   * Персонажи не сходят с X и бесконечно подпрыгивают на месте.
   * Каждый прыжок — независимый vertical offset/velocity + gravity.
   */
  jump: {
    basePower: 620,     // px/s — начальная скорость прыжка
    variation: 0.30,    // ±30% случайной вариации силы
    gravity: 1800       // px/s² — ускорение вниз
  },

  /**
   * Пиксельные салюты.
   *  - Ракета летит снизу вверх, имеет свой targetY, взрывается по достижении.
   *  - Высота и число частиц — responsive относительно viewport.
   *  - Ракетная гравитация положительна (тормозит подъём).
   */
  fireworks: {
    spawnIntervalMs: 720,
    minHeightFraction: 0.12,
    maxHeightFraction: 0.62,
    rocketGravity: 420,
    particleGravity: 260,
    particleDrag: 0.986,
    particleCount: 44,
    particleSpeed: 300,
    particleLifeMs: 1200,
    particleSize: 4,
    flashSize: 28,
    flashLifeMs: 220,
    colors: [
      "#ff4081", "#ffd54f", "#4dd0e1", "#ba68c8",
      "#81c784", "#ff8a65", "#ffffff", "#ff5252"
    ]
  }
});