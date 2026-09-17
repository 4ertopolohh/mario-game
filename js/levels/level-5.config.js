export const LEVEL_5 = {
  id: 5,
  music: "./assets/audio/music/level-5.mp3",
  world: { width: 2400, height: 720 },
  playerSpawn: { x: 120, y: 500 },
  platforms: [
    { id: "ground", type: "solid", x: 0, y: 640, width: 2400, height: 80 },
    { id: "p1", type: "oneWay", x: 400, y: 480, width: 200, height: 24 },
    { id: "p2", type: "oneWay", x: 900, y: 480, width: 200, height: 24 },
    { id: "p3", type: "oneWay", x: 1400, y: 480, width: 200, height: 24 },
    { id: "p4", type: "oneWay", x: 1850, y: 480, width: 200, height: 24 }
  ],
  obstacles: [
    { id: "o1", x: 300, y: 560, width: 40, height: 80 },
    { id: "o2", x: 800, y: 560, width: 40, height: 80 },
    { id: "o3", x: 1300, y: 560, width: 40, height: 80 },
    { id: "o4", x: 1800, y: 560, width: 40, height: 80 }
  ],
  hazards: [
    { id: "h1", x: 600, y: 620, width: 120, height: 20, damage: 0.5, texture: "./assets/images/hazards/spikes.webp" },
    { id: "h2", x: 1050, y: 620, width: 120, height: 20, damage: 0.5, texture: "./assets/images/hazards/spikes.webp" },
    { id: "h3", x: 1600, y: 620, width: 120, height: 20, damage: 0.5, texture: "./assets/images/hazards/spikes.webp" },
    { id: "h4", x: 2100, y: 620, width: 120, height: 20, damage: 0.5, texture: "./assets/images/hazards/spikes.webp" }
  ],
  enemies: [
    { id: "e5-1", type: "enemy1", spawn: { x: 500, y: 544 }, patrol: { mode: "pingPong", points: [{ x: 500, y: 544 }, { x: 750, y: 544 }] } },
    { id: "e5-2", type: "enemy2", spawn: { x: 1000, y: 544 }, patrol: { mode: "pingPong", points: [{ x: 1000, y: 544 }, { x: 1250, y: 544 }] } },
    { id: "e5-3", type: "enemy3", spawn: { x: 1500, y: 544 }, patrol: { mode: "pingPong", points: [{ x: 1500, y: 544 }, { x: 1750, y: 544 }] } },
    { id: "e5-4", type: "enemy1", spawn: { x: 2000, y: 544 }, patrol: { mode: "pingPong", points: [{ x: 2000, y: 544 }, { x: 2250, y: 544 }] } }
  ],
  // НЕТ массива friends — Friends здесь появляются только через FinaleController
  // после BOSS_DEFEATED.
  boss: { x: 2100, y: 448 },
  bossTraps: [
    // Boss статичен на x 2100..2228, y 448..640.
    // damageZone каждой ловушки реально пересекает AABB Boss-а.
    // Значение damage НЕ указано — LevelManager берёт его из BOSS_CONFIG
    // (health.max / requiredTrapHits = 10 / 5 = 2).
    {
      id: "boss-trap-01",
      trigger: { x: 300, y: 560, width: 80, height: 80 },
      damageZone: { x: 2060, y: 440, width: 200, height: 220 },
      activeDurationMs: 350, rearmMs: 1500
    },
    {
      id: "boss-trap-02",
      trigger: { x: 1300, y: 560, width: 80, height: 80 },
      damageZone: { x: 2080, y: 460, width: 200, height: 200 },
      activeDurationMs: 350, rearmMs: 1500
    },
    {
      id: "boss-trap-03",
      trigger: { x: 700, y: 560, width: 80, height: 80 },
      damageZone: { x: 2100, y: 440, width: 200, height: 200 },
      activeDurationMs: 350, rearmMs: 1500
    }
  ]
};