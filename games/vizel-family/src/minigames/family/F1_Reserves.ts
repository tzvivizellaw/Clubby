import Phaser from 'phaser';
import { Audio } from '../../audio/AudioManager';
import { confetti, dust, popText, sparkle, tween, wait } from '../../animations/effects';
import { Living } from '../../animations/living';
import { CharacterRig } from '../../characters/CharacterRig';
import { BaseMiniGame, H, W } from '../../engine/BaseMiniGame';
import { bubble } from '../../engine/ui';

const GOOD = ['phone', 'wallet', 'beret', 'uniform', 'bottle'];
const BAD = ['duck', 'teddy', 'banana', 'sock_r', 'toycar'];

interface Fall {
  o: Phaser.GameObjects.Image;
  good: boolean;
  vy: number;
  sway: number;
}

/** F1 — catch the right reserve-duty gear in dad's bag; tap the runaway keys. */
export default class F1_Reserves extends BaseMiniGame {
  bag!: Living;
  targetX = W / 2;
  falls: Fall[] = [];
  keys?: Living;
  spawnT = 0;
  keyT = 0;
  dad!: CharacterRig;
  readonly BAG_Y = 640;

  setup() {
    this.falls = [];
    this.keys = undefined;
    this.spawnT = 0.5;
    this.keyT = 3;
    this.targetX = W / 2;
    this.dad = new CharacterRig(this, 160, 690, 'father', 0.75).setDepth(5);
    this.dad.setExpr('shock');
    this.addHero(1180, 690, 0.6);
    this.bag = new Living(this, W / 2, this.BAG_Y, 'bag', { scale: 1.25 * this.diff.size, eyeY: 0.05 }).setDepth(30);
    this.setGoal(this.n(8, 3), 'bag');
    this.setTimer(this.t(42));
    this.useMistakes();
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => (this.targetX = p.x));
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => p.isDown && (this.targetX = p.x));
  }

  onStart() {
    this.time.addEvent({
      delay: 2600, loop: true,
      callback: () => {
        if (!this.playing) return;
        const b = bubble(this, this.dad.x + 40, 380, this.pick(['אני מאחר!', 'איפה הכומתה?!', 'מהר מהר!']), { size: 22 });
        this.dad.jump(30, 300);
        this.time.delayedCall(1200, () => b.destroy());
      },
    });
  }

  spawn() {
    const good = Math.random() < (this.isEasy ? 0.7 : 0.62);
    const tex = this.pick(good ? GOOD : BAD);
    const o = this.add.image(this.rnd(260, 1100), -60, tex).setDepth(25);
    o.setScale(Math.min(80 / o.width, 80 / o.height) * this.diff.size);
    this.falls.push({ o, good, vy: this.s(200) + this.rnd(0, 60), sway: Math.random() * Math.PI * 2 });
  }

  spawnKeys() {
    const fromLeft = Math.random() < 0.5;
    const k = new Living(this, fromLeft ? -60 : W + 60, 540, 'keys', { legs: true, scale: 1.1 * this.diff.size }).setDepth(28);
    k.runLegs(true, 70);
    if (!fromLeft) k.scaleX *= -1;
    k.tap(() => this.catchKeys());
    this.keys = k;
    Audio.sfx('boing');
    this.tweens.add({
      targets: k, x: fromLeft ? W + 80 : -80, duration: 3800 / this.diff.speed,
      onComplete: () => {
        if (this.keys === k) this.keys = undefined;
        k.destroy();
      },
    });
  }

  catchKeys() {
    const k = this.keys;
    if (!k || !this.playing) return;
    this.keys = undefined;
    this.tweens.killTweensOf(k);
    k.setMood('tongue');
    this.good(k.x, k.y, 'מפתחות! +2');
    this.tweens.add({ targets: k, x: this.bag.x, y: this.BAG_Y, scale: 0.3, duration: 300, onComplete: () => k.destroy() });
    this.addProgress(2);
  }

  tick(dt: number) {
    if (this.cursors?.left.isDown) this.targetX -= 900 * dt;
    if (this.cursors?.right.isDown) this.targetX += 900 * dt;
    this.targetX = Phaser.Math.Clamp(this.targetX, 120, W - 120);
    const dx = this.targetX - this.bag.x;
    this.bag.x += Math.sign(dx) * Math.min(Math.abs(dx), 1500 * dt);
    this.bag.look(Math.sign(dx) * 0.8, -0.6);
    this.spawnT -= dt;
    if (this.spawnT <= 0) {
      this.spawn();
      this.spawnT = (this.isEasy ? 1.15 : 0.85) / this.diff.speed;
    }
    this.keyT -= dt;
    if (this.keyT <= 0 && !this.keys) {
      this.spawnKeys();
      this.keyT = this.rnd(5, 8);
    }
    const halfW = 80 * this.diff.size;
    for (const f of [...this.falls]) {
      f.sway += dt * 3;
      f.o.y += f.vy * dt;
      f.o.x += Math.sin(f.sway) * 40 * dt;
      f.o.angle += 40 * dt;
      if (f.o.y > this.BAG_Y - 50 && f.o.y < this.BAG_Y + 10 && Math.abs(f.o.x - this.bag.x) < halfW) {
        this.falls.splice(this.falls.indexOf(f), 1);
        if (f.good) {
          this.good(f.o.x, f.o.y - 20, '+1');
          this.bag.setMood('happy').hop(14, 90);
          this.addProgress(1);
        } else {
          this.bag.setMood('shock', 700);
          this.mistake(f.o.x, f.o.y - 20, this.pick(['זה לא למילואים!', 'ברווז?!', 'אופס!']));
        }
        this.tweens.add({ targets: f.o, scale: 0, duration: 150, onComplete: () => f.o.destroy() });
      } else if (f.o.y > H + 60) {
        this.falls.splice(this.falls.indexOf(f), 1);
        f.o.destroy();
      }
    }
  }

  hint() {
    const g = this.falls.find((f) => f.good);
    if (g) sparkle(this, g.o.x, g.o.y, 10);
  }

  bot() {
    if (this.keys && this.keys.x > 60 && this.keys.x < W - 60) this.catchKeys();
    const halfW = 80 * this.diff.size;
    const goods = this.falls.filter((f) => f.good && f.o.y < this.BAG_Y - 30).sort((a, b) => b.o.y - a.o.y);
    const bads = this.falls.filter((f) => !f.good && f.o.y < this.BAG_Y - 20 && f.o.y > this.BAG_Y - 260);
    let tx = goods[0]?.o.x ?? this.bag.x;
    for (const b of bads) if (Math.abs(b.o.x - tx) < halfW + 10) tx = b.o.x + (b.o.x < 640 ? 1 : -1) * (halfW + 60);
    this.targetX = tx;
  }

  async winAnim() {
    confetti(this, this.bag.x, this.BAG_Y - 80, 50);
    this.dad.setExpr('happy');
    this.tweens.add({ targets: this.bag, x: this.dad.x + 60, y: 560, scale: 0.6, duration: 400 });
    await wait(this, 450);
    this.bag.setVisible(false);
    this.dad.holdItem('bag', 0.6);
    this.hero?.celebrate();
    await this.dad.walkTo(W + 200, this.dad.y, 900);
  }

  async loseAnim() {
    const u = this.add.image(this.dad.x, -80, 'uniform').setDepth(40).setScale(1.3);
    await tween(this, { targets: u, y: this.dad.y - 230, duration: 400, ease: 'Bounce.easeOut' });
    dust(this, this.dad.x, this.dad.y - 200);
    popText(this, this.dad.x + 120, 300, 'אוף!', '#ff595e');
    await this.dad.fall();
  }
}
