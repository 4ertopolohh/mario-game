import { Entity } from "./Entity.js";
import { GAME_CONFIG } from "../config/game.config.js";
import { truncateNickname } from "../utils/text.js";

export class Character extends Entity {
  constructor(config = {}) {
    super(config);
    this.nickname = config.nickname || "";
    this.appearance = config.appearance || {};
    this.size = config.size || { width: 64, height: 96 };
    this.width = this.size.width;
    this.height = this.size.height;
    this.maxHealth = (config.health && config.health.max) || 1;
    this.health = this.maxHealth;
    this.audio = config.audio || {};
    this.resourceManager = null;
    this.visibilityScheduled = false;
    this.visibilityTimerId = 0;
    this.visibilitySoundDelayMs = config.visibilitySoundDelayMs ?? 1000;
    this.facing = config.facing === -1 ? -1 : 1;
  }

  setResourceManager(rm) { this.resourceManager = rm; }

  getNicknameDisplay() {
    if (!this.nickname) return "";
    return truncateNickname(this.nickname, GAME_CONFIG.nickname.maxLength);
  }

  _getBaseHeadHeight() {
    return (this.appearance.head && this.appearance.head.height) || Math.round(this.height * 0.4);
  }

  _getHeadScale() {
    const s = this.appearance.headScale;
    return (typeof s === "number" && s > 0) ? s : 1;
  }

  /**
   * Визуальный top головы с учётом headScale.
   * Используется для позиционирования nickname над реальной визуальной
   * верхней границей головы, а не над hitbox. При headScale === 1
   * возвращает this.y (совпадает с прежним поведением).
   */
  getVisualHeadTop() {
    const headScale = this._getHeadScale();
    const baseHeadH = this._getBaseHeadHeight();
    if (headScale === 1) return this.y;
    const scaledHeadH = baseHeadH * headScale;
    const baseCenterY = this.y + baseHeadH / 2;
    return baseCenterY - scaledHeadH / 2;
  }

  _drawTexture(ctx, key, rect) {
    const path = this.appearance[key + "Texture"];
    const img = path && this.resourceManager ? this.resourceManager.getImage(path) : null;
    if (img) {
      ctx.drawImage(img, rect.x, rect.y, rect.width, rect.height);
      return;
    }
    ctx.fillStyle = key === "head" ? "#c08040" : "#4060c0";
    ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.strokeRect(rect.x + 1, rect.y + 1, rect.width - 2, rect.height - 2);
  }

  render(ctx) {
    const headScale = this._getHeadScale();
    const baseHeadH = this._getBaseHeadHeight();
    const bodyH = this.height - baseHeadH;
    const overlap = Math.round(bodyH * GAME_CONFIG.visuals.headBodyOverlap);

    // Визуальная голова масштабируется вокруг её естественного центра.
    // Hitbox (this.x/this.y/this.width/this.height) не меняется.
    const scaledHeadH = baseHeadH * headScale;
    const scaledHeadW = this.width * headScale;
    const baseCenterX = this.x + this.width / 2;
    const baseCenterY = this.y + baseHeadH / 2;
    const headRect = {
      x: baseCenterX - scaledHeadW / 2,
      y: baseCenterY - scaledHeadH / 2,
      width: scaledHeadW,
      height: scaledHeadH
    };

    const flip = this.facing < 0;
    if (flip) {
      ctx.save();
      const cx = this.x + this.width / 2;
      ctx.translate(cx, 0);
      ctx.scale(-1, 1);
      ctx.translate(-cx, 0);
    }

    // Body слегка уходит под голову — бесшовное соединение.
    this._drawTexture(ctx, "body", {
      x: this.x,
      y: this.y + baseHeadH - overlap,
      width: this.width,
      height: bodyH + overlap
    });
    // Head рисуется поверх body.
    this._drawTexture(ctx, "head", headRect);

    if (flip) ctx.restore();
  }

  renderNickname(ctx) {
    const text = this.getNicknameDisplay();
    if (!text) return;
    const visualTop = this.getVisualHeadTop();
    ctx.save();
    ctx.font = '12px "Press Start 2P", "Courier New", monospace';
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#000";
    ctx.fillStyle = "#fff";
    const cx = this.x + this.width / 2;
    const ty = visualTop - GAME_CONFIG.nickname.offsetY;
    ctx.strokeText(text, cx, ty);
    ctx.fillText(text, cx, ty);
    ctx.restore();
  }

  takeDamage(amount) {
    this.health = Math.max(0, this.health - amount);
    if (this.health <= 0) this.alive = false;
  }
}