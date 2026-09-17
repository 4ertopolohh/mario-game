export const LEVEL_4 = {
  id: 4,
  music: "./assets/audio/music/level-4.mp3",
  world: { width: 5000, height: 720 },
  playerSpawn: { x: 120, y: 500 },
  platforms: [
    { id: "ground", type: "solid", x: 0, y: 640, width: 5000, height: 80 },
    { id: "p1", type: "oneWay", x: 320, y: 500, width: 180, height: 24 },
    { id: "p2", type: "oneWay", x: 600, y: 400, width: 180, height: 24 },
    { id: "p3", type: "oneWay", x: 920, y: 480, width: 200, height: 24 },
    { id: "p4", type: "oneWay", x: 1260, y: 400, width: 200, height: 24 },
    { id: "p5", type: "oneWay", x: 1620, y: 500, width: 200, height: 24 },
    { id: "p6", type: "oneWay", x: 1980, y: 400, width: 200, height: 24 },
    { id: "p7", type: "oneWay", x: 2360, y: 480, width: 200, height: 24 },
    { id: "p8", type: "oneWay", x: 2740, y: 420, width: 200, height: 24 },
    { id: "p9", type: "oneWay", x: 3140, y: 500, width: 200, height: 24 },
    { id: "p10", type: "oneWay", x: 3540, y: 400, width: 200, height: 24 },
    { id: "p11", type: "oneWay", x: 3960, y: 480, width: 200, height: 24 },
    { id: "p12", type: "oneWay", x: 4380, y: 420, width: 200, height: 24 }
  ],
  obstacles: [
    { id: "o1", x: 500, y: 560, width: 40, height: 80 },
    { id: "o2", x: 1050, y: 520, width: 40, height: 120 },
    { id: "o3", x: 1550, y: 560, width: 40, height: 80 },
    { id: "o4", x: 2100, y: 520, width: 40, height: 120 },
    { id: "o5", x: 2650, y: 560, width: 40, height: 80 },
    { id: "o6", x: 3300, y: 520, width: 40, height: 120 },
    { id: "o7", x: 3900, y: 560, width: 40, height: 80 },
    { id: "o8", x: 4500, y: 520, width: 40, height: 120 }
  ],
  hazards: [
    { id: "h1", x: 820, y: 620, width: 120, height: 20, damage: 0.5, texture: "./assets/images/ui/spikes.png" },
    { id: "h2", x: 1380, y: 620, width: 120, height: 20, damage: 0.5, texture: "./assets/images/ui/spikes.png" },
    { id: "h3", x: 1900, y: 620, width: 130, height: 20, damage: 0.5, texture: "./assets/images/ui/spikes.png" },
    { id: "h4", x: 2450, y: 620, width: 130, height: 20, damage: 0.5, texture: "./assets/images/ui/spikes.png" },
    { id: "h5", x: 3050, y: 620, width: 130, height: 20, damage: 0.5, texture: "./assets/images/ui/spikes.png" },
    { id: "h6", x: 3650, y: 620, width: 130, height: 20, damage: 0.5, texture: "./assets/images/ui/spikes.png" },
    { id: "h7", x: 4250, y: 620, width: 130, height: 20, damage: 0.5, texture: "./assets/images/ui/spikes.png" }
  ],
  enemies: [
    { id: "e4-1", type: "enemy1", spawn: { x: 700, y: 544 }, patrol: { mode: "pingPong", points: [{ x: 700, y: 544 }, { x: 980, y: 544 }] } },
    { id: "e4-2", type: "enemy2", spawn: { x: 1250, y: 544 }, patrol: { mode: "pingPong", points: [{ x: 1250, y: 544 }, { x: 1520, y: 544 }] } },
    { id: "e4-3", type: "enemy3", spawn: { x: 1800, y: 544 }, patrol: { mode: "pingPong", points: [{ x: 1800, y: 544 }, { x: 2080, y: 544 }] } },
    { id: "e4-4", type: "enemy1", spawn: { x: 2350, y: 544 }, patrol: { mode: "pingPong", points: [{ x: 2350, y: 544 }, { x: 2640, y: 544 }] } },
    { id: "e4-5", type: "enemy2", spawn: { x: 2950, y: 544 }, patrol: { mode: "pingPong", points: [{ x: 2950, y: 544 }, { x: 3250, y: 544 }] } },
    { id: "e4-6", type: "enemy3", spawn: { x: 3550, y: 544 }, patrol: { mode: "pingPong", points: [{ x: 3550, y: 544 }, { x: 3850, y: 544 }] } }
  ],
  exit: { x: 4860, y: 0, width: 80, height: 720 }
};