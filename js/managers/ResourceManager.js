import { Logger } from "../utils/Logger.js";
import { GameEvents } from "../core/EventBus.js";

export class ResourceManager {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.images = new Map();
    this.audio = new Map();
  }

  loadImage(path) {
    if (!path) return Promise.resolve(null);
    if (this.images.has(path)) return this.images.get(path);
    const p = new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => {
        Logger.warn(`Image failed: ${path}`);
        this.eventBus.emit(GameEvents.ASSET_FAILED, { type: "image", path });
        resolve(null);
      };
      img.src = path;
    });
    this.images.set(path, p);
    return p;
  }

  /** @returns {HTMLImageElement|null} sync access to loaded image */
  getImage(path) {
    if (!path) return null;
    const v = this.images.get(path);
    return v instanceof Promise ? null : v;
  }

  loadImages(paths) {
    const unique = [...new Set(paths.filter(Boolean))];
    return Promise.all(unique.map(p => this.loadImage(p)));
  }

  loadAudio(path) {
    if (!path) return Promise.resolve(null);
    if (this.audio.has(path)) return this.audio.get(path);
    const p = new Promise((resolve) => {
      let resolved = false;
      const done = (result) => {
        if (resolved) return;
        resolved = true;
        if (result) resolve(result);
        else {
          Logger.warn(`Audio failed: ${path}`);
          this.eventBus.emit(GameEvents.ASSET_FAILED, { type: "audio", path });
          resolve(null);
        }
      };
      try {
        const audio = new Audio();
        audio.preload = "auto";
        audio.addEventListener("canplaythrough", () => done(audio), { once: true });
        audio.addEventListener("error", () => done(null), { once: true });
        audio.src = path;
        // Fallback timeout
        setTimeout(() => {
          if (!resolved) {
            if (audio.readyState >= 2) done(audio);
            else done(null);
          }
        }, 4000);
      } catch (e) {
        Logger.warn("Audio construct failed", e);
        done(null);
      }
    });
    this.audio.set(path, p);
    return p;
  }

  getAudio(path) {
    if (!path) return null;
    const v = this.audio.get(path);
    return v instanceof Promise ? null : v;
  }

  loadAudios(paths) {
    const unique = [...new Set(paths.filter(Boolean))];
    return Promise.all(unique.map(p => this.loadAudio(p)));
  }

  clear() {
    this.images.clear();
    this.audio.clear();
  }
}