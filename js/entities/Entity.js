export class Entity {
  /**
   * @param {object} config
   */
  constructor(config = {}) {
    this.id = config.id || `entity-${Entity._nextId++}`;
    this.type = config.type || "entity";
    this.x = 0; this.y = 0;
    this.vx = 0; this.vy = 0;
    this.width = 0; this.height = 0;
    this.alive = true;
    this.applyGravity = false;
    this.prevX = 0; this.prevY = 0;
    this.hitWallX = false;
  }
  get rect() { return { x: this.x, y: this.y, width: this.width, height: this.height }; }
  update(_dt) {}
  render(_ctx) {}
  destroy() { this.alive = false; }
}
Entity._nextId = 1;