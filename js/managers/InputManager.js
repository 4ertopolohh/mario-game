export const Actions = Object.freeze({
  MOVE_LEFT: "moveLeft",
  MOVE_RIGHT: "moveRight",
  JUMP: "jump",
  DOWN: "down",
  RESTART: "restart"
});

const KEY_MAP = {
  "KeyA": Actions.MOVE_LEFT,
  "ArrowLeft": Actions.MOVE_LEFT,
  "KeyD": Actions.MOVE_RIGHT,
  "ArrowRight": Actions.MOVE_RIGHT,
  "KeyW": Actions.JUMP,
  "ArrowUp": Actions.JUMP,
  "KeyS": Actions.DOWN,
  "ArrowDown": Actions.DOWN,
  "Enter": Actions.RESTART,
  "Space": Actions.RESTART
};

export class InputManager {
  constructor() {
    this.held = new Set();
    this.pressed = new Set();
    this._pointerBindings = [];
    this._attached = false;
    this._target = null;
    this._onKeyDown = this._onKeyDown.bind(this);
    this._onKeyUp = this._onKeyUp.bind(this);
    this._onBlur = this._onBlur.bind(this);
    this._onFirstGesture = null;
  }

  attach(target = window) {
    if (this._attached) return;
    this._attached = true;
    this._target = target;
    target.addEventListener("keydown", this._onKeyDown);
    target.addEventListener("keyup", this._onKeyUp);
    target.addEventListener("blur", this._onBlur);
  }

  detach() {
    if (!this._attached) return;
    this._attached = false;
    const target = this._target || window;
    target.removeEventListener("keydown", this._onKeyDown);
    target.removeEventListener("keyup", this._onKeyUp);
    target.removeEventListener("blur", this._onBlur);
    this._target = null;
  }

  /**
   * @param {HTMLElement} el
   * @param {string} action
   */
  bindTouchButton(el, action) {
    let active = false;
    const down = (e) => {
      e.preventDefault();
      if (active) return;
      active = true;
      try { el.setPointerCapture(e.pointerId); } catch { /* ignore */ }
      this._press(action);
      el.classList.add("active");
    };
    const up = (e) => {
      if (!active) return;
      active = false;
      try { el.releasePointerCapture(e.pointerId); } catch { /* ignore */ }
      this._release(action);
      el.classList.remove("active");
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    this._pointerBindings.push({ el, down, up });
  }

  _onKeyDown(e) {
    const action = KEY_MAP[e.code];
    if (!action) return;
    e.preventDefault();
    if (!e.repeat) this._press(action);
  }

  _onKeyUp(e) {
    const action = KEY_MAP[e.code];
    if (!action) return;
    e.preventDefault();
    this._release(action);
  }

  _onBlur() {
    this.held.clear();
    this.pressed.clear();
  }

  _press(action) {
    if (!this.held.has(action)) {
      this.held.add(action);
      this.pressed.add(action);
    }
  }

  _release(action) {
    this.held.delete(action);
  }

  isHeld(action) { return this.held.has(action); }

  wasPressed(action) {
    if (this.pressed.has(action)) {
      this.pressed.delete(action);
      return true;
    }
    return false;
  }

  /** Clear edge-triggered inputs at end of frame. */
  endFrame() { this.pressed.clear(); }

  resetFrameState() { this.pressed.clear(); }

  /** Returns -1 for left, +1 for right, 0 otherwise (A+D = 0). */
  getAxis() {
    const l = this.isHeld(Actions.MOVE_LEFT);
    const r = this.isHeld(Actions.MOVE_RIGHT);
    if (l && r) return 0;
    if (l) return -1;
    if (r) return 1;
    return 0;
  }
}