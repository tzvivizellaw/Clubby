import Phaser from 'phaser';
import { Audio } from '../../audio/AudioManager';
import { confetti, dust, explodeIntoConfetti, flash, popText, shake, sparkle, tween, wait } from '../../animations/effects';
import { Living } from '../../animations/living';
import { CharacterRig } from '../../characters/CharacterRig';
import { BaseMiniGame, W } from '../../engine/BaseMiniGame';

const HERO = { x: 640, y: 640 };
const LAUNDRY = ['shirt_r', 'shirt_b', 'pants', 'sock_g', 'towel_w', 'shirt_g'];

interface Thing {
  o: Living | Phaser.GameObjects.Image;
  vx: number;
  vy: number;
  boss?: boolean;
}

/** Y7 — Super Yedidya: tap to aim & fire foam balls at flying laundry; boss = laundry monster (a giant sock!). */
export default class Y7_SuperYedidya extends BaseMiniGame {
  yed!: CharacterRig;
  things: Thing[] = [];
  shots: { o: Phaser.GameObjects.Image; vx: number; vy: number }[] = [];
  spawnT = 0.8;
  downed = 0;
  boss?: Thing;
  bossHp = 6;
  bossMax = 6;
  hpG!: Phaser.GameObjects.Graphics;
  cool = 0;
  hitCool = 0;

