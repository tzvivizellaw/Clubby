import Phaser from 'phaser';
import { Audio } from '../../audio/AudioManager';
import { confetti, dust, flash, shake, tween, wait } from '../../animations/effects';
import { Living } from '../../animations/living';
import { CharacterRig } from '../../characters/CharacterRig';
import { BaseMiniGame, H, W } from '../../engine/BaseMiniGame';
import { bubble } from '../../engine/ui';

interface Paper {
  o: Phaser.GameObjects.Image;
  important: boolean;
  vx: number;
  vy: number;
  done: boolean;
}

const FLOOR = 650;

/** F4 — the printer shoots papers; tap only the important (red-seal) ones. It turns into a robot. */
export default class F4_Printer extends BaseMiniGame {
  printer!: Living;
  papers: Paper[] = [];
  pile = 0;
  pileMax = 5;
  pileG!: Phaser.GameObjects.Graphics;
  shootT = 1;
  robot = false;
  dad!: CharacterRig;
  folder!: Phaser.GameObjects.Image;

  setup() {
    this.papers = [];
    this.pile = 0;
    this.robot = false;
    this.shootT = 1;
    this.pileMax = this.isEasy ? 7 : 5;
    this.printer = new Living(this, 640, 250, 'printer', { scale: 1.4, eyeY: -0.12, arms: false }).setDepth(10);
    this.dad = new CharacterRig(this, 150, 700, 'father', 0.7).setDepth(5).setExpr('shock');
    this.folder = this.add.image(1150, 620, 'folder').setScale(1.4).setDepth(6);
    this.pileG = this.add.graphics().setDepth(7);
    this.setGoal(this.n(9, 4), 'legaldoc');
    this.setTimer(this.t(45));
    this.useMistakes();
  }

  shoot() {
    const important = Math.random() < (this.isEasy ? 0.62 : 0.55);
    const o = this.add.image(this.printer.x, this.printer.y + 40, important ? 'legaldoc' : 'scribble').setDepth(30);
    o.setScale(1.15 * this.diff.size);
    o.setInteractive();
    const p: Paper = { o, important, vx: this.rnd(-380, 380) * this.diff.speed, vy: -this.rnd(380, 560) * Math.sqrt(this.diff.speed), done: false };
    o.on('pointerdown', () => this.grab(p));
    this.papers.push(p);
    Audio.sfx('printer');
    this.printer.wobble(60, 6);
  }

  grab(p: Paper) {
    if (!this.playing || p.done) return;
    p.done = true;
    if (p.important) {
      this.good(p.o.x, p.o.y, 'נתפס!');
      this.tweens.add({ targets: p.o, x: this.folder.x, y: this.folder.y, scale: 0.2, angle: 360, duration: 350, onComplete: () => p.o.destroy() });
      this.addProgress(1);
      if (!this.robot && this.progress >= Math.ceil(this.goal / 2)) this.becomeRobot();
    } else {
      this.tweens.add({ targets: p.o, scale: 0, duration: 200, onComplete: () => p.o.destroy() });
      this.mistake(p.o.x, p.o.y, 'זה ציור של אסתי!');
    }
  }

  becomeRobot() {
    this.robot = true;
    flash(this, 0xffffff);
    shake(this, 0.015, 300);
    Audio.sfx('zap');
    this.printer.setMood('angry');
    for (const s of [-1, 1]) {
      const arm = this.add.image(this.printer.x + s * 120, this.printer.y + 10, 'wrench').setDepth(9).setScale(0.9);
      arm.setFlipX(s < 0);
      this.tweens.add({ targets: arm, angle: { from: -20 * s, to: 25 * s }, duration: 200, yoyo: true, repeat: -1 });
    }
    const b = bubble(this, 640, 110, 'אני רובוט זועם! בי-בופ!', { size: 26 });
    this.time.delayedCall(1700, () => b.destroy());
  }

  drawPile() {
    const g = this.pileG;
    g.clear();
    for (let i = 0; i < this.pile; i++) {
      g.fillStyle(i % 2 ? 0xffffff : 0xe8f1ff).fillRect(70 + (i % 3) * 8, 690 - i * 16, 170, 14);
      g.lineStyle(2, 0x2b1d3a).strokeRect(70 + (i % 3) * 8, 690 - i * 16, 170, 14);
    }
  }

  tick(dt: number) {
    this.shootT -= dt;
    if (this.shootT <= 0) {
      this.shoot();
      if (this.robot && Math.random() < 0.4) this.shoot();
      this.shootT = ((this.robot ? 0.75 : 1.0) * (this.isEasy ? 1.4 : 1)) / this.diff.speed;
    }
    this.printer.x = 640 + Math.sin(this.elapsed * (this.robot ? 2.2 : 1.2)) * (this.robot ? 260 : 120);
    const g = 520 * this.diff.speed;
    for (const p of [...this.papers]) {
      if (p.done) {
        this.papers.splice(this.papers.indexOf(p), 1);
        continue;
      }
      p.vy += g * dt;
      p.o.x += p.vx * dt;
      p.o.y += p.vy * dt;
      p.o.angle += p.vx * 0.2 * dt;
      if (p.o.x < 40 || p.o.x > W - 40) p.vx *= -1;
      if (p.o.y > FLOOR) {
        p.done = true;
        this.papers.splice(this.papers.indexOf(p), 1);
        dust(this, p.o.x, FLOOR, 4);
        if (p.important) {
          this.pile++;
          this.drawPile();
          this.dad.hit();
          this.tweens.add({ targets: p.o, x: 150, y: 690 - this.pile * 16, angle: 0, duration: 250, onComplete: () => p.o.destroy() });
          if (this.pile >= this.pileMax) this.lose();
        } else this.tweens.add({ targets: p.o, alpha: 0, duration: 300, onComplete: () => p.o.destroy() });
      }
    }
  }

  hint() {
    for (const p of this.papers) if (p.important) this.tweens.add({ targets: p.o, scale: p.o.scale * 1.3, duration: 150, yoyo: true });
  }

  bot() {
    for (const p of this.papers) if (p.important && !p.done && p.o.y > 120 && p.o.y < H) this.grab(p);
  }

  async winAnim() {
    confetti(this, this.folder.x, this.folder.y - 80, 50);
    this.printer.setMood('sad');
    await tween(this, { targets: this.printer, scaleY: this.printer.scaleY * 0.6, duration: 300, yoyo: true });
    await this.dad.celebrate();
  }

  async loseAnim() {
    for (let i = 0; i < 10; i++) {
      const o = this.add.image(this.dad.x + this.rnd(-60, 60), -50, 'paper').setDepth(40).setAngle(this.rnd(0, 360));
      this.tweens.add({ targets: o, y: this.dad.y - this.rnd(20, 200), duration: 400, delay: i * 70, ease: 'Bounce.easeOut' });
    }
    await wait(this, 900);
    this.dad.setExpr('dizzy');
    await wait(this, 700);
  }
}
