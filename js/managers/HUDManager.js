import { ASSETS_CONFIG } from "../config/assets.config.js";
import { GAME_CONFIG } from "../config/game.config.js";
import { GameEvents } from "../core/EventBus.js";

export class HUDManager {
  /**
   * @param {HTMLElement} root document.body
   * @param {import("../core/EventBus.js").EventBus} eventBus
   * @param {import("./InputManager.js").InputManager} inputManager
   */
  constructor(root, eventBus, inputManager) {
    this.root = root;
    this.eventBus = eventBus;
    this.inputManager = inputManager;

    this.healthHud = document.getElementById("health-hud");
    this.gameOverOverlay = document.getElementById("game-over-overlay");
    this.audioOverlay = document.getElementById("audio-unlock-overlay");
    this.loadingOverlay = document.getElementById("loading-overlay");
    this.restartBtn = document.getElementById("restart-btn");
    this.debugOverlay = document.getElementById("debug-overlay");

    this.heartSlots = [];
    this._state = { full: [false, false, false], half: [false, false, false] };

    this._buildHearts();
    this._bindEvents();
  }

  _buildHearts() {
    this.healthHud.innerHTML = "";
    this.heartSlots = [];
    for (let i = 0; i < 3; i++) {
      const slot = document.createElement("div");
      slot.className = "heart-slot";
      const img = new Image();
      img.className = "heart-img";
      img.alt = "";
      img.draggable = false;
      img.addEventListener("error", () => {
        slot.classList.add("no-image");
        img.remove();
      }, { once: true });
      img.src = ASSETS_CONFIG.heart;
      slot.appendChild(img);
      this.healthHud.appendChild(slot);
      this.heartSlots.push(slot);
    }
  }

  _bindEvents() {
    this.eventBus.on(GameEvents.PLAYER_HEALTH_CHANGED, (payload) => {
      this._updateHealth(payload.health, true);
    });

    this.eventBus.on(GameEvents.GAME_STATE_CHANGED, (payload) => {
      if (payload.state === "GAME_OVER") this._showGameOver();
      else this._hideGameOver();
      if (payload.state === "LOADING") this._showLoading();
      else this._hideLoading();
    });

    this.restartBtn.addEventListener("click", () => {
      this.eventBus.emit("RESTART_REQUESTED", {});
    });

    // Touch controls binding
    const buttons = document.querySelectorAll("#touch-controls .tc-btn");
    buttons.forEach((btn) => {
      const action = btn.dataset.action;
      if (action) this.inputManager.bindTouchButton(btn, action);
    });
  }

  showAudioUnlock() { this.audioOverlay.classList.remove("hidden"); }
  hideAudioUnlock() { this.audioOverlay.classList.add("hidden"); }

  _showGameOver() { this.gameOverOverlay.classList.remove("hidden"); }
  _hideGameOver() { this.gameOverOverlay.classList.add("hidden"); }
  _showLoading() { this.loadingOverlay.classList.remove("hidden"); }
  _hideLoading() { this.loadingOverlay.classList.add("hidden"); }

  updateHealth(health) { this._updateHealth(health, false); }

  _updateHealth(health, animate) {
    const prev = this._state;
    const next = { full: [], half: [] };
    for (let i = 0; i < 3; i++) {
      const isFull = health >= i + 1;
      const isHalf = !isFull && health > i;
      next.full.push(isFull);
      next.half.push(isHalf);
    }
    for (let i = 0; i < 3; i++) {
      const slot = this.heartSlots[i];
      const wasFull = prev.full[i];
      const wasHalf = prev.half[i];
      const isFull = next.full[i];
      const isHalf = next.half[i];
      const changed = (wasFull !== isFull) || (wasHalf !== isHalf);

      slot.classList.toggle("half", isHalf);
      slot.classList.toggle("empty", !isFull && !isHalf);

      if (animate && changed) {
        slot.classList.remove("blink");
        void slot.offsetWidth; // restart CSS animation
        slot.classList.add("blink");
        setTimeout(() => slot.classList.remove("blink"), 600);
      }
    }
    this._state = { full: next.full, half: next.half };
  }

  setDebugVisible(visible) {
    if (!this.debugOverlay) return;
    this.debugOverlay.classList.toggle("hidden", !visible);
  }

  setDebugText(text) {
    if (!this.debugOverlay) return;
    this.debugOverlay.textContent = text;
  }
}