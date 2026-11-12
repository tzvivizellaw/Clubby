import Phaser from 'phaser';
import { Audio } from '../../audio/AudioManager';
import { confetti, popText, sparkle, tween, wait } from '../../animations/effects';
import { Living } from '../../animations/living';
import { BaseMiniGame } from '../../engine/BaseMiniGame';
import { TXT, bubble, text } from '../../engine/ui';

type Color = 'red' | 'blue' | 'green';
const COLOR_HEX: Record<Color, number> = { red: 0xff595e, blue: 0x1982c4, green: 0x8ac926 };
const COLOR_HE: Record<Color, string> = { red: 'אדום', blue: 'כחול', green: 'ירוק' };
const TEX = ['lamp', 'clock', 'tv', 'toybox', 'basket', 'bucket', 'pillow_r', 'speaker'];
const LOST = ['notebook', 'pencil', 'phone', 'teddy'];

export interface Suspect {
  color: Color;
  legs: boolean;
  window: boolean; // right side = near the window
}

export type Clue = { kind: 'color'; eq: boolean; v: Color } | { kind: 'legs'; v: boolean } | { kind: 'window'; v: boolean };

export function clueTrue(c: Clue, s: Suspect) {
  if (c.kind === 'color') return c.eq ? s.color === c.v : s.color !== c.v;
  if (c.kind === 'legs') return s.legs === c.v;
  return s.window === c.v;
}

export function clueText(c: Clue) {
  if (c.kind === 'color') return c.eq ? `מי שלקח — יש לו סרט ${COLOR_HE[c.v]}!` : `זה לא מישהו עם סרט ${COLOR_HE[c.v]}.`;
  if (c.kind === 'legs') return c.v ? 'ראיתי אותו בורח על רגליים!' : 'לחשוד אין רגליים בכלל.';
  return c.v ? 'זה קרה ליד החלון.' : 'זה קרה ליד הספרייה.';
}

/** Build true clues that leave exactly the target. */
export function makeClues(sus: Suspect[], target: number): Clue[] {
  const t = sus[target];
  const pool: Clue[] = [
    { kind: 'legs', v: t.legs },
    { kind: 'window', v: t.window },
    { kind: 'color', eq: true, v: t.color },
    ...(['red', 'blue', 'green'] as Color[]).filter((c) => c !== t.color).map((v) => ({ kind: 'color' as const, eq: false, v })),
  ];
  Phaser.Utils.Array.Shuffle(pool);
  const chosen: Clue[] = [];
  let alive = sus.map((_, i) => i);
  for (const c of pool) {
    if (alive.length === 1) break;
    const next = alive.filter((i) => clueTrue(c, sus[i]));
    if (next.length < alive.length) {
      chosen.push(c);
      alive = next;
    }
  }
  return chosen;
}

/** A2 — detective: interrogate the furniture (one of them lies, its nose grows) and search the right one. */
export default class A2_WhoTookIt extends BaseMiniGame {
  sus: Suspect[] = [];
  objs: Living[] = [];
  target = 0;
  liar = -1;
  round = 0;
  roundObjs: Phaser.GameObjects.GameObject[] = [];
  testimony: string[] = [];
  open?: Phaser.GameObjects.Container;
  cleared = new Set<number>();

  setup() {
    this.round = 0;
    this.setGoal(this.isEasy ? 1 : 2, 'notebook');
    this.setTimer(this.t(this.goal * 34));
    this.useMistakes();
    this.addHero(640, 710, 0.5);
    this.buildRound();
  }

  buildRound() {
    this.roundObjs.forEach((o) => o.destroy());
    this.roundObjs = [];
    this.objs = [];
    this.cleared = new Set();
    this.open?.destroy();
    const n = this.isEasy ? 4 : 6;
    // unique attribute combos
    const combos: Suspect[] = [];
    for (const color of ['red', 'blue', 'green'] as Color[]) for (const legs of [true, false]) for (const window of [false, true]) combos.push({ color, legs, window });
    const left = Phaser.Utils.Array.Shuffle(combos.filter((c) => !c.window)).slice(0, n / 2);
    const right = Phaser.Utils.Array.Shuffle(combos.filter((c) => c.window)).slice(0, n / 2);
    this.sus = [...left, ...right];
    this.target = this.rnd(0, n - 1);
    const clues = makeClues(this.sus, this.target);
    // assign clues to witnesses (not the target), one witness lies (long nose) on medium+
    const witnesses = Phaser.Utils.Array.Shuffle(this.sus.map((_, i) => i).filter((i) => i !== this.target));
    this.testimony = this.sus.map(() => this.pick(['לא ראיתי כלום, הייתי בשנ"צ.', 'אני רק מנורה, עזבי אותי.', 'זה לא אני! אני חף מפשע!']));
    clues.forEach((c, k) => (this.testimony[witnesses[k % witnesses.length]] = clueText(c)));
    this.liar = -1;
    if (!this.isEasy && witnesses.length > clues.length) {
      this.liar = witnesses[clues.length];
      const lie: Clue = { kind: 'window', v: !this.sus[this.target].window };
      this.testimony[this.liar] = clueText(lie);
    }
    this.testimony[this.target] = this.pick(['אני? לא נגעתי בכלום! (שורק בתמימות)', 'מה פתאום אני!', 'איזו מחברת? אין פה מחברת.']);
    const texs = Phaser.Utils.Array.Shuffle([...TEX]);
    this.sus.forEach((s, i) => {
      const col = i % (n / 2);
      const x = s.window ? 760 + col * 170 : 150 + col * 170;
      const y = 320 + (col % 2) * 190;
      const o = new Living(this, x, y, texs[i], { legs: s.legs, scale: 1 }).setDepth(20);
      o.setScale(Math.min(140 / o.iw, 140 / o.ih) * this.diff.size);
      const badge = this.add.circle(x + 50, y - 60, 16, COLOR_HEX[s.color]).setStrokeStyle(4, 0x2b1d3a).setDepth(21);
      o.tap(() => this.interrogate(i));
      if (s.legs) o.runLegs(true, 400);
      this.objs.push(o);
      this.roundObjs.push(o, badge);
    });
    const lost = this.pick(LOST);
    const t = this.add.text(640, 150, `מי לקח את ה${{ notebook: 'מחברת', pencil: 'עיפרון', phone: 'טלפון', teddy: 'דובי' }[lost]}?`, TXT(36, '#ffe14d')).setOrigin(0.5).setDepth(5);
    this.roundObjs.push(t);
    this.roundObjs.push(text(this, 290, 640, '📚 ליד הספרייה', 22, '#fff', 5).setDepth(5), text(this, 940, 640, 'ליד החלון 🪟', 22, '#fff', 5).setDepth(5));
    (this as any).lostTex = lost;
  }

