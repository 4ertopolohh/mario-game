import { Logger } from "../utils/Logger.js";
import { GAME_CONFIG } from "../config/game.config.js";

export class AudioManager {
  constructor(resourceManager) {
    this.rm = resourceManager;
    this.unlocked = false;
    this.enabled = true;

    /**
     * Централизованный коэффициент усиления character SFX.
     * HTMLAudioElement.volume жёстко ограничен 1.0, поэтому реальное
     * усиление делается через Web Audio GainNode.
     */
    this.sfxGain = (GAME_CONFIG.audio && typeof GAME_CONFIG.audio.sfxGain === "number")
      ? GAME_CONFIG.audio.sfxGain
      : 1.0;

    /**
     * Централизованная громкость фоновой музыки.
     * Раньше была захардкожена внутри _startMusicNode; вынесена в config,
     * чтобы SFX и музыка микшировались через единый источник истины.
     */
    this.musicVolume = (GAME_CONFIG.audio && typeof GAME_CONFIG.audio.musicVolume === "number")
      ? GAME_CONFIG.audio.musicVolume
      : 0.5;

    /**
     * Единственный AudioContext на весь AudioManager. Создаётся лениво,
     * переиспользуется для всех one-shot SFX. Музыка через него не идёт.
     */
    this._audioContext = null;

    this._currentMusic = null;
    this._currentMusicPath = null;
    this._currentMusicScope = null;
    // Флаг синхронного старта: пока play() не resolved/rejected,
    // повторные запросы на тот же трек игнорируются.
    this._musicStarting = false;
    this._musicNodes = new Set();
  }

  /**
   * Ленивое создание единственного AudioContext.
   * Возвращает null, если Web Audio недоступен.
   * @returns {AudioContext|null}
   */
  _ensureAudioContext() {
    if (this._audioContext) return this._audioContext;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      this._audioContext = new Ctx();
    } catch (e) {
      Logger.warn("AudioContext unavailable:", e);
      this._audioContext = null;
    }
    return this._audioContext;
  }

  /**
   * Пытается вывести контекст из suspended. Ошибки (autoplay-политика)
   * молча игнорируются — вызывающий код не должен от них зависеть.
   */
  _tryResumeAudioContext() {
    const ctx = this._audioContext;
    if (!ctx) return;
    if (ctx.state === "suspended") {
      const p = ctx.resume();
      if (p && typeof p.catch === "function") p.catch(() => {});
    }
  }

  markUnlocked() {
    this.unlocked = true;
    // Готовим Web Audio к воспроизведению усиленных SFX.
    this._ensureAudioContext();
    this._tryResumeAudioContext();
    // Autoplay мог быть заблокирован на старте — если трек запрошен,
    // но реально не играет и не стартует сейчас, повторяем попытку.
    if (this._currentMusicPath && !this._currentMusic && !this._musicStarting) {
      this._attemptStartMusic(this._currentMusicPath);
    }
  }

  // ============ ONE-SHOT SOUNDS ============

  /**
   * Воспроизведение one-shot character SFX с усилением через Web Audio.
   *
   * Возвращаемое значение используется вызывающей стороной для корректного
   * lifecycle-менеджмента одноразовых звуков (например, Friend spawn sound):
   *   true  — база найдена, клон создан, node.play() инициирован;
   *   false — путь пуст, звук отключён, либо база ещё не загружена
   *           (Promise в кэше) / отсутствует (asset failed).
   * Не-void return value — расширение публичного контракта, старые вызовы
   * продолжают работать, игнорируя возврат.
   *
   * @param {string} path
   * @returns {boolean}
   */
  play(path) {
    if (!path || !this.enabled) return false;
    const base = this.rm.getAudio(path);
    if (!base) return false;

    try {
      const node = base.cloneNode();

      const ctx = this._ensureAudioContext();
      let cleanup = null;

      if (ctx) {
        this._tryResumeAudioContext();
        let routed = false;
        try {
          const source = ctx.createMediaElementSource(node);
          const gain = ctx.createGain();
          gain.gain.value = this.sfxGain;
          source.connect(gain);
          gain.connect(ctx.destination);

          let cleaned = false;
          cleanup = () => {
            if (cleaned) return;
            cleaned = true;
            try { source.disconnect(); } catch { /* ignore */ }
            try { gain.disconnect(); } catch { /* ignore */ }
          };
          node.addEventListener("ended", cleanup, { once: true });
          routed = true;
        } catch (e) {
          Logger.warn("SFX Web Audio routing failed, falling back to volume 1.0:", e);
          routed = false;
        }
        if (!routed) {
          node.volume = 1.0;
          cleanup = null;
        }
      } else {
        // Web Audio недоступен — сохраняем прежнее поведение.
        node.volume = 1.0;
      }

      const p = node.play();
      if (p && typeof p.catch === "function") {
        p.catch(() => {
          // Autoplay отклонён — граф не будет очищен через "ended".
          if (cleanup) cleanup();
        });
      }
      return true;
    } catch (e) {
      Logger.warn("Audio play failed:", e);
      return false;
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
      node.volume = this.musicVolume;
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