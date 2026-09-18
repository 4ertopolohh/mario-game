import { SURFACE_THEMES, DEFAULT_SURFACE_THEME } from "../config/surface-themes.config.js";

/**
 * Детерминированный PRNG (LCG) на основе seed'а.
 * Используется в генераторе тайлов, чтобы текстура не мерцала между кадрами.
 */
function createSeededRng(seed) {
  let state = seed >>> 0;
  if (state === 0) state = 1;
  return function () {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Генератор и кэш процедурных pixel-art поверхностей.
 * Тайлы генерируются один раз на тему и переиспользуются через CanvasPattern.
 * Pattern в мировых координатах — не мерцает при движении камеры
 * (anchored в world origin, а не в viewport).
 */
export class SurfaceTextureFactory {
  constructor() {
    this._tiles = new Map();
    // ctx -> Map(themeId -> CanvasPattern). WeakMap — ctx живёт с canvas.
    this._patterns = new WeakMap();
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {string} themeId — semantic id темы ("hospital", "school", ...)
   * @param {{x:number,y:number,width:number,height:number}} rect
   * @param {"ground"|"platform"} kind
   */
  drawSurface(ctx, themeId, rect, kind) {
    const theme = SURFACE_THEMES[themeId] || SURFACE_THEMES[DEFAULT_SURFACE_THEME];
    if (!theme) return;

    const x = Math.round(rect.x);
    const y = Math.round(rect.y);
    const w = Math.round(rect.width);
    const h = Math.round(rect.height);
    if (w <= 0 || h <= 0) return;

    const pattern = this._getPattern(ctx, theme, themeId);

    // imageSmoothingEnabled=false только на время заливки pattern,
    // чтобы избежать размытия при scaling'е во время camera zoom.
    const prevSmoothing = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = pattern;
    ctx.fillRect(x, y, w, h);
    ctx.imageSmoothingEnabled = prevSmoothing;

    this._drawBorder(ctx, theme, x, y, w, h, kind);
  }

  _getPattern(ctx, theme, themeId) {
    let map = this._patterns.get(ctx);
    if (!map) {
      map = new Map();
      this._patterns.set(ctx, map);
    }
    let pattern = map.get(themeId);
    if (pattern) return pattern;
    const tile = this._getTile(theme, themeId);
    pattern = ctx.createPattern(tile, "repeat");
    map.set(themeId, pattern);
    return pattern;
  }

  _getTile(theme, themeId) {
    let tile = this._tiles.get(themeId);
    if (tile) return tile;
    tile = this._generateTile(theme, themeId);
    this._tiles.set(themeId, tile);
    return tile;
  }

  _generateTile(theme, themeId) {
    const size = theme.tileSize || 16;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;

    const rng = createSeededRng(hashString(themeId));
    const p = theme.palette;

    ctx.fillStyle = p.base;
    ctx.fillRect(0, 0, size, size);

    switch (theme.pattern) {
      case "tile":     this._genTile(ctx, size, p, rng);     break;
      case "plank":    this._genPlank(ctx, size, p, rng);    break;
      case "concrete": this._genConcrete(ctx, size, p, rng); break;
      case "wornWood": this._genWornWood(ctx, size, p, rng); break;
      case "parquet":  this._genParquet(ctx, size, p, rng);  break;
      default:         this._genConcrete(ctx, size, p, rng); break;
    }

    return canvas;
  }

  // --- Паттерн: больничная плитка (4x4 клетки на 16px тайл) ---
  _genTile(ctx, size, p, rng) {
    const cell = 4;
    for (let y = 0; y < size; y += cell) {
      for (let x = 0; x < size; x += cell) {
        if (rng() < 0.28) {
          ctx.fillStyle = p.baseAlt;
          ctx.fillRect(x, y, cell, cell);
        }
      }
    }
    ctx.fillStyle = p.seam;
    for (let y = cell; y < size; y += cell) {
      ctx.fillRect(0, y, size, 1);
    }
    for (let x = cell; x < size; x += cell) {
      ctx.fillRect(x, 0, 1, size);
    }
    ctx.fillStyle = p.highlight;
    for (let i = 0; i < 5; i++) {
      const x = Math.floor(rng() * size);
      const y = Math.floor(rng() * size);
      ctx.fillRect(x, y, 1, 1);
    }
  }

  // --- Паттерн: горизонтальные доски/линолеум ---
  _genPlank(ctx, size, p, rng) {
    const plankH = 4;
    for (let y = 0; y < size; y += plankH) {
      const alt = ((y / plankH) % 2) === 0;
      ctx.fillStyle = alt ? p.base : p.baseAlt;
      ctx.fillRect(0, y, size, plankH);
      ctx.fillStyle = p.seam;
      ctx.fillRect(0, y, size, 1);
      ctx.fillStyle = p.highlight;
      ctx.fillRect(0, y + 1, size, 1);
      if (rng() < 0.5) {
        const kx = Math.floor(rng() * (size - 3));
        ctx.fillStyle = p.detail;
        ctx.fillRect(kx, y + 2, 2, 1);
      }
    }
  }

  // --- Паттерн: бетон / асфальт (pixel-noise + редкие агрегаты) ---
  _genConcrete(ctx, size, p, rng) {
    for (let i = 0; i < 34; i++) {
      const x = Math.floor(rng() * size);
      const y = Math.floor(rng() * size);
      ctx.fillStyle = rng() < 0.5 ? p.baseAlt : p.detail;
      ctx.fillRect(x, y, 1, 1);
    }
    for (let i = 0; i < 6; i++) {
      const x = Math.floor(rng() * (size - 2));
      const y = Math.floor(rng() * (size - 2));
      ctx.fillStyle = p.detail;
      ctx.fillRect(x, y, 2, 1);
    }
    ctx.fillStyle = p.highlight;
    for (let i = 0; i < 4; i++) {
      const x = Math.floor(rng() * size);
      const y = Math.floor(rng() * size);
      ctx.fillRect(x, y, 1, 1);
    }
  }

  // --- Паттерн: старое общажное дерево с потёртостями ---
  _genWornWood(ctx, size, p, rng) {
    const plankH = 5;
    for (let y = 0; y < size; y += plankH) {
      const alt = ((y / plankH) % 2) === 0;
      ctx.fillStyle = alt ? p.base : p.baseAlt;
      ctx.fillRect(0, y, size, plankH);
      ctx.fillStyle = p.seam;
      ctx.fillRect(0, y, size, 1);
      const marks = Math.floor(rng() * 3);
      for (let m = 0; m < marks; m++) {
        const mx = Math.floor(rng() * (size - 3));
        const my = y + 1 + Math.floor(rng() * Math.max(1, plankH - 2));
        ctx.fillStyle = rng() < 0.5 ? p.detail : p.highlight;
        ctx.fillRect(mx, my, 2, 1);
      }
    }
    ctx.fillStyle = p.detail;
    for (let i = 0; i < 5; i++) {
      const x = Math.floor(rng() * size);
      const y = Math.floor(rng() * size);
      ctx.fillRect(x, y, 1, 1);
    }
  }

  // --- Паттерн: домашний паркет (шахматные блоки с seam'ами) ---
  _genParquet(ctx, size, p, rng) {
    const block = 4;
    for (let y = 0; y < size; y += block) {
      for (let x = 0; x < size; x += block) {
        const alt = (((x / block) + (y / block)) % 2) === 0;
        ctx.fillStyle = alt ? p.base : p.baseAlt;
        ctx.fillRect(x, y, block, block);
        ctx.fillStyle = p.seam;
        ctx.fillRect(x, y, block, 1);
        ctx.fillRect(x, y, 1, block);
      }
    }
    ctx.fillStyle = p.highlight;
    for (let i = 0; i < 6; i++) {
      const x = Math.floor(rng() * size);
      const y = Math.floor(rng() * size);
      ctx.fillRect(x, y, 1, 1);
    }
  }

  /**
   * Границы не повторяются как pattern — рисуются поверх заливки.
   * Ground: только верхняя сторона.
   * Platform: все четыре стороны, различающиеся по светлоте.
   */
  _drawBorder(ctx, theme, x, y, w, h, kind) {
    const border = kind === "ground" ? theme.groundBorder : theme.platformBorder;
    if (!border) return;

    if (kind === "ground") {
      const t = Math.max(1, border.top | 0);
      if (border.topShadow) {
        ctx.fillStyle = border.topShadow;
        ctx.fillRect(x, y + t, w, 1);
      }
      ctx.fillStyle = border.topColor;
      ctx.fillRect(x, y, w, t);
    } else {
      const t = Math.max(1, border.thickness | 0);
      const innerH = h - 2 * t;
      // Верх — самый светлый.
      ctx.fillStyle = border.top;
      ctx.fillRect(x, y, w, t);
      // Бока.
      ctx.fillStyle = border.side;
      if (innerH > 0) {
        ctx.fillRect(x, y + t, t, innerH);
        ctx.fillRect(x + w - t, y + t, t, innerH);
      }
      // Низ — самый тёмный.
      ctx.fillStyle = border.bottom;
      ctx.fillRect(x, y + h - t, w, t);
    }
  }

  clear() {
    this._tiles.clear();
    this._patterns = new WeakMap();
  }
}