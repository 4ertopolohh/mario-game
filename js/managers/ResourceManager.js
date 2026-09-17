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

    const cached = this.images.get(path);

    if (cached) {
      return cached instanceof Promise
        ? cached
        : Promise.resolve(cached);
    }

    const p = new Promise((resolve) => {
      const img = new Image();

      img.onload = () => {
        this.images.set(path, img);
        resolve(img);
      };

      img.onerror = () => {
        this.images.delete(path);
        Logger.warn(`Image failed: ${path}`);
        this.eventBus.emit(GameEvents.ASSET_FAILED, {
          type: "image",
          path
        });
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

    const value = this.images.get(path);

    if (!value || value instanceof Promise) {
      return null;
    }

    return value;
  }

  loadImages(paths) {
    const unique = [...new Set(paths.filter(Boolean))];
    return Promise.all(unique.map((path) => this.loadImage(path)));
  }

  loadAudio(path) {
    if (!path) return Promise.resolve(null);

    const cached = this.audio.get(path);

    if (cached) {
      return cached instanceof Promise
        ? cached
        : Promise.resolve(cached);
    }

    const p = new Promise((resolve) => {
      let resolved = false;

      const done = (result) => {
        if (resolved) return;
        resolved = true;

        if (result) {
          this.audio.set(path, result);
          resolve(result);
          return;
        }

        this.audio.delete(path);
        Logger.warn(`Audio failed: ${path}`);
        this.eventBus.emit(GameEvents.ASSET_FAILED, {
          type: "audio",
          path
        });
        resolve(null);
      };

      try {
        const audio = new Audio();

        audio.preload = "auto";

        audio.addEventListener(
          "canplaythrough",
          () => done(audio),
          { once: true }
        );

        audio.addEventListener(
          "error",
          () => done(null),
          { once: true }
        );

        audio.src = path;

        setTimeout(() => {
          if (resolved) return;

          if (audio.readyState >= 2) {
            done(audio);
          } else {
            done(null);
          }
        }, 4000);
      } catch (error) {
        Logger.warn("Audio construct failed", error);
        done(null);
      }
    });

    this.audio.set(path, p);
    return p;
  }

  /** @returns {HTMLAudioElement|null} sync access to loaded audio */
  getAudio(path) {
    if (!path) return null;

    const value = this.audio.get(path);

    if (!value || value instanceof Promise) {
      return null;
    }

    return value;
  }

  loadAudios(paths) {
    const unique = [...new Set(paths.filter(Boolean))];
    return Promise.all(unique.map((path) => this.loadAudio(path)));
  }

  clear() {
    this.images.clear();
    this.audio.clear();
  }
}