  interrogate(i: number) {
    if (!this.playing || this.cleared.has(i)) return;
    this.open?.destroy();
    const o = this.objs[i];
    o.setMood(i === this.target ? 'smug' : 'happy', 1500).hop(16, 120);
    Audio.say('narrator', this.testimony[i], { subtitle: false });
    const b = bubble(this, o.x, o.y - 130, this.testimony[i], { size: 22, maxW: 300 });
    const btn = this.add.container(o.x, o.y + 105).setDepth(960);
    const g = this.add.graphics().fillStyle(0xffbe0b).fillRoundedRect(-80, -24, 160, 48, 16).lineStyle(4, 0x2b1d3a).strokeRoundedRect(-80, -24, 160, 48, 16);
    btn.add([g, this.add.text(0, 0, '🔍 חפשי כאן', TXT(22)).setOrigin(0.5)]);
    btn.setSize(160, 48).setInteractive(new Phaser.Geom.Rectangle(-80, -24, 160, 48), Phaser.Geom.Rectangle.Contains);
    btn.on('pointerdown', () => this.search(i));
    if (i === this.liar) {
      const nose = this.add.rectangle(o.x + 10, o.y + 5, 10, 12, 0xff8c1a).setStrokeStyle(3, 0x2b1d3a).setOrigin(0, 0.5).setDepth(22);
      this.tweens.add({ targets: nose, width: 90, duration: 600 });
      this.roundObjs.push(nose);
      popText(this, o.x, o.y - 40, 'האף מתארך...', '#ff8c1a', 24);
    }
    this.open = this.add.container(0, 0, [b, btn]).setDepth(960);
  }

  search(i: number) {
    if (!this.playing) return;
    this.open?.destroy();
    this.open = undefined;
    const o = this.objs[i];
    if (i === this.target) {
      const item = this.add.image(o.x, o.y, (this as any).lostTex).setDepth(40).setScale(0.3);
      this.tweens.add({ targets: item, y: o.y - 150, scale: 1, duration: 400, ease: 'Back.easeOut' });
      o.setMood('shock');
      this.good(o.x, o.y - 100, 'תפסתי אותך!');
      confetti(this, o.x, o.y - 100, 30);
      this.addProgress(1);
      if (!this.ended) this.time.delayedCall(1200, () => this.playing && (this.round++, this.buildRound()));
    } else {
      this.cleared.add(i);
      o.setMood('tongue', 1000);
      o.setAlpha(0.45);
      this.mistake(o.x, o.y - 80, 'ריק! רק פירורים.');
    }
  }

  hint() {
    // reveal one wrong suspect
    const wrong = this.sus.map((_, i) => i).find((i) => i !== this.target && !this.cleared.has(i));
    if (wrong != null) {
      this.cleared.add(wrong);
      this.objs[wrong].setAlpha(0.45);
      sparkle(this, this.objs[wrong].x, this.objs[wrong].y);
    }
  }

  bot(dt: number) {
    this.botTimer -= dt;
    if (this.botTimer > 0) return;
    this.botTimer = 0.8;
    if (!this.open) this.interrogate(this.target);
    else this.search(this.target);
  }

  async winAnim() {
    this.hero?.celebrate();
    confetti(this, 640, 300, 60);
    await wait(this, 1500);
  }

  async loseAnim() {
    const sofa = new Living(this, 640, 560, 'sofa', { scale: 1.2, mood: 'happy' }).setDepth(70);
    sofa.setScale(0);
    await tween(this, { targets: sofa, scale: 1.2, duration: 300, ease: 'Back.easeOut' });
    if (this.hero) await tween(this, { targets: this.hero, x: 640, y: 560, scale: 0.1, duration: 500 });
    sofa.setMood('tongue');
    Audio.sfx('crash');
    await wait(this, 900);
  }
}
