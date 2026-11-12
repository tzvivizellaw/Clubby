import Phaser from 'phaser';
import { Audio } from '../../audio/AudioManager';
import { confetti, popText, sparkle, tween, wait } from '../../animations/effects';
import { Living } from '../../animations/living';
import { BaseMiniGame } from '../../engine/BaseMiniGame';
import { TXT, bubble, button } from '../../engine/ui';

const SYMBOLS = ['star', 'apple', 'fish', 'balloon_b', 'cookie', 'duck'];

/** Mastermind feedback: exact = right symbol right place, near = right symbol wrong place */
export function score(code: number[], guess: number[]) {
  let exact = 0, near = 0;
  guess.forEach((g, i) => {
    if (code[i] === g) exact++;
    else if (code.includes(g)) near++;
  });
  return { exact, near };
}

export function allCodes(nSym: number, len: number): number[][] {
  const out: number[][] = [];
  const rec = (cur: number[]) => {
    if (cur.length === len) return void out.push([...cur]);
    for (let s = 0; s < nSym; s++) if (!cur.includes(s)) rec([...cur, s]);
  };
  rec([]);
  return out;
}

const MISLEAD = ['חם חם! תחליפי הכול!', 'הכוכב בטוח לא בפנים... או שכן?', 'אני ארון, אני לא מדבר. בכלל.', 'קר קר! ממש קרחון!'];

/** A6 — break the cupboard's 4-symbol code (distinct symbols); the cupboard tries to mislead. */
export default class A6_SecretAgent extends BaseMiniGame {
  code: number[] = [];
  nSym = 5;
  guess: number[] = [];
  tries = 0;
  maxTries = 8;
  rowY = 0;
  cur: Phaser.GameObjects.GameObject[] = [];
  cb!: Living;
  history: { g: number[]; s: { exact: number; near: number } }[] = [];

  setup() {
    this.nSym = this.diff.tier === 'hard' ? 6 : 5;
    const pool = Phaser.Utils.Array.Shuffle([...Array(this.nSym).keys()]);
    this.code = pool.slice(0, 4);
    this.guess = [];
    this.tries = 0;
    this.history = [];
    this.maxTries = this.isEasy ? 10 : 8;
    this.cb = new Living(this, 180, 420, 'cupboard', { scale: 1.1, eyeY: -0.28 }).setDepth(5);
    const board = this.add.graphics().setDepth(2);
    board.fillStyle(0xfff6e0, 0.92).fillRoundedRect(380, 120, 640, 440, 24);
    board.lineStyle(5, 0x2b1d3a).strokeRoundedRect(380, 120, 640, 440, 24);
    this.add.text(700, 145, `ניסיונות: עד ${this.maxTries}`, TXT(22, '#2b1d3a', 0)).setOrigin(0.5).setDepth(3);
    SYMBOLS.slice(0, this.nSym).forEach((s, i) => {
      const x = 640 - ((this.nSym - 1) * 100) / 2 + i * 100;
      const b = this.add.image(x, 640, s).setDepth(10).setInteractive({ useHandCursor: true });
      b.setScale(Math.min(76 / b.width, 76 / b.height));
      b.on('pointerdown', () => this.addSym(i));
    });
    button(this, 1150, 470, 'בדיקה', () => this.check(), { w: 180, h: 70, color: 0x8ac926 });
    button(this, 1150, 570, 'ניקוי', () => this.clear(), { w: 180, h: 60, color: 0xff595e, size: 26 });
    this.setTimer(this.t(80));
    this.addHero(1150, 330, 0.45);
    this.drawCurrent();
  }

  rowPos(i: number) {
    // two columns of rows inside the board
    const col = i < 5 ? 0 : 1;
    const r = i % 5;
    return { x: 540 + col * 320, y: 190 + r * 70 };
  }

  addSym(i: number) {
    if (!this.playing || this.guess.length >= 4 || this.guess.includes(i)) return;
    this.guess.push(i);
    Audio.sfx('pop');
    this.drawCurrent();
  }

  clear() {
    this.guess = [];
    this.drawCurrent();
  }

