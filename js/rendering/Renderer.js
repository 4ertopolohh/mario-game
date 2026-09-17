import { GAME_CONFIG } from "../config/game.config.js";

export class Renderer {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {import("./Camera.js").Camera} camera
   * @param {import("../managers/ResourceManager.js").ResourceManager} [resourceManager]
   */
  constructor(canvas, camera, resourceManager = null) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.camera = camera;
    this.resourceManager = resourceManager;
    this.physicalScale = 1;
    this.visibleWorldWidth = 1280;
    this.visibleWorldHeight = 720;
    this.dpr = 1;
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    this.dpr = dpr;
    const cssW = this.canvas.clientWidth || window.innerWidth;
    const cssH = this.canvas.clientHeight || window.innerHeight;
    const W = Math.max(1, Math.round(cssW * dpr));
    const H = Math.max(1, Math.round(cssH * dpr));
    if (this.canvas.width !== W) this.canvas.width = W;
    if (this.canvas.height !== H) this.canvas.height = H;
    const zoom = GAME_CONFIG.viewport.zoom || 1;
    this.physicalScale = (H / GAME_CONFIG.viewport.referenceHeight) * zoom;
    this.visibleWorldWidth = W / this.physicalScale;
    this.visibleWorldHeight = H / this.physicalScale;
    this.camera.setViewport(this.visibleWorldWidth, this.visibleWorldHeight);
  }

  beginFrame() {
    const ctx = this.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    const s = this.physicalScale;
    ctx.setTransform(s, 0, 0, s, -this.camera.x * s, -this.camera.y * s);
  }

  endFrame() {
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  /**
   * Пропорциональный "cover": сохраняет aspect ratio, центрирует, кропает лишнее.
   * Используется для всех level-текстур (background/ground/platform).
   */
  _drawCover(img, dx, dy, dw, dh) {
    if (!img || !img.width || !img.height || dw <= 0 || dh <= 0) return;
    const imgRatio = img.width / img.height;
    const rectRatio = dw / dh;
    let sx, sy, sw, sh;
    if (imgRatio > rectRatio) {
      sh = img.height;
      sw = sh * rectRatio;
      sx = (img.width - sw) / 2;
      sy = 0;
    } else {
      sw = img.width;
      sh = sw / rectRatio;
      sx = 0;
      sy = (img.height - sh) / 2;
    }
    this.ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
  }

  _getImage(path) {
    if (!path || !this.resourceManager) return null;
    return this.resourceManager.getImage(path);
  }

  drawBackground(level) {
    const ctx = this.ctx;
    const camX = this.camera.x;
    const camY = this.camera.y;
    const vw = this.visibleWorldWidth;
    const vh = this.visibleWorldHeight;

    const visuals = level && level.visuals;
    const bgPath = visuals && visuals.background && visuals.background.texture;
    const bgImg = this._getImage(bgPath);
    if (bgImg) {
      this._drawCover(bgImg, camX, camY, vw, vh);
      return;
    }

    // Fallback: gradient sky + distant hills
    const grad = ctx.createLinearGradient(0, camY, 0, camY + vh);
    grad.addColorStop(0, "#3a6ea5");
    grad.addColorStop(1, "#88b0d0");
    ctx.fillStyle = grad;
    ctx.fillRect(camX, camY, vw, vh);
    ctx.fillStyle = "#2c4d66";
    const baseY = camY + vh - 80;
    const step = 240;
    const startX = Math.floor(camX / step) * step - step;
    for (let x = startX; x < camX + vw + step; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, baseY + 80);
      ctx.lineTo(x + step / 2, baseY - 60);
      ctx.lineTo(x + step, baseY + 80);
      ctx.closePath();
      ctx.fill();
    }
  }

  /**
   * Полупрозрачное затемнение ТОЛЬКО фонового слоя (viewport-область).
   * Вызывается между drawBackground и fireworks/platforms.
   */
  drawBackgroundDim() {
    const ctx = this.ctx;
    const alpha = GAME_CONFIG.visuals.finaleBackgroundDim;
    ctx.save();
    ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
    ctx.fillRect(
      this.camera.x,
      this.camera.y,
      this.visibleWorldWidth,
      this.visibleWorldHeight
    );
    ctx.restore();
  }

  drawPlatforms(level) {
    const ctx = this.ctx;
    const visuals = level && level.visuals;
    const groundImg = this._getImage(visuals && visuals.ground && visuals.ground.texture);
    const platformImg = this._getImage(visuals && visuals.platform && visuals.platform.texture);

    for (const p of level.platforms) {
      const isGround = p.type === "solid" && p.id === "ground";
      const img = isGround ? groundImg : platformImg;

      if (img) {
        this._drawCover(img, p.x, p.y, p.width, p.height);
        continue;
      }

      // Fallback
      if (p.type === "solid") {
        ctx.fillStyle = "#5a4632";
        ctx.fillRect(p.x, p.y, p.width, p.height);
        ctx.fillStyle = "#7d6247";
        ctx.fillRect(p.x, p.y, p.width, Math.min(8, p.height));
      } else {
        ctx.fillStyle = "#8a6a44";
        ctx.fillRect(p.x, p.y, p.width, p.height);
        ctx.fillStyle = "#c39a68";
        ctx.fillRect(p.x, p.y, p.width, Math.min(4, p.height));
      }
    }
  }

  drawObstacles(level) {
    if (!level.obstacles) return;
    const ctx = this.ctx;
    for (const o of level.obstacles) {
      ctx.fillStyle = "#4d3b2a";
      ctx.fillRect(o.x, o.y, o.width, o.height);
      ctx.strokeStyle = "#2c2117";
      ctx.lineWidth = 2;
      ctx.strokeRect(o.x + 1, o.y + 1, o.width - 2, o.height - 2);
    }
  }

  drawHazards(level) {
    if (!level.hazards) return;
    const ctx = this.ctx;
    for (const h of level.hazards) {
      const img = h.texture && this.resourceManager
        ? this.resourceManager.getImage(h.texture)
        : null;
      if (img) {
        ctx.drawImage(img, h.x, h.y, h.width, h.height);
        continue;
      }
      ctx.fillStyle = "#c0392b";
      ctx.fillRect(h.x, h.y, h.width, h.height);
      ctx.fillStyle = "#e74c3c";
      const teeth = Math.floor(h.width / 12);
      for (let i = 0; i < teeth; i++) {
        ctx.beginPath();
        ctx.moveTo(h.x + i * 12, h.y);
        ctx.lineTo(h.x + i * 12 + 6, h.y - 6);
        ctx.lineTo(h.x + i * 12 + 12, h.y);
        ctx.closePath();
        ctx.fill();
      }
    }
  }

  drawExit(level, debug = false) {
    if (!debug) return;
    const ctx = this.ctx;
    const e = level.exit;
    if (!e) return;
    ctx.strokeStyle = "#00ff00";
    ctx.lineWidth = 2;
    ctx.strokeRect(e.x, e.y, e.width, e.height);
  }

  drawEntities(entities) {
    for (const e of entities) {
      if (!e.alive) continue;
      e.render(this.ctx);
    }
    for (const e of entities) {
      if (!e.alive) continue;
      if (typeof e.renderNickname === "function") e.renderNickname(this.ctx);
    }
  }

  drawWorldBounds(level) {
    const ctx = this.ctx;
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, level.world.width, level.world.height);
  }

  drawDebug(camera, entities, level) {
    const ctx = this.ctx;
    ctx.strokeStyle = "#00ff00";
    ctx.lineWidth = 1;
    for (const e of entities) {
      if (!e.alive) continue;
      ctx.strokeRect(e.x, e.y, e.width, e.height);
    }
    ctx.strokeStyle = "#ff00ff";
    ctx.strokeRect(camera.x, camera.y, camera.viewportWidth, camera.viewportHeight);
  }
}