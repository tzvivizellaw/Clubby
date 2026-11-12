import Phaser from 'phaser';
import { Audio } from '../../audio/AudioManager';
import { confetti, sparkle, tween, wait } from '../../animations/effects';
import { Living } from '../../animations/living';
import { BaseMiniGame } from '../../engine/BaseMiniGame';
import { button } from '../../engine/ui';
import { ANIMALS, type AnimalSound } from '../shared/animals';

const EASY = ['cow', 'cat', 'dog', 'sheep', 'duckA', 'lion'];

/** E1 — toddler sound identification: 3 big animals, voice prompt, happy animal dance on success. */
export default class E1_CowSays extends BaseMiniGame {
  cards: { o: Living; a: AnimalSound }[] = [];
  target!: AnimalSound;
  locked = true;
  wrongs = 0;
  last = '';

  setup() {
    this.addHero(1170, 710, 0.65);
    this.setGoal(this.n(4, 3), 'cow');
    button(this, 110, 640, '🔊', () => this.playSound(), { w: 120, h: 90, size: 40, color: 0x4cc9f0 });
  }

  onStart() {
    this.round();
  }

  round() {
    this.cards.forEach((c) => c.o.destroy());
    this.cards = [];
    this.wrongs = 0;
    const pool = ANIMALS.filter((a) => EASY.includes(a.tex) && a.tex !== this.last);
    this.target = this.pick(pool);
    this.last = this.target.tex;
    const others = Phaser.Utils.Array.Shuffle(ANIMALS.filter((a) => EASY.includes(a.tex) && a.tex !== this.target.tex)).slice(0, 2);
    Phaser.Utils.Array.Shuffle([this.target, ...others]).forEach((a, i) => {
      const o = new Living(this, 300 + i * 340, 440, a.tex, { scale: 2.6, eyes: false, mouth: false }).setDepth(10);
      o.tap(() => this.choose(a, o), 1.2);
      o.setScale(0);
      this.tweens.add({ targets: o, scale: 2.6, duration: 300, delay: i * 100, ease: 'Back.easeOut' });
      this.cards.push({ o, a });
    });
    this.locked = false;
    this.time.delayedCall(500, () => this.playSound());
  }

  playSound() {
    if (!this.target) return;
    Audio.sfx(this.target.sfx);
    this.time.delayedCall(900, () => Audio.say('narrator', `מי עושה ${this.target.he}?`, { instruction: true }));
  }

  async choose(a: AnimalSound, o: Living) {
    if (!this.playing || this.locked) return;
    if (a.tex === this.target.tex) {
      this.locked = true;
      Audio.sfx(a.sfx);
      this.good(o.x, o.y - 160, 'כל הכבוד!');
      this.hero?.jump(40, 300);
      // funny animal dance
      await tween(this, { targets: o, angle: { from: -20, to: 20 }, y: o.y - 60, scaleX: 3, duration: 160, yoyo: true, repeat: 3 });
      o.setAngle(0);
      this.addProgress(1);
      if (!this.ended) this.round();
    } else {
      // gentle: no penalty, the animal shakes its head and the right one glows
      Audio.sfx(a.sfx);
      o.wobble(90, 10);
      this.wrongs++;
      if (this.wrongs >= 1) this.hint();
    }
  }

  hint() {
    const c = this.cards.find((x) => x.a.tex === this.target.tex);
    if (c) {
      sparkle(this, c.o.x, c.o.y, 12);
      this.tweens.add({ targets: c.o, scale: 2.9, duration: 200, yoyo: true, repeat: 2 });
    }
  }

  bot(dt: number) {
    this.botTimer -= dt;
    if (this.botTimer > 0 || this.locked) return;
    this.botTimer = 0.6;
    const c = this.cards.find((x) => x.a.tex === this.target.tex);
    if (c) this.choose(c.a, c.o);
  }

  async winAnim() {
    this.cards.forEach((c, i) => this.tweens.add({ targets: c.o, y: c.o.y - 60, duration: 200, yoyo: true, repeat: 5, delay: i * 80 }));
    confetti(this, 640, 250, 70);
    this.hero?.celebrate();
    Audio.say('esti.moo');
    await wait(this, 1600);
  }
}
