import Phaser from 'phaser';
import { Audio } from '../../audio/AudioManager';
import { popText, shake, splash, tween, wait } from '../../animations/effects';
import { Living } from '../../animations/living';
import { BaseMiniGame, H, W } from '../../engine/BaseMiniGame';

const SLOTS = [240, 440, 640, 840, 1040];
const FLOOR = 630;

interface Drop {
  o: Phaser.GameObjects.Image;
  slot: number;
  form: number; // seconds left forming
  vy: number;
}
interface Bucket {
  o: Phaser.GameObjects.Container;
  slot: number;
  level: number;
  busy: boolean;
  water: Phaser.GameObjects.Rectangle;
}
interface Ice {
  o: Phaser.GameObjects.Image;
  vx: number;
  vy: number;
}

/** F5 — move buckets under the dripping AC, empty them, smash sneezed ice cubes. Survive the timer. */
export default class F5_AirConditioner extends BaseMiniGame {
  ac!: Living;
  drops: Drop[] = [];
  buckets: Bucket[] = [];
  ice: Ice[] = [];
  flood = 0;
  floodMax = 6;
  floodRect!: Phaser.GameObjects.Rectangle;
  dripT = 1;
  sneezeT = 7;
  cap = 3;

  setup() {
    this.drops = [];
    this.buckets = [];
    this.ice = [];
    this.flood = 0;
    this.dripT = 1;
    this.sneezeT = 6;
    this.floodMax = this.isEasy ? 8 : 6;
    this.cap = this.isEasy ? 4 : 3;
    this.ac = new Living(this, 640, 140, 'ac', { scale: 1.1, eyeY: -0.2, eyeSpread: 60 }).setDepth(10);
    this.add.line(0, 0, 0, FLOOR - 60 - this.floodMax * 14, W, FLOOR - 60 - this.floodMax * 14, 0xff595e, 0.6).setOrigin(0).setLineWidth(3).setDepth(4);
    this.floodRect = this.add.rectangle(W / 2, H, W, 0, 0x5ec8ff, 0.55).setOrigin(0.5, 1).setDepth(45);
    const n = this.isToddler ? 4 : 3;
    const start = this.isToddler ? [0, 1, 3, 4] : [0, 2, 4];
    for (let i = 0; i < n; i++) this.makeBucket(start[i]);
    this.setTimer(this.t(28), 'win');
  }

  makeBucket(slot: number) {
    const img = this.add.image(0, 0, 'bucket').setScale(1.1 * this.diff.size);
    const water = this.add.rectangle(0, 40, 70 * this.diff.size, 0, 0x3a86ff, 0.8).setOrigin(0.5, 1);
    const c = this.add.container(SLOTS[slot], FLOOR, [img, water]).setDepth(30);
    const b: Bucket = { o: c, slot, level: 0, busy: false, water };
    const w = 110 * this.diff.size;
    c.setSize(w, w);
    c.setInteractive(new Phaser.Geom.Rectangle(-w / 2, -w / 2, w, w), Phaser.Geom.Rectangle.Contains);
    this.input.setDraggable(c);
    let sx = 0;
    c.on('dragstart', (p: Phaser.Input.Pointer) => (sx = p.x));
    c.on('drag', (_p: Phaser.Input.Pointer, x: number) => this.playing && !b.busy && (c.x = Phaser.Math.Clamp(x, 150, 1130)));
    c.on('dragend', (p: Phaser.Input.Pointer) => {
      if (!this.playing) return;
      if (Math.abs(p.x - sx) < 12) this.empty(b);
      else this.moveBucket(b, this.nearestSlot(c.x));
    });
    this.buckets.push(b);
  }

  nearestSlot(x: number) {
    let best = 0;
    SLOTS.forEach((s, i) => Math.abs(s - x) < Math.abs(SLOTS[best] - x) && (best = i));
    return best;
  }

  moveBucket(b: Bucket, slot: number) {
    const other = this.buckets.find((o) => o !== b && o.slot === slot);
    if (other) {
      other.slot = b.slot;
      this.tweens.add({ targets: other.o, x: SLOTS[other.slot], duration: 120 });
    }
    b.slot = slot;
    this.tweens.add({ targets: b.o, x: SLOTS[slot], duration: 100 });
  }

  empty(b: Bucket) {
    if (b.busy || b.level === 0) return;
    b.busy = true;
    Audio.sfx('splash');
    splash(this, b.o.x, b.o.y - 40, 8);
    this.tweens.add({
      targets: b.o, angle: -120, y: FLOOR - 60, duration: 220, yoyo: true,
      onYoyo: () => {
        b.level = 0;
        this.drawBucket(b);
      },
      onComplete: () => {
        b.busy = false;
        b.o.setAngle(0);
      },
    });
  }

  drawBucket(b: Bucket) {
    b.water.height = (b.level / this.cap) * 70 * this.diff.size;
    if (b.level >= this.cap) this.tweens.add({ targets: b.o, scale: 1.12, duration: 120, yoyo: true });
  }

