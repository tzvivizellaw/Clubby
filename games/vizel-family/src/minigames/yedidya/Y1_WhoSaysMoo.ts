import Phaser from 'phaser';
import { Audio } from '../../audio/AudioManager';
import { confetti, sparkle, tween, wait } from '../../animations/effects';
import { Living } from '../../animations/living';
import { BaseMiniGame } from '../../engine/BaseMiniGame';
import { bubble, button, text } from '../../engine/ui';
import { ANIMALS, type AnimalSound } from '../shared/animals';

/** Y1 — a clearly-marked joke phase (cow meows, cat moos), then real sound identification. */
export default class Y1_WhoSaysMoo extends BaseMiniGame {
  phase: 'joke' | 'real' = 'joke';
  cards: { o: Living; a: AnimalSound }[] = [];
  target!: AnimalSound;
  banner?: Phaser.GameObjects.Text;
  locked = true;
  used = new Set<string>();

  setup() {
    this.phase = 'joke';
    this.cards = [];
    this.locked = true;
    this.used = new Set();
    this.addHero(1180, 710, 0.6);
    this.setGoal(this.n(4, 3), 'cow');
    this.useMistakes();
    button(this, 110, 640, '🔊 שוב', () => this.playSound(), { w: 170, h: 70, size: 26, color: 0x4cc9f0 });
  }

  async onStart() {
    // --- JOKE PHASE (no answer needed) ---
    this.banner = text(this, 640, 150, 'שלב הבדיחה! 😜 רק מסתכלים', 46, '#ffbe0b', 9).setDepth(50);
    const cow = new Living(this, 450, 450, 'cow', { scale: 2, eyes: false, mouth: false }).setDepth(10);
    const cat = new Living(this, 830, 450, 'cat', { scale: 2, eyes: false, mouth: false }).setDepth(10);
    const ff = this.botOn ? 0.2 : 1;
    await wait(this, 500 * ff);
    Audio.sfx('meow');
    const b1 = bubble(this, 450, 270, 'מיאו!', { size: 34 });
    cow.hop(30, 150);
    await wait(this, 1200 * ff);
    b1.destroy();
    Audio.sfx('moo');
    const b2 = bubble(this, 830, 270, 'מוווו!', { size: 34 });
    cat.hop(30, 150);
    this.hero?.laugh();
    await wait(this, 1300 * ff);
    b2.destroy();
    cow.destroy();
    cat.destroy();
    // --- REAL PHASE ---
    this.banner.setText('עכשיו באמת! 👂 מי עושה את הקול?').setColor('#8ac926');
    this.phase = 'real';
    this.setTimer(this.t(28));
    this.round();
  }

  round() {
    this.cards.forEach((c) => c.o.destroy());
    this.cards = [];
    const pool = ANIMALS.filter((a) => !this.used.has(a.tex));
    this.target = this.pick(pool.length ? pool : ANIMALS);
    this.used.add(this.target.tex);
    const n = this.diff.choices;
    const others = Phaser.Utils.Array.Shuffle(ANIMALS.filter((a) => a.tex !== this.target.tex)).slice(0, n - 1);
    const opts = Phaser.Utils.Array.Shuffle([this.target, ...others]);
    const gap = 1000 / n;
    opts.forEach((a, i) => {
      const o = new Living(this, 140 + gap / 2 + i * gap, 430, a.tex, { scale: 1.9 * this.diff.size, eyes: false, mouth: false }).setDepth(10);
      o.tap(() => this.choose(a, o));
      o.setScale(0);
      this.tweens.add({ targets: o, scale: 1.9 * this.diff.size, duration: 250, delay: i * 80, ease: 'Back.easeOut' });
      this.cards.push({ o, a });
    });
    this.locked = false;
    this.time.delayedCall(400, () => this.playSound());
  }

  playSound() {
    if (this.phase !== 'real' || !this.target) return;
    Audio.sfx(this.target.sfx);
    Audio.say('narrator', `מי עושה ${this.target.he}?`, { instruction: true });
  }

  async choose(a: AnimalSound, o: Living) {
    if (!this.playing || this.locked || this.phase !== 'real') return;
    if (a.tex === this.target.tex) {
      this.locked = true;
      Audio.sfx(a.sfx);
      this.good(o.x, o.y - 120, `נכון! ${a.name}!`);
      await tween(this, { targets: o, angle: { from: -15, to: 15 }, y: o.y - 40, duration: 150, yoyo: true, repeat: 2 });
      this.addProgress(1);
      if (!this.ended) this.round();
    } else {
      o.wobble(80, 12);
      this.mistake(o.x, o.y - 120, `זה ${a.name}...`);
    }
  }

  hint() {
    const c = this.cards.find((x) => x.a.tex === this.target.tex);
    if (c) sparkle(this, c.o.x, c.o.y, 10);
  }

  bot(dt: number) {
    this.botTimer -= dt;
    if (this.botTimer > 0 || this.locked) return;
    this.botTimer = 0.6;
    const c = this.cards.find((x) => x.a.tex === this.target.tex);
    if (c) this.choose(c.a, c.o);
  }

  async winAnim() {
    this.cards.forEach((c, i) => this.tweens.add({ targets: c.o, y: c.o.y - 50, angle: 20, duration: 200, yoyo: true, repeat: 4, delay: i * 60 }));
    confetti(this, 640, 300, 60);
    this.hero?.celebrate();
    await wait(this, 1500);
  }

  async loseAnim() {
    this.cards.forEach((c) => c.o.destroy());
    const cow = new Living(this, 500, 450, 'cow', { scale: 1.8, eyes: false, mouth: false }).setDepth(10);
    const cat = new Living(this, 800, 450, 'cat', { scale: 1.8, eyes: false, mouth: false }).setDepth(10);
    Audio.sfx('meow');
    const b = bubble(this, 500, 280, 'אני חתול!', { size: 28 });
    await wait(this, 700);
    Audio.sfx('moo');
    const b2 = bubble(this, 800, 280, 'לא, אני פרה!', { size: 28 });
    cow.wobble();
    cat.wobble();
    await wait(this, 900);
    b.destroy();
    b2.destroy();
  }
}
