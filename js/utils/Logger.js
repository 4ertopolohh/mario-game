export const LogLevel = Object.freeze({
  ERROR: 0, WARN: 1, INFO: 2, DEBUG: 3
});

class LoggerImpl {
  constructor() { this.level = LogLevel.INFO; }
  setLevel(level) { this.level = level; }
  error(...a) { if (this.level >= LogLevel.ERROR) console.error("[ERROR]", ...a); }
  warn(...a) { if (this.level >= LogLevel.WARN) console.warn("[WARN]", ...a); }
  info(...a) { if (this.level >= LogLevel.INFO) console.info("[INFO]", ...a); }
  debug(...a) { if (this.level >= LogLevel.DEBUG) console.debug("[DEBUG]", ...a); }
}

export const Logger = new LoggerImpl();