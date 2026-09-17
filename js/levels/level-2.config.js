export const LEVEL_2 = {
  id: 2,
  music: "./assets/audio/music/level-2.mp3",
  world: { width: 3800, height: 720 },
  playerSpawn: { x: 120, y: 500 },
  platforms: [
    { id: "ground", type: "solid", x: 0, y: 640, width: 3800, height: 80 },
    { id: "p1", type: "oneWay", x: 340, y: 500, width: 200, height: 24 },
    { id: "p2", type: "oneWay", x: 660, y: 400, width: 200, height: 24 },
    { id: "p3", type: "oneWay", x: 1000, y: 480, width: 220, height: 24 },
    { id: "p4", type: "oneWay", x: 1380, y: 420, width: 200, height: 24 },
    { id: "p5", type: "oneWay", x: 1720, y: 500, width: 220, height: 24 },
    { id: "p6", type: "oneWay", x: 2080, y: 420, width: 220, height: 24 },
    { id: "p7", type: "oneWay", x: 2500, y: 500, width: 220, height: 24 },
    { id: "p8", type: "oneWay", x: 2950, y: 460, width: 220, height: 24 }
  ],
  obstacles: [
    { id: "o1", x: 560, y: 560, width: 40, height: 80 },
    { id: "o2", x: 1200, y: 520, width: 40, height: 120 },
    { id: "o3", x: 1900, y: 560, width: 40, height: 80 },
    { id: "o4", x: 2700, y: 520, width: 40, height: 120 },
    { id: "o5", x: 3300, y: 560, width: 40, height: 80 }
  ],
  hazards: [
    { id: "h1", x: 900, y: 620, width: 130, height: 20, damage: 0.5, texture: "./assets/images/ui/spikes.png" },
    { id: "h2", x: 1600, y: 620, width: 140, height: 20, damage: 0.5, texture: "./assets/images/ui/spikes.png" },
    { id: "h3", x: 2350, y: 620, width: 140, height: 20, damage: 0.5, texture: "./assets/images/ui/spikes.png" },
    { id: "h4", x: 3050, y: 620, width: 140, height: 20, damage: 0.5, texture: "./assets/images/ui/spikes.png" }
  ],
  enemies: [
    { id: "e2-1", type: "enemy1", spawn: { x: 800, y: 544 }, patrol: { mode: "pingPong", points: [{ x: 800, y: 544 }, { x: 1150, y: 544 }] } },
    { id: "e2-2", type: "enemy2", spawn: { x: 1450, y: 544 }, patrol: { mode: "pingPong", points: [{ x: 1450, y: 544 }, { x: 1800, y: 544 }] } },
    { id: "e2-3", type: "enemy3", spawn: { x: 2150, y: 544 }, patrol: { mode: "pingPong", points: [{ x: 2150, y: 544 }, { x: 2450, y: 544 }] } },
    { id: "e2-4", type: "enemy1", spawn: { x: 2850, y: 544 }, patrol: { mode: "pingPong", points: [{ x: 2850, y: 544 }, { x: 3250, y: 544 }] } }
  ],
  exit: { x: 3660, y: 0, width: 80, height: 720 }
};