import { LEVEL_TITLES, LEVEL_INTRO_CONFIG } from "../config/level-titles.config.js";

/**
 * Показывает заставку нового уровня: main title + subtitle.
 * Полностью screen-space, DOM-оверлей.
 */
export class LevelIntroController {
  /**
   * @param {import("../core/TimerManager.js").TimerManager} timerManager
   */
  constructor(timerManager) {
    this.timerManager = timerManager;
    this.el = document.getElementById("level-intro");
    this.titleEl = document.getElementById("level-intro-title");
    this.subtitleEl = document.getElementById("level-intro-subtitle");
    this._active = false;
    this._scope = "levelIntro";
    if (this.el) {
      this.el.style.transition =
        `opacity ${LEVEL_INTRO_CONFIG.fadeInMs}ms ease-out`;
    }
  }

  /**
   * @param {number} levelId
   */
  show(levelId) {
    if (!this.el) return;
    const data = LEVEL_TITLES[levelId];
    if (!data) { this.hide(); return; }

    this.timerManager.clearScope(this._scope);

    this.titleEl.textContent = data.title;
    this.subtitleEl.textContent = data.subtitle;

    this.el.classList.remove("hidden");
    this._active = true;

    // Управляем прозрачностью напрямую для контроля тайминга
    this.el.style.transition =
      `opacity ${LEVEL_INTRO_CONFIG.fadeInMs}ms ease-out`;
    // Force reflow to start transition from 0
    void this.el.offsetWidth;
    this.el.style.opacity = "1";

    this.timerManager.schedule(() => {
      if (!this._active) return;
      this.el.style.transition =
        `opacity ${LEVEL_INTRO_CONFIG.fadeOutMs}ms ease-in`;
      this.el.style.opacity = "0";
      this.timerManager.schedule(() => {
        if (!this._active) return;
        this.hide();
      }, LEVEL_INTRO_CONFIG.fadeOutMs, this._scope);
    }, LEVEL_INTRO_CONFIG.fadeInMs + LEVEL_INTRO_CONFIG.holdMs, this._scope);
  }

  hide() {
    this._active = false;
    this.timerManager.clearScope(this._scope);
    if (!this.el) return;
    this.el.style.opacity = "0";
    this.el.classList.add("hidden");
  }

  isActive() {
    return this._active;
  }
}