  setup() {
    this.things = [];
    this.shots = [];
    this.downed = 0;
    this.boss = undefined;
    this.spawnT = 0.8;
    this.bossMax = this.bossHp = this.n(6, 3);
    this.yed = new CharacterRig(this, HERO.x, HERO.y + 60, 'yedidya', 0.55).setDepth(20);
    this.yed.fly(true);
    this.yed.setAngle(0);
    this.tweens.add({ targets: this.yed, y: HERO.y + 40, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.hpG = this.add.graphics().setDepth(40);
    this.setGoal(this.n(8, 4), 'cape_toy', false);
    this.useMistakes();
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => this.shoot(p.x, p.y));
  }

  shoot(x: number, y: number) {
    if (!this.playing || this.cool > 0) return;
    this.cool = 0.18;
    const a = Math.atan2(y - (HERO.y - 120), x - HERO.x);
    const o = this.add.image(HERO.x, HERO.y - 120, 'foam').setDepth(25).setScale(1.2);
    this.shots.push({ o, vx: Math.cos(a) * 900, vy: Math.sin(a) * 900 });
    this.yed.face2(x < HERO.x ? -1 : 1);
    Audio.sfx('shoot');
  }

  spawn() {
    const x = this.rnd(120, W - 120);
    const o = new Living(this, x, -60, this.pick(LAUNDRY), { scale: 0.8 * this.diff.size, mood: 'angry' }).setDepth(15);
    const a = Math.atan2(HERO.y - 120 - -60, HERO.x - x);
    const v = this.s(110);
    this.things.push({ o, vx: Math.cos(a) * v, vy: Math.sin(a) * v });
  }

  spawnBoss() {
    flash(this);
    shake(this, 0.02, 400);
    Audio.sfx('roar');
    popText(this, 640, 300, 'מפלצת הכביסה!', '#ff595e', 56);
    const o = new Living(this, 640, -150, 'sockmonster', { scale: 0.9, eyes: false, mouth: false }).setDepth(16);
    this.tweens.add({ targets: o, y: 230, duration: 700, ease: 'Bounce.easeOut' });
    this.boss = { o, vx: this.s(120), vy: 0, boss: true };
    this.things.push(this.boss);
    this.drawHp();
  }

  drawHp() {
    const g = this.hpG.clear();
    if (!this.boss) return;
    g.fillStyle(0x2b1d3a).fillRoundedRect(440, 112, 400, 24, 10);
    g.fillStyle(0xff595e).fillRoundedRect(444, 116, 392 * (this.bossHp / this.bossMax), 16, 8);
  }

  tick(dt: number) {
    this.cool -= dt;
    this.hitCool -= dt;
    if (!this.boss && this.downed < this.goal) {
      this.spawnT -= dt;
      if (this.spawnT <= 0) {
        this.spawn();
        this.spawnT = (this.isEasy ? 1.5 : 1.1) / this.diff.speed;
      }
    }
    for (const t of [...this.things]) {
      if (t.boss) {
        t.o.x += t.vx * dt;
        if (t.o.x < 250 || t.o.x > 1030) t.vx *= -1;
        if (Math.random() < dt * (this.isEasy ? 0.45 : 0.7)) {
          const s = new Living(this, t.o.x, t.o.y + 60, this.pick(['sock_r', 'sock_b', 'sock_w']), { scale: 0.6, mood: 'tongue' }).setDepth(15);
          const a = Math.atan2(HERO.y - 120 - s.y, HERO.x - s.x);
          const v = this.s(150);
          this.things.push({ o: s, vx: Math.cos(a) * v, vy: Math.sin(a) * v });
        }
        continue;
      }
      t.o.x += t.vx * dt;
      t.o.y += t.vy * dt;
      t.o.angle += 50 * dt;
      if (this.hitCool <= 0 && Phaser.Math.Distance.Between(t.o.x, t.o.y, HERO.x, HERO.y - 110) < 70) {
        this.hitCool = 1;
        this.things.splice(this.things.indexOf(t), 1);
        t.o.destroy();
        this.yed.hit();
        this.mistake(HERO.x, HERO.y - 250, 'פוף! כביסה בפנים!');
      } else if (t.o.y > 780) {
        this.things.splice(this.things.indexOf(t), 1);
        t.o.destroy();
      }
    }
    for (const s of [...this.shots]) {
      s.o.x += s.vx * dt;
      s.o.y += s.vy * dt;
      const hit = this.things.find((t) => Phaser.Math.Distance.Between(t.o.x, t.o.y, s.o.x, s.o.y) < (t.boss ? 110 : 55));
      if (hit || s.o.y < -30 || s.o.x < -30 || s.o.x > W + 30) {
        this.shots.splice(this.shots.indexOf(s), 1);
        s.o.destroy();
        if (hit) this.hitThing(hit);
      }
    }
  }

  hitThing(t: Thing) {
    Audio.sfx('hit');
    if (t.boss) {
      this.bossHp--;
      this.drawHp();
      this.tweens.add({ targets: t.o, scaleX: 1, duration: 60, yoyo: true });
      if (this.bossHp <= 0) {
        this.things.splice(this.things.indexOf(t), 1);
        this.boss = undefined;
        (this as any).deadBoss = t.o;
        this.win();
      }
      return;
    }
    this.things.splice(this.things.indexOf(t), 1);
    dust(this, t.o.x, t.o.y, 5);
    this.tweens.add({ targets: t.o, scale: 0, angle: 360, duration: 200, onComplete: () => t.o.destroy() });
    this.downed++;
    this.addProgress(1);
    if (this.downed >= this.goal && !this.boss) this.spawnBoss();
  }

  hint() {
    const t = this.things[0];
    if (t) sparkle(this, t.o.x, t.o.y, 8);
  }

  bot(dt: number) {
    if (this.cool > 0) return;
    const t = [...this.things].sort((a, b) => (b.boss ? -1 : b.o.y) - (a.boss ? -1 : a.o.y))[0];
    if (!t) return;
    // lead the target a little
    const d = Phaser.Math.Distance.Between(t.o.x, t.o.y, HERO.x, HERO.y - 120) / 900;
    this.shoot(t.o.x + t.vx * d, t.o.y + t.vy * d);
  }

  async winAnim() {
    this.hpG.clear();
    const b = (this as any).deadBoss as Living;
    if (b) {
      await tween(this, { targets: b, scale: 0, duration: 250 });
      const sock = this.add.image(b.x, b.y + 40, 'bigsock').setDepth(30).setScale(0);
      await tween(this, { targets: sock, scale: 1, duration: 300, ease: 'Back.easeOut' });
      popText(this, b.x, b.y - 130, 'זו בכלל גרב ענקית!', '#ffe14d', 40);
      Audio.sfx('laugh');
      this.time.delayedCall(800, () => explodeIntoConfetti(this, sock, 60));
    }
    confetti(this, 640, 200, 50);
    await wait(this, 1500);
  }

  async loseAnim() {
    for (let i = 0; i < 6; i++) {
      const s = this.add.image(this.rnd(0, W), -60, this.pick(['sock_r', 'sock_b', 'sock_g'])).setDepth(30);
      this.tweens.add({ targets: s, x: HERO.x + this.rnd(-40, 40), y: HERO.y - this.rnd(60, 220), duration: 500, delay: i * 90 });
    }
    this.yed.setExpr('dizzy');
    await wait(this, 1400);
  }
}
