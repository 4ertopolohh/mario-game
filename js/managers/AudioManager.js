import { Logger } from "../utils/Logger.js";

export class AudioManager {
  constructor(resourceManager) {
    this.rm = resourceManager;
    this.unlocked = false;
    this.enabled = true;
    this._currentMusic = null;
    this._currentMusicPath = null;
    this._currentMusicScope = null;
    this._musicNodes = new Set();
  }

  markUnlocked() {
    this.unlocked = true;
    // Если музыка была запрошена, но браузер заблокировал play() — попробуем снова.
    if (this._currentMusicPath && !this._currentMusic) {
      this._startMusicNode(this._currentMusicPath);
    }
  }

  // ============ ONE-SHOT SOUNDS ============
  play(path) {
    if (!path || !this.enabled) return;
    const base = this.rm.getAudio(path);
    if (!base) return;
    try {
      const node = base.cloneNode();
      node.volume = 1.0;
      const p = node.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    } catch (e) {
      Logger.warn("Audio play failed:", e);
    }
  }

  // ============ MUSIC ============
  /**
   * Idempotent: если эта же музыка уже играет для того же уровня — не перезапускает.
   * При запросе другой — останавливает предыдущую.
   */
  ensureMusic(path, scope = null) {
    if (!path) return;
    if (this._currentMusicPath === path) return;
    this.playMusic(path, scope);
  }

  playMusic(path, scope = null) {
    if (!path || !this.enabled) return;

    // Уже играет эта же — no-op
    if (this._currentMusicPath === path && this._currentMusic && !this._currentMusic.paused) {
      return;
    }
    // Уже в процессе загрузки/подготовки этой же — повторим попытку
    if (this._currentMusicPath === path && !this._currentMusic) {
      this._attemptStartMusic(path);
      return;
    }

    this.stopMusic();
    this._currentMusicPath = path;
    this._currentMusicScope = scope;
    this._attemptStartMusic(path);
  }

  _attemptStartMusic(path) {
    const base = this.rm.getAudio(path);
    if (!base) {
      // Загружаем в фоне и потом стартуем
      this.rm.loadAudio(path).then((audio) => {
        if (!audio) return;
        if (this._currentMusicPath !== path) return;
        this._startMusicNode(path);
      }).catch(() => {});
      return;
    }
    this._startMusicNode(path);
  }

  _startMusicNode(path) {
    if (this._currentMusicPath !== path) return;
    if (this._currentMusic) return;
    const base = this.rm.getAudio(path);
    if (!base) return;
    try {
      const node = base.cloneNode();
      node.loop = true;
      node.volume = 0.6;
      this._currentMusic = node;
      this._musicNodes.add(node);
      const p = node.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
      node.addEventListener("ended", () => {
        this._musicNodes.delete(node);
        if (this._currentMusic === node) this._currentMusic = null;
      }, { once: true });
    } catch (e) {
      Logger.warn("Music play failed:", e);
    }
  }

  stopMusic() {
    if (this._currentMusic) {
      try { this._currentMusic.pause(); } catch { /* ignore */ }
      try { this._currentMusic.currentTime = 0; } catch { /* ignore */ }
      this._musicNodes.delete(this._currentMusic);
      this._currentMusic = null;
    }
    this._currentMusicPath = null;
    this._currentMusicScope = null;
  }

  getCurrentMusicPath() { return this._currentMusicPath; }
}