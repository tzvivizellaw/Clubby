import Phaser from 'phaser';
import { Audio } from '../../audio/AudioManager';
import { confetti, explodeIntoConfetti, flash, popText, shake, sparkle, tween, wait } from '../../animations/effects';
import { Living } from '../../animations/living';
import { BaseMiniGame, W } from '../../engine/BaseMiniGame';
import { TXT, text } from '../../engine/ui';

type Ch = 'socks' | 'dishes' | 'memory' | 'mash' | 'sort';
const ORDER: Ch[] = ['socks', 'dishes', 'memory', 'mash', 'sort'];
const TITLES: Record<Ch, string> = {
  socks: 'תקלה 1: לחצי על כל הגרביים!',
  dishes: 'תקלה 2: גררי את הכלים לכיור!',
  memory: 'תקלה 3: זכרי את הסדר וחזרי עליו!',
  mash: 'תקלה 4: הארון מתפוצץ! לחצי מהר מהר!',
  sort: 'תקלה 5: צעצועים לארגז, ספרים למדף!',
};

/** A8 — boss: five different fixes in a row against the Messy-House Monster. */
export default class A8_MessQueen extends BaseMiniGame {
  boss!: Living;
  hp = 5;
  hpG!: Phaser.GameObjects.Graphics;
  stage = 0;
  objs: Phaser.GameObjects.GameObject[] = [];
  chTime = 0;
  chActive = false;
  title?: Phaser.GameObjects.Text;
  // per-challenge state
  left = 0;
  seq: number[] = [];
  seqPos = 0;
  showing = false;
  pads: Phaser.GameObjects.Arc[] = [];
  mash = 0;
  items: { o: Phaser.GameObjects.Image; kind: string; done: boolean }[] = [];

