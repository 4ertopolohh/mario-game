export const LEVEL_3 = {
  id: 3,
  music: "./assets/audio/level-3/Kai Angel, 9mice-LIPSTICK.mp3",
  visuals: {
    background: { texture: "./assets/images/ui/balasiha.jpeg" },
    ground: { texture: "./assets/images/ui/asphalt.png" },
    platform: { texture: "./assets/images/ui/asphalt.png" }
  },
  world: { width: 4400, height: 720 },
  playerSpawn: { x: 120, y: 500 },
  platforms: [
    { id: "ground", type: "solid", x: 0, y: 640, width: 4400, height: 80 },
    { id: "p1", type: "oneWay", x: 320, y: 500, width: 200, height: 24 },
    { id: "p2", type: "oneWay", x: 620, y: 400, width: 200, height: 24 },
    { id: "p3", type: "oneWay", x: 960, y: 480, width: 220, height: 24 },
    { id: "p4", type: "oneWay", x: 1320, y: 400, width: 220, height: 24 },
    { id: "p5", type: "oneWay", x: 1700, y: 500, width: 220, height: 24 },
    { id: "p6", type: "oneWay", x: 2080, y: 400, width: 220, height: 24 },
    { id: "p7", type: "oneWay", x: 2480, y: 480, width: 220, height: 24 },
    { id: "p8", type: "oneWay", x: 2880, y: 420, width: 220, height: 24 },
    { id: "p9", type: "oneWay", x: 3300, y: 500, width: 220, height: 24 },
    { id: "p10", type: "oneWay", x: 3720, y: 420, width: 220, height: 24 }
  ],
  obstacles: [
    { id: "o1", x: 520, y: 560, width: 40, height: 80 },
    { id: "o2", x: 1120, y: 520, width: 40, height: 120 },
    { id: "o3", x: 1620, y: 560, width: 40, height: 80 },
    { id: "o4", x: 2250, y: 520, width: 40, height: 120 },
    { id: "o5", x: 3050, y: 560, width: 40, height: 80 },
    { id: "o6", x: 3900, y: 520, width: 40, height: 120 }
  ],
  hazards: [
    { id: "h1", x: 850, y: 620, width: 130, height: 20, damage: 0.5, texture: "./assets/images/ui/spikes.png" },
    { id: "h2", x: 1450, y: 620, width: 130, height: 20, damage: 0.5, texture: "./assets/images/ui/spikes.png" },
    { id: "h3", x: 2050, y: 620, width: 140, height: 20, damage: 0.5, texture: "./assets/images/ui/spikes.png" },
    { id: "h4", x: 2650, y: 620, width: 140, height: 20, damage: 0.5, texture: "./assets/images/ui/spikes.png" },
    { id: "h5", x: 3300, y: 620, width: 140, height: 20, damage: 0.5, texture: "./assets/images/ui/spikes.png" }
  ],
  enemies: [
    { id: "e3-1", type: "enemy1", spawn: { x: 720, y: 544 }, patrol: { mode: "pingPong", points: [{ x: 720, y: 544 }, { x: 1050, y: 544 }] } },
    { id: "e3-2", type: "enemy2", spawn: { x: 1300, y: 544 }, patrol: { mode: "pingPong", points: [{ x: 1300, y: 544 }, { x: 1600, y: 544 }] } },
    // Enemy Type 3 запрещён на Level 3. Пул равновероятно даёт enemy1/enemy2.
    { id: "e3-3", type: ["enemy1", "enemy2"], spawn: { x: 1900, y: 544 }, patrol: { mode: "pingPong", points: [{ x: 1900, y: 544 }, { x: 2200, y: 544 }] } },
    { id: "e3-4", type: "enemy1", spawn: { x: 2450, y: 544 }, patrol: { mode: "pingPong", points: [{ x: 2450, y: 544 }, { x: 2750, y: 544 }] } },
    { id: "e3-5", type: "enemy2", spawn: { x: 3100, y: 544 }, patrol: { mode: "pingPong", points: [{ x: 3100, y: 544 }, { x: 3400, y: 544 }] } }
  ],
  exit: { x: 4260, y: 0, width: 80, height: 720 }
};