  drawCurrent() {
    this.cur.forEach((o) => o.destroy());
    this.cur = [];
    if (this.tries >= this.maxTries) return;
    const { x, y } = this.rowPos(this.tries);
    const hl = this.add.rectangle(x + 30, y, 300, 60, 0xffbe0b, 0.35).setDepth(3);
    this.cur.push(hl);
    for (let k = 0; k < 4; k++) {
      const cx = x - 60 + k * 50;
      if (this.guess[k] != null) {
        const im = this.add.image(cx, y, SYMBOLS[this.guess[k]]).setDepth(4);
        im.setScale(Math.min(40 / im.width, 40 / im.height));
        this.cur.push(im);
      } else this.cur.push(this.add.circle(cx, y, 16, 0x2b1d3a, 0.2).setDepth(4));
    }
  }

  check() {
    if (!this.playing || this.guess.length < 4) return;
    const g = [...this.guess];
    const s = score(this.code, g);
    this.history.push({ g, s });
    const { x, y } = this.rowPos(this.tries);
    this.cur.forEach((o) => o.destroy());
    this.cur = [];
    g.forEach((sym, k) => {
      const im = this.add.image(x - 60 + k * 50, y, SYMBOLS[sym]).setDepth(4);
      im.setScale(Math.min(40 / im.width, 40 / im.height));
    });
    const pegs = [...Array(s.exact).fill(0x8ac926), ...Array(s.near).fill(0xffca3a)];
    pegs.forEach((c, k) => this.add.circle(x + 140 + (k % 2) * 20, y - 10 + Math.floor(k / 2) * 20, 8, c).setStrokeStyle(2, 0x2b1d3a).setDepth(4));
    this.tries++;
    this.guess = [];
    if (s.exact === 4) return this.win();
    Audio.sfx(s.exact + s.near >= 3 ? 'good' : 'click');
    // the cupboard tries to mislead (pure comedy — the pegs never lie)
    this.cb.setMood(this.pick(['smug', 'tongue', 'happy']), 900);
    const b = bubble(this, 230, 160, this.pick(MISLEAD), { size: 20, maxW: 260 });
    this.time.delayedCall(1500, () => b.destroy());
    if (this.tries >= this.maxTries) return this.lose();
    this.drawCurrent();
  }

  hint() {
    // reveal one correct position
    const k = this.rnd(0, 3);
    const { x, y } = this.rowPos(this.tries);
    sparkle(this, x - 60 + k * 50, y, 8);
    popText(this, 700, 600, `רמז: מקום ${k + 1} הוא ${['כוכב', 'תפוח', 'דג', 'בלון', 'עוגייה', 'ברווז'][this.code[k]]}`, '#ffe14d', 26);
  }

  bot(dt: number) {
    this.botTimer -= dt;
    if (this.botTimer > 0) return;
    this.botTimer = 0.5;
    const cands = allCodes(this.nSym, 4).filter((c) => this.history.every((h) => {
      const s = score(c, h.g);
      return s.exact === h.s.exact && s.near === h.s.near;
    }));
    this.guess = [...cands[0]];
    this.check();
  }

  async winAnim() {
    Audio.sfx('ding');
    this.cb.setMood('shock');
    await tween(this, { targets: this.cb, scaleX: 1.3, duration: 200, yoyo: true });
    const tr = this.add.image(this.cb.x, this.cb.y, 'trophy').setDepth(30).setScale(0.2);
    await tween(this, { targets: tr, y: this.cb.y - 200, scale: 1.2, duration: 500, ease: 'Back.easeOut' });
    confetti(this, tr.x, tr.y, 60);
    this.hero?.celebrate();
    await wait(this, 1000);
  }

  async loseAnim() {
    this.code.forEach((sym, k) => {
      const im = this.add.image(560 + k * 90, 380, SYMBOLS[sym]).setDepth(40).setScale(0);
      this.tweens.add({ targets: im, scale: 0.9, duration: 300, delay: k * 120 });
    });
    this.cb.tongue(1500);
    Audio.sfx('laugh');
    popText(this, 700, 300, 'זה היה הקוד!', '#ff595e', 36);
    await wait(this, 1800);
  }
}