  setup() {
    this.hp = 5;
    this.stage = 0;
    this.boss = new Living(this, 640, 200, 'messmonster', { scale: 0.62, eyeY: -0.12, eyeSpread: 40 }).setDepth(5);
    this.tweens.add({ targets: this.boss, y: 215, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.hpG = this.add.graphics().setDepth(30);
    this.drawHp();
    this.useMistakes();
    this.addHero(1180, 710, 0.5);
  }

  onStart() {
    this.startChallenge();
  }

  drawHp() {
    const g = this.hpG.clear();
    g.fillStyle(0x2b1d3a).fillRoundedRect(440, 112, 400, 24, 10);
    for (let i = 0; i < 5; i++) if (i < this.hp) g.fillStyle(0xff595e).fillRoundedRect(444 + i * 79, 116, 74, 16, 6);
  }

  clearObjs() {
    this.objs.forEach((o) => o.destroy());
    this.objs = [];
    this.items = [];
    this.pads = [];
  }

  startChallenge() {
    if (!this.playing) return;
    this.clearObjs();
    const ch = ORDER[this.stage];
    this.title?.destroy();
    this.title = text(this, 640, 330, TITLES[ch], 34, '#ffe14d', 8).setDepth(40);
    this.chTime = this.t(ch === 'memory' ? 16 : 11);
    this.chActive = true;
    Audio.sfx('whoosh');
    switch (ch) {
      case 'socks': {
        this.left = this.n(6, 3);
        for (let i = 0; i < this.left; i++) {
          const s = new Living(this, this.rnd(150, 1100), this.rnd(420, 660), this.pick(['sock_r', 'sock_b', 'sock_g']), { scale: 0.8 * this.diff.size, legs: true }).setDepth(20);
          s.runLegs(true, 120);
          this.tweens.add({ targets: s, x: `+=${this.rnd(-120, 120)}`, duration: 900, yoyo: true, repeat: -1 });
          s.tap(() => this.hitSock(s));
          this.objs.push(s);
        }
        break;
      }
      case 'dishes': {
        const sink = this.add.image(1000, 560, 'sink').setDepth(10);
        this.objs.push(sink);
        this.left = 3;
        for (let i = 0; i < 3; i++) {
          const d = this.add.image(220 + i * 170, 560, 'dish_dirty').setDepth(20).setScale(1.1 * this.diff.size);
          const it = { o: d, kind: 'dish', done: false };
          this.items.push(it);
          this.objs.push(d);
          this.draggable(d, (x, y) => (Math.abs(x - 1000) < 140 && Math.abs(y - 560) < 110 ? (this.dishIn(it), true) : false));
        }
        break;
      }
      case 'memory': {
        const cols = [0xff595e, 0x1982c4, 0x8ac926, 0xffca3a];
        cols.forEach((c, i) => {
          const p = this.add.circle(340 + i * 200, 540, 70 * this.diff.size, c, 0.5).setStrokeStyle(6, 0x2b1d3a).setDepth(20).setInteractive();
          p.on('pointerdown', () => this.pad(i));
          this.pads.push(p);
          this.objs.push(p);
        });
        const len = this.isEasy ? 3 : 4;
        this.seq = Array.from({ length: len }, () => this.rnd(0, 3));
        this.seqPos = 0;
        this.playSeq();
        break;
      }
      case 'mash': {
        this.mash = 0;
        const cb = new Living(this, 640, 540, 'cupboard', { scale: 0.75, mood: 'shock' }).setDepth(20);
        cb.tap(() => this.mashTap());
        this.objs.push(cb);
        const g = this.add.graphics().setDepth(25);
        this.objs.push(g);
        (this as any).mashG = g;
        (this as any).mashCb = cb;
        this.input.keyboard?.on('keydown-SPACE', this.mashTap, this);
        break;
      }
      case 'sort': {
        const box = this.add.image(1050, 600, 'toybox').setDepth(10);
        const shelf = this.add.rectangle(230, 560, 260, 24, 0xa0662b).setStrokeStyle(4, 0x2b1d3a).setDepth(10);
        this.objs.push(box, shelf, this.add.text(230, 620, 'מדף ספרים', TXT(24)).setOrigin(0.5).setDepth(10), this.add.text(1050, 680, 'ארגז צעצועים', TXT(24)).setOrigin(0.5).setDepth(10));
        const things = Phaser.Utils.Array.Shuffle(['notebook', 'notebook', 'toycar', 'dino', ...(this.isEasy ? [] : ['notebook', 'block_r'])]);
        this.left = things.length;
        things.forEach((t, i) => {
          const o = this.add.image(470 + (i % 3) * 170, 440 + Math.floor(i / 3) * 130, t).setDepth(20);
          o.setScale(Math.min(90 / o.width, 90 / o.height));
          const it = { o, kind: t === 'notebook' ? 'book' : 'toy', done: false };
          this.items.push(it);
          this.objs.push(o);
          this.draggable(o, (x, y) => {
            const target = x < 400 && y > 440 ? 'book' : x > 900 && y > 480 ? 'toy' : null;
            if (!target) return false;
            this.sortItem(it, target);
            return true;
          });
        });
        break;
      }
    }
  }

  hitSock(s: Living) {
    if (!this.chActive || !s.active) return;
    this.tweens.killTweensOf(s);
    Audio.sfx('pop');
    this.tweens.add({ targets: s, scale: 0, angle: 180, duration: 200, onComplete: () => s.destroy() });
    this.left--;
    if (this.left <= 0) this.solved();
  }

  dishIn(it: { o: Phaser.GameObjects.Image; done: boolean }) {
    if (!this.chActive || it.done) return;
    it.done = true;
    Audio.sfx('splash');
    this.tweens.add({ targets: it.o, x: 1000, y: 540, scale: 0.4, duration: 150, onComplete: () => it.o.setVisible(false) });
    this.left--;
    if (this.left <= 0) this.solved();
  }

  async playSeq() {
    this.showing = true;
    await wait(this, 700);
    for (const i of this.seq) {
      if (!this.chActive) return;
      const p = this.pads[i];
      if (!p?.active) return;
      p.setFillStyle(p.fillColor, 1).setScale(1.15);
      Audio.note(60 + i * 4);
      await wait(this, this.isEasy ? 600 : 450);
      if (!p.active) return;
      p.setFillStyle(p.fillColor, 0.5).setScale(1);
      await wait(this, 150);
    }
    this.showing = false;
  }

  pad(i: number) {
    if (!this.chActive || this.showing) return;
    const p = this.pads[i];
    Audio.note(60 + i * 4);
    this.tweens.add({ targets: p, scale: 1.15, duration: 80, yoyo: true });
    if (this.seq[this.seqPos] === i) {
      this.seqPos++;
      if (this.seqPos >= this.seq.length) this.solved();
    } else {
      this.failChallenge('לא לפי הסדר!');
    }
  }

  mashTap() {
    if (!this.chActive || ORDER[this.stage] !== 'mash') return;
    this.mash = Math.min(100, this.mash + (this.isEasy ? 9 : 7));
    Audio.sfx('tick');
    const cb = (this as any).mashCb as Living;
    cb?.wobble(40, 4);
    if (this.mash >= 100) this.solved();
  }

  sortItem(it: { o: Phaser.GameObjects.Image; kind: string; done: boolean }, target: string) {
    if (!this.chActive || it.done) return;
    if (it.kind !== target) {
      this.failChallenge(it.kind === 'book' ? 'ספר בארגז?!' : 'צעצוע על המדף?!');
      return;
    }
    it.done = true;
    Audio.sfx('pop');
    this.tweens.add({ targets: it.o, x: target === 'book' ? this.rnd(140, 320) : 1050, y: target === 'book' ? 520 : 590, scale: it.o.scale * 0.7, duration: 150 });
    it.o.disableInteractive();
    this.left--;
    if (this.left <= 0) this.solved();
  }

  solved() {
    if (!this.chActive) return;
    this.chActive = false;
    this.input.keyboard?.off('keydown-SPACE', this.mashTap, this);
    this.hp--;
    this.drawHp();
    flash(this, 0xffffff);
    shake(this, 0.012, 250);
    Audio.sfx('hit');
    this.boss.setMood('shock', 700);
    this.good(640, 260, 'פגיעה!');
    this.tweens.add({ targets: this.boss, angle: { from: -10, to: 10 }, duration: 70, yoyo: true, repeat: 3, onComplete: () => this.boss.setAngle(0) });
    this.stage++;
    if (this.stage >= ORDER.length) {
      this.clearObjs();
      this.title?.destroy();
      return this.win();
    }
    this.time.delayedCall(800, () => this.startChallenge());
  }

  failChallenge(label: string) {
    if (!this.chActive) return;
    this.chActive = false;
    this.input.keyboard?.off('keydown-SPACE', this.mashTap, this);
    this.boss.setMood('happy');
    Audio.sfx('laugh');
    this.mistake(640, 330, label);
    if (!this.ended) this.time.delayedCall(900, () => this.startChallenge());
  }

  tick(dt: number) {
    if (!this.chActive) return;
    if (ORDER[this.stage] === 'mash') {
      this.mash = Math.max(0, this.mash - dt * (this.isEasy ? 10 : 16));
      const g = (this as any).mashG as Phaser.GameObjects.Graphics;
      g?.clear().fillStyle(0x2b1d3a).fillRoundedRect(440, 380, 400, 26, 12).fillStyle(0x8ac926).fillRoundedRect(444, 384, 392 * (this.mash / 100), 18, 8);
    }
    if (this.showing) return;
    this.chTime -= dt;
    if (this.chTime <= 0 && this.diff.timed) this.failChallenge('נגמר הזמן!');
  }

  hint() {
    if (ORDER[this.stage] === 'memory' && this.chActive && !this.showing) sparkle(this, this.pads[this.seq[this.seqPos]].x, 540, 10);
  }

  bot(dt: number) {
    if (!this.chActive) return;
    this.botTimer -= dt;
    if (this.botTimer > 0) return;
    this.botTimer = 0.18;
    switch (ORDER[this.stage]) {
      case 'socks': {
        const s = this.objs.find((o) => o instanceof Living && o.active && o.scale > 0.3) as Living | undefined;
        if (s) this.hitSock(s);
        break;
      }
      case 'dishes': {
        const it = this.items.find((x) => !x.done);
        if (it) this.dishIn(it);
        break;
      }
      case 'memory':
        if (!this.showing) this.pad(this.seq[this.seqPos]);
        break;
      case 'mash':
        this.mashTap();
        break;
      case 'sort': {
        const it = this.items.find((x) => !x.done);
        if (it) this.sortItem(it, it.kind);
        break;
      }
    }
  }

  async winAnim() {
    this.tweens.killTweensOf(this.boss);
    explodeIntoConfetti(this, this.boss, 120);
    Audio.sfx('confetti');
    this.hero?.celebrate();
    const crown = this.add.image(this.hero?.x ?? 1180, -60, 'crown').setDepth(60);
    this.tweens.add({ targets: crown, y: (this.hero?.y ?? 700) - 300, duration: 600, ease: 'Bounce.easeOut' });
    await wait(this, 1700);
  }

  async loseAnim() {
    this.clearObjs();
    this.boss.setMood('tongue');
    await tween(this, { targets: this.boss, scale: 1.2, y: 360, duration: 500, ease: 'Back.easeOut' });
    for (let i = 0; i < 12; i++) {
      const o = this.add.image(640, 360, this.pick(['sock_r', 'toycar', 'dish_dirty', 'pants', 'block_b', 'banana'])).setDepth(60).setScale(0.6);
      this.tweens.add({ targets: o, x: this.rnd(0, W), y: this.rnd(380, 700), angle: this.rnd(-400, 400), duration: 600 });
    }
    Audio.sfx('crash');
    popText(this, 640, 200, 'הכול מבולגן שוב!', '#ff595e', 44);
    await wait(this, 1300);
  }
}
