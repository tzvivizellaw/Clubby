import Phaser from 'phaser';
import { Audio } from '../../audio/AudioManager';
import { confetti, popText, tween, wait } from '../../animations/effects';
import { Living } from '../../animations/living';
import { BaseMiniGame } from '../../engine/BaseMiniGame';

const SCALE = [60, 62, 64, 65, 67, 69, 71, 72];

interface Bub {
  o: Phaser.GameObjects.Image;
  vx: number;
  vy: number;
}

/** E6 — pop soap bubbles (each one sings a note); the rubber duck sneezes them all away. */
export default class E6_FunnyShower extends BaseMiniGame {
  bubs: Bub[] = [];
  duck!: Living;
  spawnT = 0;
  sneezed = false;
  noteI = 0;

  setup() {
    this.bubs = [];
    this.sneezed = false;
    this.noteI = 0;
    this.duck = new Living(this, 640, 520, 'duck', { scale: 2.2 }).setDepth(15);
    this.tweens.add({ targets: this.duck, y: 510, angle: 5, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.addHero(1170, 710, 0.6);
    this.setGoal(this.n(16, 10), 'bubble');
  }

  spawn() {
    const o = this.add.image(this.rnd(200, 1080), 640, 'bubble').setDepth(20).setScale(this.rnd(9, 15) / 10).setInteractive();
    const b: Bub = { o, vx: this.rnd(-30, 30), vy: -this.rnd(50, 90) };
    o.on('pointerdown', () => this.popIt(b));
    this.bubs.push(b);
  }

  popIt(b: Bub) {
    if (!this.playing || !b.o.active) return;
    this.bubs.splice(this.bubs.indexOf(b), 1);
    Audio.note(SCALE[this.noteI++ % SCALE.length]);
    this.tweens.add({ targets: b.o, scale: b.o.scale * 1.5, alpha: 0, duration: 150, onComplete: () => b.o.destroy() });
    this.addProgress(1);
    if (!this.sneezed && this.progress >= Math.floor(this.goal / 2)) this.sneeze();
  }

  async sneeze() {
    this.sneezed = true;
    this.duck.setMood('shock');
    await wait(this, 400);
    Audio.sfx('sneeze');
    popText(this, 640, 350, 'אפצ\'י!', '#ffffff', 60);
    this.duck.setMood('happy');
    // all bubbles fly away — they come back slowly, nothing is lost
    for (const b of this.bubs) {
      b.vx = (b.o.x - this.duck.x) * 2;
      b.vy = -200;
    }
  }

  tick(dt: number) {
    this.spawnT -= dt;
    if (this.spawnT <= 0 && this.bubs.length < 9) {
      this.spawn();
      this.spawnT = 0.5;
    }
    for (const b of [...this.bubs]) {
      b.o.x += b.vx * dt;
      b.o.y += b.vy * dt;
      b.vx *= 0.99;
      b.vy = Math.max(b.vy * 0.99, -120);
      if (b.o.y < -80 || b.o.x < -80 || b.o.x > 1360) {
        this.bubs.splice(this.bubs.indexOf(b), 1);
        b.o.destroy();
      }
    }
  }

  bot(dt: number) {
    this.botTimer -= dt;
    if (this.botTimer > 0) return;
    const b = this.bubs.find((x) => x.o.y < 600 && x.o.y > 100);
    if (b) {
      this.popIt(b);
      this.botTimer = 0.2;
    }
  }

  async winAnim() {
    this.duck.setMood('happy');
    for (let i = 0; i < 6; i++) Audio.note(SCALE[i]);
    await tween(this, { targets: this.duck, angle: 360, scale: 2.6, duration: 700 });
    confetti(this, 640, 300, 60);
    this.hero?.celebrate();
    await wait(this, 900);
  }
}
