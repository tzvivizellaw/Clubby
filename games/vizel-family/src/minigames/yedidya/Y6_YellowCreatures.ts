import Phaser from 'phaser';
import { Audio } from '../../audio/AudioManager';
import { confetti, popText, sparkle, tween, wait } from '../../animations/effects';
import { Living } from '../../animations/living';
import { CharacterRig } from '../../characters/CharacterRig';
import { BaseMiniGame } from '../../engine/BaseMiniGame';

const HIDES = [
  { x: 230, y: 560, tex: 'sofa', s: 0.7 },
  { x: 520, y: 560, tex: 'toybox', s: 1 },
  { x: 780, y: 520, tex: 'cupboard', s: 0.7 },
  { x: 1050, y: 560, tex: 'basket', s: 1 },
];
const DISGUISE = ['lamp', 'clock', 'bucket', 'speaker'];

interface Pupi {
  o: Living;
  disguised: boolean;
  caught: boolean;
}

/** Y6 — catch the original yellow "Pupi" creatures; some disguise themselves as furniture. */
export default class Y6_YellowCreatures extends BaseMiniGame {
  pupis: Pupi[] = [];
  spawnT = 0.5;
  jar!: Phaser.GameObjects.Image;
  yed!: CharacterRig;
  disguiseT = 4;

  setup() {
    this.pupis = [];
    this.spawnT = 0.5;
    this.disguiseT = this.isToddler ? 99 : 4;
    for (const h of HIDES) this.add.image(h.x, h.y, h.tex).setScale(h.s).setDepth(12);
    this.jar = this.add.image(640, 210, 'netjar').setDepth(5);
    this.yed = new CharacterRig(this, 1180, 710, 'yedidya', 0.5).setDepth(20);
    this.setGoal(this.n(8, 4), 'pupi');
    this.setTimer(this.t(28));
  }

  spawnPupi() {
    const h = this.pick(HIDES);
    const o = new Living(this, h.x, h.y + 10, 'pupi', { eyes: false, mouth: false, legs: true, scale: this.diff.size }).setDepth(10);
    const p: Pupi = { o, disguised: false, caught: false };
    o.tap(() => this.catchIt(p), 1.4);
    this.pupis.push(p);
    // peek up from behind the furniture, then run to another hiding place
    const target = this.pick(HIDES.filter((x) => x !== h));
    this.tweens.chain({
      targets: o,
      tweens: [
        { y: h.y - 90, duration: 300 / this.diff.speed, ease: 'Back.easeOut' },
        { x: target.x, duration: 1400 / this.diff.speed, ease: 'Sine.easeInOut', onStart: () => o.runLegs(true, 70) },
        { y: target.y + 10, duration: 300 / this.diff.speed },
      ],
      onComplete: () => this.escape(p),
    });
  }

  spawnDisguise() {
    const x = this.rnd(150, 1130), y = this.rnd(330, 420);
    const o = new Living(this, x, y, this.pick(DISGUISE), { legs: true, scale: 0.9, mood: 'smug' }).setDepth(9);
    o.legs.forEach((l) => l.setTint(0xffe14d));
    const p: Pupi = { o, disguised: true, caught: false };
    o.tap(() => this.catchIt(p), 1.3);
    this.pupis.push(p);
    o.setAlpha(0);
    this.tweens.add({ targets: o, alpha: 1, duration: 300 });
    this.time.delayedCall(4500 / this.diff.speed, () => this.escape(p));
  }

  escape(p: Pupi) {
    if (p.caught || !p.o.active) return;
    this.tweens.killTweensOf(p.o);
    this.tweens.add({ targets: p.o, alpha: 0, scale: 0.3, duration: 250, onComplete: () => p.o.destroy() });
    this.pupis.splice(this.pupis.indexOf(p), 1);
  }

  catchIt(p: Pupi) {
    if (!this.playing || p.caught) return;
    p.caught = true;
    this.tweens.killTweensOf(p.o);
    if (p.disguised) {
      popText(this, p.o.x, p.o.y - 80, 'זה פופי מחופש!', '#ffe14d', 30);
      const real = new Living(this, p.o.x, p.o.y, 'pupi', { scale: this.diff.size, mood: 'tongue' }).setDepth(15);
      p.o.destroy();
      p.o = real;
    }
    Audio.sfx('pop');
    this.good(p.o.x, p.o.y - 60, p.disguised ? '+2' : 'תפסתי!');
    this.tweens.add({ targets: p.o, x: this.jar.x, y: this.jar.y, scale: 0.3, duration: 350, onComplete: () => p.o.destroy() });
    this.pupis.splice(this.pupis.indexOf(p), 1);
    this.addProgress(p.disguised ? 2 : 1);
  }

  tick(dt: number) {
    this.spawnT -= dt;
    if (this.spawnT <= 0 && this.pupis.filter((p) => !p.disguised).length < 3) {
      this.spawnPupi();
      this.spawnT = (this.isToddler ? 1.6 : 1.0) / this.diff.speed;
    }
    this.disguiseT -= dt;
    if (this.disguiseT <= 0) {
      this.spawnDisguise();
      this.disguiseT = this.rnd(5, 8);
    }
  }

  hint() {
    for (const p of this.pupis) sparkle(this, p.o.x, p.o.y, 6);
  }

  bot(dt: number) {
    this.botTimer -= dt;
    if (this.botTimer > 0) return;
    const p = this.pupis.find((x) => !x.caught && x.o.alpha > 0.5 && (x.disguised || x.o.y < 520));
    if (p) {
      this.catchIt(p);
      this.botTimer = 0.35;
    }
  }

  async winAnim() {
    Audio.music('party');
    for (let i = 0; i < 5; i++) {
      const p = new Living(this, 560 + i * 40, 200, 'pupi', { scale: 0.5 }).setDepth(30);
      this.tweens.add({ targets: p, y: 180, duration: 200, yoyo: true, repeat: 5, delay: i * 80 });
    }
    confetti(this, 640, 200, 50);
    this.yed.celebrate();
    await wait(this, 1500);
  }

  async loseAnim() {
    for (let i = 0; i < 4; i++) {
      const p = new Living(this, 180 + i * 100, 460, 'pupi', { legs: true, mood: 'tongue' }).setDepth(30);
      p.runLegs(true, 90);
      this.tweens.add({ targets: p, y: 430, angle: { from: -15, to: 15 }, duration: 160, yoyo: true, repeat: 6 });
    }
    Audio.sfx('laugh');
    await tween(this, { targets: this.yed, alpha: 1, duration: 1300 });
  }
}
