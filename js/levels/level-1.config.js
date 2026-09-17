export const LEVEL_1 = {
  id: 1,
  music: "./assets/audio/music/level-1.mp3",
  world: { width: 3200, height: 720 },
  playerSpawn: { x: 120, y: 500 },
  platforms: [
    { id: "ground", type: "solid", x: 0, y: 640, width: 3200, height: 80 },
    { id: "p1", type: "oneWay", x: 400, y: 500, width: 220, height: 24 },
    { id: "p2", type: "oneWay", x: 780, y: 420, width: 220, height: 24 },
    { id: "p3", type: "oneWay", x: 1200, y: 500, width: 220, height: 24 },
    { id: "p4", type: "oneWay", x: 1600, y: 460, width: 220, height: 24 },
    { id: "p5", type: "oneWay", x: 2100, y: 420, width: 220, height: 24 },
    { id: "p6", type: "oneWay", x: 2600, y: 500, width: 220, height: 24 }
  ],
  obstacles: [
    { id: "o1", x: 600, y: 560, width: 40, height: 80 },
    { id: "o2", x: 1500, y: 560, width: 40, height: 80 },
    { id: "o3", x: 2400, y: 560, width: 40, height: 80 }
  ],
  hazards: [
    { id: "h1", x: 1000, y: 620, width: 120, height: 20, damage: 0.5, texture: "./assets/images/hazards/spikes.webp" },
    { id: "h2", x: 1850, y: 620, width: 140, height: 20, damage: 0.5, texture: "./assets/images/hazards/spikes.webp" },
    { id: "h3", x: 2700, y: 620, width: 120, height: 20, damage: 0.5, texture: "./assets/images/hazards/spikes.webp" }
  ],
  enemies: [
    { id: "e1-1", type: "enemy1", spawn: { x: 900, y: 544 }, patrol: { mode: "pingPong", points: [{ x: 900, y: 544 }, { x: 1250, y: 544 }] } },
    { id: "e1-2", type: "enemy2", spawn: { x: 1650, y: 544 }, patrol: { mode: "pingPong", points: [{ x: 1650, y: 544 }, { x: 2000, y: 544 }] } },
    { id: "e1-3", type: "enemy3", spawn: { x: 2350, y: 544 }, patrol: { mode: "pingPong", points: [{ x: 2350, y: 544 }, { x: 2750, y: 544 }] } }
  ],
  exit: { x: 3080, y: 0, width: 80, height: 720 }
};