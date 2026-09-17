import { Logger } from "../utils/Logger.js";

const KEY = "platformer_progress_v1";
const VERSION = 1;

export class StorageManager {
  load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (!data || data.version !== VERSION) {
        localStorage.removeItem(KEY);
        return null;
      }
      const lvl = data.lastReachedLevel;
      if (typeof lvl !== "number" || lvl < 1 || lvl > 5 || !Number.isFinite(lvl)) {
        Logger.warn("Invalid storage value, resetting.");
        localStorage.removeItem(KEY);
        return null;
      }
      return data;
    } catch (e) {
      Logger.warn("Storage read failed:", e);
      try { localStorage.removeItem(KEY); } catch { /* ignore */ }
      return null;
    }
  }

  save(lastReachedLevel) {
    try {
      const data = { version: VERSION, lastReachedLevel };
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch (e) {
      Logger.warn("Storage write failed:", e);
    }
  }

  clear() {
    try { localStorage.removeItem(KEY); } catch { /* ignore */ }
  }
}