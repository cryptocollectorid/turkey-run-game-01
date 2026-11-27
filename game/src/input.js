// Keyboard, mouse and touch input for Turkey Run.
// Jump and slide are edge-triggered (a press counts once); pause and mute
// toggle on key down. Pointer clicks are reported with canvas coordinates
// so the title and end screens can offer clickable buttons.
export const KEY_JUMP = ['Space', 'ArrowUp', 'KeyW'];
export const KEY_SLIDE = ['ArrowDown', 'KeyS'];
export const KEY_RESTART = ['KeyR', 'Enter'];
export const KEY_PAUSE = ['KeyP', 'Escape'];
export const KEY_MUTE = ['KeyM'];

export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.jumpQueued = false;
    this.slideQueued = false;
    this.restartQueued = false;
    this.pauseQueued = false;
    this.muteQueued = false;
    this.anyQueued = false;
    this.slideHeld = false;
    this.click = null;
    this.pointer = { x: 0, y: 0 };

    window.addEventListener('keydown', (event) => {
      if (event.repeat) return;
      if (KEY_JUMP.includes(event.code)) {
        event.preventDefault();
        this.jumpQueued = true;
        this.anyQueued = true;
      } else if (KEY_SLIDE.includes(event.code)) {
        event.preventDefault();
        this.slideQueued = true;
        this.slideHeld = true;
        this.anyQueued = true;
      } else if (KEY_RESTART.includes(event.code)) {
        this.restartQueued = true;
        this.anyQueued = true;
      } else if (KEY_PAUSE.includes(event.code)) {
        this.pauseQueued = true;
      } else if (KEY_MUTE.includes(event.code)) {
        this.muteQueued = true;
      }
      this.keys.add(event.code);
    });
    window.addEventListener('keyup', (event) => {
      if (KEY_SLIDE.includes(event.code)) this.slideHeld = false;
      this.keys.delete(event.code);
    });
    const pointerDown = (event) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * this.canvas.width;
      const y = ((event.clientY - rect.top) / rect.height) * this.canvas.height;
      this.pointer = { x, y };
      this.click = { x, y };
      this.jumpQueued = true;
      this.anyQueued = true;
    };
    canvas.addEventListener('pointerdown', pointerDown);
    canvas.addEventListener('touchstart', (event) => event.preventDefault(), { passive: false });
  }

  consumeJump() {
    const value = this.jumpQueued;
    this.jumpQueued = false;
    return value;
  }

  consumeSlide() {
    const value = this.slideQueued;
    this.slideQueued = false;
    return value;
  }

  consumeRestart() {
    const value = this.restartQueued;
    this.restartQueued = false;
    return value;
  }

  consumePause() {
    const value = this.pauseQueued;
    this.pauseQueued = false;
    return value;
  }

  consumeMute() {
    const value = this.muteQueued;
    this.muteQueued = false;
    return value;
  }

  consumeAny() {
    const value = this.anyQueued;
    this.anyQueued = false;
    return value;
  }

  consumeClick() {
    const value = this.click;
    this.click = null;
    return value;
  }

  clearQueues() {
    this.jumpQueued = false;
    this.slideQueued = false;
    this.restartQueued = false;
    this.pauseQueued = false;
    this.muteQueued = false;
    this.anyQueued = false;
    this.click = null;
  }
}
