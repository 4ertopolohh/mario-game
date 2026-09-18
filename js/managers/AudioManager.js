import { Logger } from "../utils/Logger.js";

export class AudioManager {
  constructor(resourceManager) {
    this.rm = resourceManager;
    this.unlocked = false;
    this.enabled = true;
    this._currentMusic = null;
    this._currentMusicPath = null;
    this._currentMusicScope = null;
    // Флаг синхронного старта: пока play() не resolved/rejected,
    // повторные запросы на тот же трек игнорируются.
    this._musicStarting = false;
    this._musicNodes = new Set();
  }

  markUnlocked() {
    this.unlocked = true;
    // Autoplay мог быть заблокирован на старте — если трек запрошен,
    // но реально не играет и не стартует сейчас, повторяем попытку.
    if (this._currentMusicPath && !this._currentMusic && !this._musicStarting) {
      this._attemptStartMusic(this._currentMusicPath);
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
  ensureMusic(path, scope = null) {
    this.playMusic(path, scope);
  }

  playMusic(path, scope = null) {
    if (!path || !this.enabled) return;

    if (this._currentMusicPath === path) {
      // Тот же трек. Если уже играет или стартует — no-op.
      if ((this._currentMusic && !this._currentMusic.paused) || this._musicStarting) {
        return;
      }
      // Иначе предыдущая попытка не удалась — повторяем.
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
      // Аудио ещё не загружено — грузим и стартуем, когда придёт.
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
    if (this._currentMusic && !this._currentMusic.paused) return;
    if (this._musicStarting) return;

    const base = this.rm.getAudio(path);
    if (!base) return;

    let node;
    try {
      node = base.cloneNode();
      node.loop = true;
      node.volume = 0.6;
    } catch (e) {
      Logger.warn("Music node creation failed:", e);
      return;
    }

    this._musicStarting = true;

    const onSuccess = () => {
      this._musicStarting = false;
      if (this._currentMusicPath !== path) {
        // Трек сменён, пока мы стартовали — глушим новый node.
        try { node.pause(); } catch { /* ignore */ }
        return;
      }
      if (this._currentMusic === node) return;
      if (this._currentMusic && this._currentMusic !== node) {
        try { this._currentMusic.pause(); } catch { /* ignore */ }
        this._musicNodes.delete(this._currentMusic);
      }
      this._currentMusic = node;
      this._musicNodes.add(node);
      node.addEventListener("ended", () => {
        this._musicNodes.delete(node);
        if (this._currentMusic === node) this._currentMusic = null;
      }, { once: true });
    };

    const onFail = () => {
      this._musicStarting = false;
      // Autoplay отклонён. Оставляем _currentMusic = null,
      // чтобы markUnlocked() мог корректно повторить запуск.
    };

    try {
      const result = node.play();
      if (result && typeof result.then === "function") {
        result.then(onSuccess).catch(onFail);
      } else {
        // Старые браузеры: play() без Promise — считаем, что старт начался.
        onSuccess();
      }
    } catch (e) {
      this._musicStarting = false;
      Logger.warn("Music play failed:", e);
    }
  }

  stopMusic() {
    this._musicStarting = false;
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