import Phaser from 'phaser';
import { Audio } from '../../audio/AudioManager';
import { confetti, tween, wait } from '../../animations/effects';
import { Living } from '../../animations/living';
import { CharacterRig } from '../../characters/CharacterRig';
import { BaseMiniGame } from '../../engine/BaseMiniGame';
import { TXT, bubble, button, text } from '../../engine/ui';

export interface Eq {
  a: number;
  b: number;
  op: '+' | '-' | '×';
  shown: number;
  correct: boolean;
}

export function makeEq(hard: boolean, rnd: (a: number, b: number) => number): Eq {
  const ops: Eq['op'][] = hard ? ['+', '-', '×'] : ['+', '-'];
  const op = ops[rnd(0, ops.length - 1)];
  let a = rnd(2, hard ? 15 : 10), b = rnd(1, hard ? 9 : 9);
  if (op === '-' && b > a) [a, b] = [b, a];
  if (op === '×') {
    a = rnd(2, 9);
    b = rnd(2, 9);
  }
  const res = op === '+' ? a + b : op === '-' ? a - b : a * b;
  const correct = rnd(0, 1) === 1;
  let shown = res;
  if (!correct) {
    const off = [1, 2, 3, -1, -2, 10, -10][rnd(0, 6)];
    shown = Math.max(0, res + off);
    if (shown === res) shown = res + 1;
  }
  return { a, b, op, shown, correct };
}

/** A4 — rapid true/false checking of Daniel's homework, plus a memory number; the pencil argues. */
export default class A4_DanielsTest extends BaseMiniGame {
  eq!: Eq;
  eqText!: Phaser.GameObjects.Text;
  pencil!: Living;
  daniel!: CharacterRig;
  memNum = 0;
  memAsk = -1;
  qCount = 0;
  locked = false;
  choiceObjs: Phaser.GameObjects.GameObject[] = [];
  yesNo: Phaser.GameObjects.Container[] = [];
  mode: 'eq' | 'mem' = 'eq';
  argueB?: Phaser.GameObjects.Container;

  setup() {
    this.qCount = 0;
    this.memAsk = -1;
    this.locked = false;
    this.mode = 'eq';
    const nb = this.add.image(640, 330, 'notebook').setScale(4.2, 2.3).setDepth(2);
    void nb;
    this.eqText = this.add.text(660, 300, '', TXT(84, '#ffffff', 10)).setOrigin(0.5).setDepth(10);
    this.pencil = new Living(this, 1050, 230, 'pencil', { scale: 1.5, eyeX: 0.1 }).setDepth(12);
    this.daniel = new CharacterRig(this, 170, 700, 'daniel', 0.7).setDepth(5);
    this.addHero(1150, 710, 0.55);
    this.yesNo = [
      button(this, 820, 560, '✔ נכון', () => this.answer(true), { color: 0x8ac926, w: 240, h: 100, size: 40 }),
      button(this, 480, 560, '✘ לא נכון', () => this.answer(false), { color: 0xff595e, w: 240, h: 100, size: 40 }),
    ];
    this.setGoal(this.n(8, 4), 'notebook');
    this.setTimer(this.t(50));
    this.useMistakes();
    this.input.keyboard?.on('keydown-RIGHT', () => this.answer(true));
    this.input.keyboard?.on('keydown-LEFT', () => this.answer(false));
    this.nextQ();
  }

