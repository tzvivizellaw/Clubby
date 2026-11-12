import Phaser from 'phaser';
import { Audio } from '../audio/AudioManager';
import { Living } from '../animations/living';
import { sparkle, splash } from '../animations/effects';
import { CharacterRig } from '../characters/CharacterRig';
import { bubble } from './ui';

/**
 * Random Comedy Event System: small background gags that never change win conditions.
 * Only one runs at a time, they live behind gameplay (depth -5) and ignore input.
 */
export type ComedyEvent = (scene: Phaser.Scene, done: () => void) => void;

const DEPTH = -5;
const FLOOR = 600;

function living(scene: Phaser.Scene, x: number, y: number, tex: string, o: ConstructorParameters<typeof Living>[4] = {}) {
  const l = new Living(scene, x, y, tex, o).setDepth(DEPTH);
  return l;
}

export const COMEDY_EVENTS: Record<string, ComedyEvent> = {
  chicken(scene, done) {
    const dir = Math.random() > 0.5 ? 1 : -1;
    const c = living(scene, dir > 0 ? -80 : 1360, FLOOR - 30, 'chicken', { eyes: false, mouth: false, legs: true, scale: 0.8 });
    c.scaleX *= dir;
    c.runLegs(true, 90);
    Audio.sfx('cluck');
    scene.tweens.add({ targets: c, x: dir > 0 ? 1380 : -100, duration: 2600, onComplete: () => (c.destroy(), done()) });
  },
  phone(scene, done) {
    const p = living(scene, 1180, 200, 'phone', { scale: 0.9, eyeY: -0.15 }).setMood('angry');
    Audio.sfx('ring');
    const b = bubble(scene, 1080, 110, 'תענו כבר!!!', { size: 22 }).setDepth(DEPTH);
    scene.tweens.add({ targets: p, angle: { from: -15, to: 15 }, duration: 60, yoyo: true, repeat: 14, onComplete: () => (p.destroy(), b.destroy(), done()) });
  },
  sneezeBall(scene, done) {
    const b = living(scene, 120, FLOOR - 20, 'basketball', { scale: 0.9, eyeY: -0.1 });
    scene.tweens.add({
      targets: b, scaleY: 1.1, duration: 400, yoyo: true,
      onComplete: () => {
        Audio.sfx('sneeze');
        b.setMood('shock');
        splash(scene, b.x + 30, b.y, 8, 0xbde0fe);
        scene.tweens.add({ targets: b, x: -100, angle: -360, duration: 700, onComplete: () => (b.destroy(), done()) });
      },
    });
  },
  wallEyes(scene, done) {
    const x = Phaser.Math.Between(100, 1180);
    const g = scene.add.graphics().setDepth(DEPTH).setPosition(x, 160);
    g.fillStyle(0xffffff).fillCircle(-26, 0, 20).fillCircle(26, 0, 20);
    g.lineStyle(4, 0x2b1d3a).strokeCircle(-26, 0, 20).strokeCircle(26, 0, 20);
    g.fillStyle(0x2b1d3a).fillCircle(-20, 4, 8).fillCircle(32, 4, 8);
    g.setScale(1, 0);
    scene.tweens.add({ targets: g, scaleY: 1, duration: 300, yoyo: true, hold: 1600, onComplete: () => (g.destroy(), done()) });
  },
  shoeDance(scene, done) {
    const s = living(scene, Phaser.Math.Between(200, 1080), FLOOR - 10, 'shoe_r', { scale: 0.9, legs: true, eyeY: -0.05, eyeX: 0.2 });
    s.runLegs(true, 110);
    Audio.sfx('boing');
    scene.tweens.add({ targets: s, angle: { from: -20, to: 20 }, y: s.y - 20, duration: 220, yoyo: true, repeat: 6, onComplete: () => (s.destroy(), done()) });
  },
  clockRun(scene, done) {
    const c = living(scene, 1380, FLOOR - 40, 'clock', { scale: 0.8, legs: true });
    c.runLegs(true, 70).setMood('shock');
    Audio.sfx('tick');
    scene.tweens.add({ targets: c, x: -120, duration: 2000, onComplete: () => (c.destroy(), done()) });
  },
  pictureFace(scene, done) {
    const p = living(scene, Phaser.Math.Between(200, 1080), 150, 'picture', { scale: 0.9, eyeY: -0.1 });
    p.setAlpha(0);
    scene.tweens.add({
      targets: p, alpha: 1, duration: 300,
      onComplete: () => {
        p.tongue(1200);
        Audio.sfx('laugh');
        scene.time.delayedCall(1500, () => scene.tweens.add({ targets: p, alpha: 0, duration: 300, onComplete: () => (p.destroy(), done()) }));
      },
    });
  },
  plateSpin(scene, done) {
    const p = scene.add.image(Phaser.Math.Between(150, 1130), 250, 'plate').setDepth(DEPTH).setScale(0.8);
    Audio.sfx('whoosh');
    scene.tweens.add({ targets: p, angle: 1080, scaleX: { from: 0.8, to: 0.2 }, yoyo: true, duration: 900, onComplete: () => { sparkle(scene, p.x, p.y); p.destroy(); done(); } });
  },
  dadSearch(scene, done) {
    const dad = new CharacterRig(scene, -100, FLOOR + 10, 'father', 0.55).setDepth(DEPTH);
    dad.setExpr('confused');
    const b = bubble(scene, 300, 330, 'איפה המפתחות?', { size: 20 }).setDepth(DEPTH).setVisible(false);
    dad.walkTo(1400, FLOOR + 10, 4200, false).then(() => {
      dad.destroy();
      b.destroy();
      done();
    });
    scene.time.delayedCall(1400, () => {
      if (!b.active) return;
      b.setPosition(dad.x, 330).setVisible(true);
      Audio.say('father', 'איפה המפתחות?', { subtitle: false });
    });
  },
  peekTongue(scene, done) {
    const tex = Phaser.Utils.Array.GetRandom(['teddy', 'duck', 'cookie', 'tomato']);
    const p = living(scene, Phaser.Math.Between(80, 1200), 760, tex, { scale: 0.9 });
    scene.tweens.add({
      targets: p, y: 680, duration: 300, yoyo: true, hold: 1200,
      onStart: () => scene.time.delayedCall(400, () => p.active && p.tongue(700)),
      onComplete: () => (p.destroy(), done()),
    });
  },
};

export class ComedyDirector {
  private busy = false;
  private ev?: Phaser.Time.TimerEvent;
  private stopped = true;
  count = 0;
  constructor(private scene: Phaser.Scene, private rate = 1, private pool = Object.keys(COMEDY_EVENTS)) {}

  start() {
    this.stopped = false;
    this.schedule();
  }

  stop() {
    this.stopped = true;
    this.ev?.remove();
  }

  private schedule() {
    if (this.stopped) return;
    const delay = Phaser.Math.Between(5500, 11000) / this.rate;
    this.ev = this.scene.time.delayedCall(delay, () => {
      if (this.stopped) return;
      if (!this.busy && Math.random() < 0.7) this.trigger();
      this.schedule();
    });
  }

  /** trigger one event now (if none running) */
  trigger(name?: string) {
    if (this.busy || this.stopped) return false;
    const key = name ?? Phaser.Utils.Array.GetRandom(this.pool);
    const fn = COMEDY_EVENTS[key];
    if (!fn) return false;
    this.busy = true;
    this.count++;
    try {
      fn(this.scene, () => (this.busy = false));
    } catch {
      this.busy = false;
    }
    return true;
  }

  get running() {
    return this.busy;
  }
}
