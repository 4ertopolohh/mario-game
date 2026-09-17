export const FINALE_CONFIG = Object.freeze({
  playerMoveSpeed: 300,
  friendMoveSpeed: 420,
  friendSpacing: 90,
  greeting: "С днем рождения!!!",
  fireworks: {
    spawnIntervalMs: 700,
    gravity: -220,          // отрицательное — ракета замедляется
    particleGravity: 300,   // положительное — частицы падают
    minHeight: 220,
    maxHeight: 520,
    particleCount: 36,
    particleSpeed: 260,
    particleLifeMs: 1100,
    particleSize: 4,
    colors: ["#ff4081", "#ffd54f", "#4dd0e1", "#ba68c8", "#81c784", "#ff8a65"]
  }
});