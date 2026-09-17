export class Camera {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.viewportWidth = 1280;
    this.viewportHeight = 720;
    this.worldWidth = 3200;
    this.worldHeight = 720;
  }

  setViewport(w, h) { this.viewportWidth = w; this.viewportHeight = h; }
  setWorldBounds(w, h) { this.worldWidth = w; this.worldHeight = h; }

  follow(target) {
    const tcx = target.x + target.width / 2;
    const tcy = target.y + target.height / 2;
    let cx = tcx - this.viewportWidth / 2;
    let cy = tcy - this.viewportHeight / 2;
    const maxX = Math.max(0, this.worldWidth - this.viewportWidth);
    const maxY = Math.max(0, this.worldHeight - this.viewportHeight);
    if (cx < 0) cx = 0; else if (cx > maxX) cx = maxX;
    if (cy < 0) cy = 0; else if (cy > maxY) cy = maxY;
    this.x = cx;
    this.y = cy;
  }

  isVisible(rect) {
    return rect.x + rect.width > this.x &&
           rect.x < this.x + this.viewportWidth &&
           rect.y + rect.height > this.y &&
           rect.y < this.y + this.viewportHeight;
  }

  isCenterVisible(entity) {
    const cx = entity.x + entity.width / 2;
    const cy = entity.y + entity.height / 2;
    return cx >= this.x && cx <= this.x + this.viewportWidth &&
           cy >= this.y && cy <= this.y + this.viewportHeight;
  }
}