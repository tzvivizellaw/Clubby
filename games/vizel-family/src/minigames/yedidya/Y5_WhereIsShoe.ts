import Phaser from 'phaser';
import { Audio } from '../../audio/AudioManager';
import { confetti, sparkle, tween, wait } from '../../animations/effects';
import { Living } from '../../animations/living';
import { CharacterRig } from '../../characters/CharacterRig';
import { BaseMiniGame } from '../../engine/BaseMiniGame';

const SHOES = ['shoe_r', 'shoe_b', 'shoe_g', 'shoe_y', 'shoe_p', 'shoe_o'];

interface Shoe {
  o: Living;
  tex: string;
  done: boolean;
  vx: number;
  vy: number;
}

/** Y5 — find matching pairs of shoes while they run around the living room. */
export default class Y5_WhereIsShoe extends BaseMiniGame {
  shoes: Shoe[] = [];
  sel: Shoe | null = null;
  ring!: Phaser.GameObjects.Arc;
  rackN = 0;
  yed!: CharacterRig;
  running = false;

  setup() {
    this.shoes = [];
    this.sel = null;
    this.rackN = 0;
    this.running = false;
    const pairs = this.isToddler ? 3 : this.isEasy ? 4 : 5;
    const rack = this.add.graphics().setDepth(4);
    rack.fillStyle(0xa0662b).fillRoundedRect(330, 150, 620, 30, 10).lineStyle(4, 0x2b1d3a).strokeRoundedRect(330, 150, 620, 30, 10);
    const texs = Phaser.Utils.Array.Shuffle(SHOES).slice(0, pairs);
    const all = Phaser.Utils.Array.Shuffle([...texs, ...texs]);
    all.forEach((t, i) => {
      const x = 160 + (i % 5) * 230 + this.rnd(-30, 30);
      const y = 300 + Math.floor(i / 5) * 190 + this.rnd(-20, 20);
      const o = new Living(this, x, y, t, { scale: 1.3 * this.diff.size, legs: true, eyeX: 0.15 }).setDepth(10);
      const s: Shoe = { o, tex: t, done: false, vx: 0, vy: 0 };
      o.tap(() => this.tapShoe(s));
      this.shoes.push(s);
    });
    this.ring = this.add.circle(0, 0, 70, 0xffffff, 0).setStrokeStyle(6, 0xffbe0b).setDepth(9).setVisible(false);
    this.yed = new CharacterRig(this, 1180, 710, 'yedidya', 0.5).setDepth(20);
    this.setGoal(pairs, 'shoe_r');
    this.setTimer(this.t(30));
    this.useMistakes();
  }

  onStart() {
    // after a moment the shoes start running
    this.time.delayedCall(this.botOn ? 300 : 2500, () => {
      this.running = true;
      for (const s of this.shoes) {
        s.vx = this.rnd(-1, 1) * this.s(70) || this.s(50);
        s.vy = this.rnd(-1, 1) * this.s(40);
        s.o.runLegs(true, 140);
      }
      Audio.sfx('boing');
    });
  }

  tapShoe(s: Shoe) {
    if (!this.playing || s.done) return;
    Audio.sfx('pop');
    if (!this.sel) {
      this.sel = s;
      return;
    }
    if (this.sel === s) {
      this.sel = null;
      return;
    }
    const a = this.sel;
    this.sel = null;
    if (a.tex === s.tex) {
      a.done = s.done = true;
      const x = 380 + this.rackN * 110;
      this.rackN++;
      for (const [k, sh] of [a, s].entries()) {
        sh.o.runLegs(false).setMood('happy');
        sh.o.disableInteractive();
        this.tweens.add({ targets: sh.o, x: x + k * 40, y: 120, scale: 0.55, angle: 0, duration: 350, ease: 'Back.easeOut' });
      }
      this.good(s.o.x, s.o.y - 60, 'זוג!');
      this.addProgress(1);
    } else {
      a.o.wobble();
      s.o.wobble();
      a.o.setMood('tongue', 600);
      s.o.setMood('tongue', 600);
      this.mistake(s.o.x, s.o.y - 60, 'לא אותו צבע');
    }
  }

  tick(dt: number) {
    if (this.sel && !this.sel.done) this.ring.setVisible(true).setPosition(this.sel.o.x, this.sel.o.y);
    else this.ring.setVisible(false);
    if (!this.running) return;
    for (const s of this.shoes) {
      if (s.done) continue;
      s.o.x += s.vx * dt;
      s.o.y += s.vy * dt;
      if (s.o.x < 100 || s.o.x > 1180) s.vx *= -1;
      if (s.o.y < 260 || s.o.y > 660) s.vy *= -1;
      s.o.scaleX = Math.abs(s.o.scaleX) * (s.vx < 0 ? -1 : 1);
    }
  }

  hint() {
    const s = this.shoes.find((x) => !x.done);
    if (!s) return;
    for (const m of this.shoes.filter((x) => !x.done && x.tex === s.tex)) sparkle(this, m.o.x, m.o.y, 8);
  }

  bot(dt: number) {
    this.botTimer -= dt;
    if (this.botTimer > 0) return;
    this.botTimer = 0.35;
    if (this.sel) {
      const m = this.shoes.find((x) => !x.done && x !== this.sel && x.tex === this.sel!.tex);
      if (m) this.tapShoe(m);
    } else {
      const s = this.shoes.find((x) => !x.done);
      if (s) this.tapShoe(s);
    }
  }

  async winAnim() {
    confetti(this, 640, 150, 50);
    this.yed.celebrate();
    await wait(this, 1500);
  }

  async loseAnim() {
    for (const s of this.shoes) if (!s.done) this.tweens.add({ targets: s.o, x: 1450, duration: 900, delay: this.rnd(0, 300) });
    Audio.sfx('laugh');
    await tween(this, { targets: this.yed, angle: 0, duration: 1100 });
  }
}