  addFlood(x: number, label: string) {
    this.flood++;
    popText(this, x, FLOOR - 120, label, '#5ec8ff', 32);
    this.floodRect.height = this.flood * 14 + 6;
    Audio.sfx('splash');
    this.hero?.shock();
    if (this.flood >= this.floodMax) this.lose();
  }

  sneeze() {
    Audio.sfx('sneeze');
    this.ac.setMood('shock', 800);
    shake(this, 0.01, 250);
    const count = this.isEasy ? 2 : 3;
    for (let i = 0; i < count; i++) {
      const o = this.add.image(this.ac.x, this.ac.y + 40, 'ice').setDepth(35).setScale(1.1 * this.diff.size).setInteractive();
      const ic: Ice = { o, vx: this.rnd(-320, 320), vy: -this.rnd(100, 300) };
      o.on('pointerdown', () => this.smash(ic));
      this.ice.push(ic);
    }
  }

  smash(ic: Ice) {
    if (!this.playing || !ic.o.active) return;
    this.ice.splice(this.ice.indexOf(ic), 1);
    Audio.sfx('hit');
    splash(this, ic.o.x, ic.o.y, 6, 0xd7f3ff);
    ic.o.destroy();
    this.good();
  }

  tick(dt: number) {
    this.dripT -= dt;
    if (this.dripT <= 0) {
      const slot = this.rnd(0, 4);
      const o = this.add.image(SLOTS[slot], 190, 'drop').setScale(0.3).setDepth(20);
      this.drops.push({ o, slot, form: (this.isEasy ? 1.3 : 0.9) / this.diff.speed, vy: this.s(420) });
      this.dripT = (this.isEasy ? 1.25 : 0.8) / this.diff.speed;
    }
    for (const d of [...this.drops]) {
      if (d.form > 0) {
        d.form -= dt;
        d.o.setScale(Math.min(1.1, d.o.scale + dt * 1.2));
        d.o.x = SLOTS[d.slot] + Math.sin(this.elapsed * 30) * 2;
        continue;
      }
      d.o.y += d.vy * dt;
      if (d.o.y >= FLOOR - 30) {
        this.drops.splice(this.drops.indexOf(d), 1);
        d.o.destroy();
        const b = this.buckets.find((x) => x.slot === d.slot && !x.busy && Math.abs(x.o.x - SLOTS[d.slot]) < 40);
        if (b && b.level < this.cap) {
          b.level++;
          Audio.sfx('drip');
          this.drawBucket(b);
        } else this.addFlood(SLOTS[d.slot], b ? 'גלש!' : 'שפריץ!');
      }
    }
    this.sneezeT -= dt;
    if (this.sneezeT <= 0) {
      this.sneeze();
      this.sneezeT = this.rnd(7, 10);
    }
    for (const ic of [...this.ice]) {
      ic.vy += 600 * dt;
      ic.o.x += ic.vx * dt;
      ic.o.y += ic.vy * dt;
      ic.o.angle += 200 * dt;
      if (ic.o.y > FLOOR) {
        this.ice.splice(this.ice.indexOf(ic), 1);
        ic.o.destroy();
        this.addFlood(ic.o.x, 'נמס!');
      }
    }
  }

  hint() {
    const d = this.drops[0];
    if (d) this.tweens.add({ targets: d.o, scale: 1.6, duration: 150, yoyo: true, repeat: 2 });
  }

  bot(dt: number) {
    for (const ic of [...this.ice]) if (ic.o.y > 200) this.smash(ic);
    for (const b of this.buckets) if (b.level >= this.cap - 1 && !this.drops.some((d) => d.slot === b.slot && d.o.y > 400)) this.empty(b);
    this.botTimer -= dt;
    if (this.botTimer > 0) return;
    const need = [...new Set(this.drops.sort((a, b) => b.o.y - a.o.y).map((d) => d.slot))];
    for (const slot of need) {
      if (this.buckets.some((b) => b.slot === slot)) continue;
      const free = this.buckets.find((b) => !need.includes(b.slot) && !b.busy);
      if (free) {
        this.moveBucket(free, slot);
        this.botTimer = 0.12;
        return;
      }
    }
  }

  async winAnim() {
    this.ac.setMood('sleep');
    Audio.sfx('sneeze');
    popText(this, 640, 220, 'אפצ\'י קטנטן...', '#ffffff', 34);
    this.hero?.celebrate();
    await wait(this, 1500);
  }

  async loseAnim() {
    await tween(this, { targets: this.floodRect, height: 420, duration: 900 });
    const duck = new Living(this, 640, H - 400, 'duck', { scale: 1.6 }).setDepth(50);
    this.tweens.add({ targets: duck, y: duck.y - 15, angle: 8, duration: 400, yoyo: true, repeat: 2 });
    duck.tongue(1200);
    Audio.sfx('quack');
    await wait(this, 1300);
  }
}
