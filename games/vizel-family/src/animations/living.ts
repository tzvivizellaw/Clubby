import Phaser from 'phaser';
import { OUT } from '../characters/parts';

export type Mood = 'happy' | 'angry' | 'shock' | 'sleep' | 'tongue' | 'sad' | 'smug';

export interface LivingOpts {
  scale?: number;
  eyes?: boolean;
  eyeY?: number; // relative -0.5..0.5 of height
  eyeX?: number; // relative x of eye centre
  eyeSpread?: number; // px
  eyeSize?: number;
  mouth?: boolean;
  legs?: boolean;
  arms?: boolean;
  mood?: Mood;
}

const outline = 0x2b1d3a;

/**
 * Wrap any object texture so it "comes to life": googly eyes that blink and look around,
 * a mouth with moods (incl. sticking out the tongue), and optional running legs.
 */
export class Living extends Phaser.GameObjects.Container {
  img: Phaser.GameObjects.Image;
  face: Phaser.GameObjects.Graphics;
  legs: Phaser.GameObjects.Image[] = [];
  arms: Phaser.GameObjects.Image[] = [];
  mood: Mood;
  opts: Required<Omit<LivingOpts, 'scale' | 'mood'>>;
  private blink = false;
  private lookX = 0;
  private lookY = 0;
  private legTweens: Phaser.Tweens.Tween[] = [];
  private evs: Phaser.Time.TimerEvent[] = [];
  data2: Record<string, any> = {};

  constructor(scene: Phaser.Scene, x: number, y: number, tex: string, o: LivingOpts = {}) {
    super(scene, x, y);
    this.img = scene.add.image(0, 0, tex);
    const h = this.img.height, w = this.img.width;
    this.opts = {
      eyes: o.eyes ?? true,
      eyeY: o.eyeY ?? -0.08,
      eyeX: o.eyeX ?? 0,
      eyeSpread: o.eyeSpread ?? Math.min(26, w * 0.2),
      eyeSize: o.eyeSize ?? Math.max(7, Math.min(14, w * 0.11)),
      mouth: o.mouth ?? true,
      legs: o.legs ?? false,
      arms: o.arms ?? false,
    };
    this.mood = o.mood ?? 'happy';
    if (this.opts.legs) {
      for (const s of [-1, 1]) {
        const leg = scene.add.image(s * w * 0.18, h * 0.4, 'px_leg').setOrigin(0.5, 0.05);
        this.legs.push(leg);
      }
      this.add(this.legs);
    }
    if (this.opts.arms) {
      for (const s of [-1, 1]) {
        const arm = scene.add.image(s * w * 0.46, 0, 'px_leg').setOrigin(0.5, 0.05).setAngle(s * 40).setScale(0.8);
        this.arms.push(arm);
      }
      this.add(this.arms);
    }
    this.face = scene.add.graphics();
    this.add([this.img, this.face]);
    this.setScale(o.scale ?? 1);
    this.setSize(w, h);
    scene.add.existing(this);
    this.draw();
    if (this.opts.eyes) {
      const blinkLoop = () => {
        this.evs.push(
          scene.time.delayedCall(Phaser.Math.Between(1500, 4000), () => {
            if (!this.active) return;
            this.blink = true;
            this.draw();
            scene.time.delayedCall(110, () => {
              if (!this.active) return;
              this.blink = false;
              this.draw();
              blinkLoop();
            });
          }),
        );
      };
      blinkLoop();
    }
    this.once(Phaser.GameObjects.Events.DESTROY, () => {
      this.evs.forEach((e) => e.remove());
      this.legTweens.forEach((t) => t.remove());
    });
  }

  get iw() {
    return this.img.width;
  }
  get ih() {
    return this.img.height;
  }

