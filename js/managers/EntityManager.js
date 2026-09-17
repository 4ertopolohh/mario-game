export class EntityManager {
  constructor() {
    this.entities = [];
    this._toRemove = new Set();
  }

  add(entity) {
    this.entities.push(entity);
    return entity;
  }

  remove(entity) {
    this._toRemove.add(entity);
    entity.alive = false;
  }

  flushRemovals() {
    if (this._toRemove.size === 0) {
      // also purge anything that set alive=false
      for (let i = this.entities.length - 1; i >= 0; i--) {
        if (!this.entities[i].alive) this.entities.splice(i, 1);
      }
      return;
    }
    this.entities = this.entities.filter(e => !this._toRemove.has(e) && e.alive);
    this._toRemove.clear();
  }

  update(dt, ctx) {
    for (const e of this.entities) {
      if (!e.alive) continue;
      e.update(dt, ctx);
    }
  }

  getByType(type) {
    return this.entities.filter(e => e.alive && e.type === type);
  }

  clear() {
    this.entities = [];
    this._toRemove.clear();
  }
}