  nextQ() {
    this.choiceObjs.forEach((o) => o.destroy());
    this.choiceObjs = [];
    this.argueB?.destroy();
    this.qCount++;
    // memory twist
    if (this.memAsk === this.qCount) return this.askMemory();
    this.mode = 'eq';
    this.yesNo.forEach((b) => b.setVisible(true));
    this.eq = makeEq(this.diff.tier === 'hard', (a, b) => this.rnd(a, b));
    this.eqText.setText(`${this.eq.a} ${this.eq.op} ${this.eq.b} = ${this.eq.shown}`).setScale(0.3);
    this.tweens.add({ targets: this.eqText, scale: 1, duration: 200, ease: 'Back.easeOut' });
    if (!this.isEasy && this.memAsk < 0 && this.qCount % 4 === 2) {
      this.memNum = this.rnd(11, 99);
      this.memAsk = this.qCount + 2;
      const t = text(this, 640, 140, `זכרי את המספר: ${this.memNum}`, 40, '#ffe14d', 8).setDepth(30);
      this.time.delayedCall(1800, () => t.destroy());
    }
    // the pencil argues (sometimes right, sometimes not)
    if (Math.random() < 0.6) {
      const says = Math.random() < 0.5;
      this.pencil.setMood(says ? 'smug' : 'angry');
      this.argueB = bubble(this, 1050, 120, says ? 'בטוח שזה נכון!' : 'זה שגוי, תאמיני לי!', { size: 22 });
    }
  }

  askMemory() {
    this.mode = 'mem';
    this.memAsk = -1;
    this.yesNo.forEach((b) => b.setVisible(false));
    this.eqText.setText('מה היה המספר?').setScale(0.6);
    const opts = Phaser.Utils.Array.Shuffle([this.memNum, this.memNum + 10 > 99 ? this.memNum - 10 : this.memNum + 10, this.memNum % 10 === 9 ? this.memNum - 1 : this.memNum + 1]);
    opts.forEach((v, i) => this.choiceObjs.push(button(this, 380 + i * 260, 560, String(v), () => this.answerMem(v), { w: 200, h: 90, size: 44, color: 0x4cc9f0 })));
  }

  answerMem(v: number) {
    if (!this.playing || this.locked) return;
    if (v === this.memNum) {
      this.good(640, 300, 'זיכרון של פיל!');
      this.addProgress(1);
    } else this.mistake(640, 300, 'שכחנו...');
    if (!this.ended) this.time.delayedCall(300, () => this.nextQ());
  }

  answer(saysTrue: boolean) {
    if (!this.playing || this.locked || this.mode !== 'eq') return;
    this.locked = true;
    const ok = saysTrue === this.eq.correct;
    if (ok) {
      this.good(640, 300, 'נכון!');
      this.daniel.setExpr('happy', 600);
      this.addProgress(1);
    } else {
      this.daniel.setExpr('shock', 600);
      this.mistake(640, 300, this.eq.correct ? 'דווקא נכון!' : 'יש שם טעות!');
    }
    this.time.delayedCall(350, () => {
      this.locked = false;
      if (this.playing) this.nextQ();
    });
  }

  hint() {
    this.eqText.setColor(this.eq?.correct ? '#b9ff9e' : '#ffb3b3');
    this.time.delayedCall(800, () => this.eqText.setColor('#ffffff'));
  }

  bot(dt: number) {
    this.botTimer -= dt;
    if (this.botTimer > 0) return;
    this.botTimer = 0.6;
    if (this.mode === 'mem') this.answerMem(this.memNum);
    else this.answer(this.eq.correct);
  }

  async winAnim() {
    this.eqText.setText('100!').setColor('#ffe14d');
    confetti(this, 640, 300, 60);
    const nb = this.add.image(this.daniel.x, this.daniel.y - 200, 'notebook').setDepth(40);
    this.tweens.add({ targets: nb, y: -100, angle: 720, duration: 1000 });
    this.daniel.celebrate();
    await wait(this, 1500);
  }

  async loseAnim() {
    const nb = new Living(this, 1400, 600, 'notebook', { legs: true, mood: 'angry', scale: 1.2 }).setDepth(40);
    nb.runLegs(true, 70);
    if (this.hero) {
      this.hero.walkTo(-200, this.hero.y, 1300);
      this.hero.setExpr('shock');
    }
    Audio.sfx('whoosh');
    await tween(this, { targets: nb, x: -200, duration: 1500 });
  }
}
