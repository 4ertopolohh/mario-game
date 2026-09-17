import { Game } from "./core/Game.js";
import { Logger, LogLevel } from "./utils/Logger.js";

Logger.setLevel(LogLevel.INFO);

const canvas = document.getElementById("game-canvas");
if (!canvas) {
  console.error("Canvas not found.");
} else {
  const game = new Game(canvas);
  window.__game = game; // debug helper
  game.init().catch((err) => {
    console.error("Game init failed:", err);
    const overlay = document.getElementById("loading-overlay");
    if (overlay) {
      overlay.innerHTML = '<p style="color:#fff">Не удалось запустить игру. Проверьте консоль.</p>';
    }
  });
}