  draw() {
    const g = this.face;
    g.clear();
    const { eyes, eyeY, eyeX, eyeSpread, eyeSize, mouth } = this.opts;
    const cy = this.ih * eyeY;
    const cx = this.iw * eyeX;
    if (eyes) {
      for (const s of [-1, 1]) {
        const ex = cx + s * eyeSpread;
        if (this.blink || this.mood === 'sleep') {
          g.lineStyle(3, outline).beginPath();
          g.arc(ex, cy, eyeSize * 0.7, 0.2, Math.PI - 0.2);
          g.strokePath();
          continue;
        }
        const r = this.mood === 'shock' ? eyeSize * 1.3 : eyeSize;
        g.fillStyle(0xffffff).fillCircle(ex, cy, r);
        g.lineStyle(3, outline).strokeCircle(ex, cy, r);
        g.fillStyle(outline).fillCircle(ex + this.lookX * r * 0.4, cy + this.lookY * r * 0.4, r * 0.45);
        if (this.mood === 'angry') {
          g.lineStyle(4, outline).lineBetween(ex - s * r, cy - r * 1.4, ex + s * r * 0.8, cy - r * 0.8);
        }
        if (this.mood === 'sad') g.lineStyle(3, outline).lineBetween(ex - s * r, cy - r * 1.0, ex + s * r * 0.8, cy - r * 1.5);
      }
    }
    if (mouth) {
      const my = cy + eyeSize * 2.2;
      g.lineStyle(3, outline);
      switch (this.mood) {
        case 'happy':
        case 'smug':
          g.beginPath();
          g.arc(cx, my - 4, eyeSize, 0.3, Math.PI - 0.3);
          g.strokePath();
          break;
        case 'angry':
        case 'sad':
          g.beginPath();
          g.arc(cx, my + 6, eyeSize * 0.9, Math.PI + 0.3, Math.PI * 2 - 0.3);
          g.strokePath();
          break;
        case 'shock':
          g.fillStyle(0x7a1f2b).fillEllipse(cx, my, eyeSize * 1.2, eyeSize * 1.5);
          g.strokeEllipse(cx, my, eyeSize * 1.2, eyeSize * 1.5);
          break;
        case 'tongue':
          g.beginPath();
          g.arc(cx, my - 4, eyeSize, 0.3, Math.PI - 0.3);
          g.strokePath();
          g.fillStyle(0xff6b81).fillEllipse(cx + 3, my + eyeSize * 0.6, eyeSize * 1.1, eyeSize * 1.5);
          g.strokeEllipse(cx + 3, my + eyeSize * 0.6, eyeSize * 1.1, eyeSize * 1.5);
          break;
        case 'sleep':
          g.fillStyle(0x7a1f2b).fillCircle(cx, my, 4);
          break;
      }
    }
  }

  setMood(m: Mood, ms?: number, back: Mood = 'happy') {
    this.mood = m;
    this.draw();
    if (ms) this.evs.push(this.scene.time.delayedCall(ms, () => this.active && this.setMood(back)));
    return this;
  }

  look(x: number, y = 0) {
    this.lookX = Phaser.Math.Clamp(x, -1, 1);
    this.lookY = Phaser.Math.Clamp(y, -1, 1);
    this.draw();
    return this;
  }

  lookAt(px: number, py: number) {
    const a = Math.atan2(py - this.y, px - this.x);
    return this.look(Math.cos(a), Math.sin(a));
  }

  runLegs(on = true, speed = 140) {
    this.legTweens.forEach((t) => t.remove());
    this.legTweens = [];
    if (!this.legs.length) return this;
    if (!on) {
      this.legs.forEach((l) => l.setAngle(0));
      return this;
    }
    this.legs[0].setAngle(-30);
    this.legs[1].setAngle(30);
    this.legTweens.push(this.scene.tweens.add({ targets: this.legs[0], angle: 30, duration: speed, yoyo: true, repeat: -1 }));
    this.legTweens.push(this.scene.tweens.add({ targets: this.legs[1], angle: -30, duration: speed, yoyo: true, repeat: -1 }));
    this.legTweens.push(this.scene.tweens.add({ targets: this.img, y: -6, duration: speed / 2, yoyo: true, repeat: -1 }));
    return this;
  }

  /** stick out the tongue for a moment */
  tongue(ms = 900) {
    return this.setMood('tongue', ms, this.mood === 'tongue' ? 'happy' : this.mood);
  }

  wobble(ms = 120, angle = 10) {
    this.scene.tweens.add({ targets: this, angle: { from: -angle, to: angle }, duration: ms, yoyo: true, repeat: 2, onComplete: () => this.setAngle(0) });
    return this;
  }

  hop(h = 30, ms = 200) {
    const y = this.y;
    this.scene.tweens.add({ targets: this, y: y - h, duration: ms, yoyo: true, ease: 'Quad.easeOut' });
    return this;
  }

  /** make the container tappable (hit area = image bounds, scaled by `pad`) */
  tap(cb: (l: Living) => void, pad = 1.15) {
    const w = this.iw * pad, h = this.ih * pad;
    this.setInteractive(new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h), Phaser.Geom.Rectangle.Contains);
    this.on('pointerdown', () => cb(this));
    return this;
  }
}

/** plain (non-living) helper: generate a texture for a leg used by Living */
export function makeLegTexture(scene: Phaser.Scene) {
  if (scene.textures.exists('px_leg')) return;
  const g = scene.add.graphics();
  g.lineStyle(6, outline).lineBetween(10, 2, 10, 30);
  g.fillStyle(0xff595e).fillEllipse(14, 33, 18, 10);
  g.lineStyle(3, outline).strokeEllipse(14, 33, 18, 10);
  g.generateTexture('px_leg', 26, 40);
  g.destroy();
  void OUT;
}
