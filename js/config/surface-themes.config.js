/**
 * Конфигурация процедурных pixel-art тем для ground / one-way платформ.
 * Каждая тема описывает: размер тайла, тип рисунка, палитру и параметры
 * border'ов. Renderer читает theme по semantic id из level.surfaceTheme
 * и не содержит ветвлений if(level.id === N).
 */

export const SURFACE_THEMES = Object.freeze({
  // Level 1 — стерильная больничная плитка.
  hospital: {
    tileSize: 16,
    pattern: "tile",
    palette: {
      base: "#e8eef2",
      baseAlt: "#dde5ea",
      seam: "#b6c2ca",
      highlight: "#f6f9fb",
      detail: "#a4b0b8"
    },
    groundBorder: { top: 3, topColor: "#ffffff", topShadow: "#c2ccd4" },
    platformBorder: { thickness: 2, top: "#ffffff", side: "#c8d2da", bottom: "#889298" }
  },

  // Level 2 — тёплый школьный паркет/линолеум.
  school: {
    tileSize: 16,
    pattern: "plank",
    palette: {
      base: "#c49a68",
      baseAlt: "#b78e5c",
      seam: "#7a5836",
      highlight: "#d6ac78",
      detail: "#8e6a44"
    },
    groundBorder: { top: 3, topColor: "#e0ba88", topShadow: "#7a5836" },
    platformBorder: { thickness: 2, top: "#e0ba88", side: "#a07848", bottom: "#5a3e20" }
  },

  // Level 3 — городской бетон/асфальт.
  city: {
    tileSize: 16,
    pattern: "concrete",
    palette: {
      base: "#6e6e72",
      baseAlt: "#606064",
      seam: "#3c3c40",
      highlight: "#8a8a8e",
      detail: "#4a4a4e"
    },
    groundBorder: { top: 3, topColor: "#9a9a9e", topShadow: "#3c3c40" },
    platformBorder: { thickness: 2, top: "#9a9a9e", side: "#5a5a5e", bottom: "#2a2a2e" }
  },

  // Level 4 — старое общажное дерево, тёмное и потёртое.
  oldDorm: {
    tileSize: 16,
    pattern: "wornWood",
    palette: {
      base: "#8a6a48",
      baseAlt: "#7a5a3a",
      seam: "#4a3218",
      highlight: "#a68258",
      detail: "#5a4028"
    },
    groundBorder: { top: 3, topColor: "#a68258", topShadow: "#4a3218" },
    platformBorder: { thickness: 2, top: "#a68258", side: "#7a5a3a", bottom: "#3a2610" }
  },

  // Level 5 — уютный домашний паркет/ламинат.
  apartment: {
    tileSize: 16,
    pattern: "parquet",
    palette: {
      base: "#c99e6a",
      baseAlt: "#bd9159",
      seam: "#8a6a40",
      highlight: "#ddb884",
      detail: "#a07848"
    },
    groundBorder: { top: 3, topColor: "#e0c08c", topShadow: "#8a6a40" },
    platformBorder: { thickness: 2, top: "#e0c08c", side: "#b08858", bottom: "#6a4a28" }
  }
});

export const DEFAULT_SURFACE_THEME = "hospital";