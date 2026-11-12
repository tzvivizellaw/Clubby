import Phaser from 'phaser';
import { Audio } from '../../audio/AudioManager';
import { confetti, popText, sparkle, wait } from '../../animations/effects';
import { Living } from '../../animations/living';
import { CharacterRig } from '../../characters/CharacterRig';
import { BaseMiniGame, H } from '../../engine/BaseMiniGame';
import { TXT, button } from '../../engine/ui';

/** Mishna Rosh Hashana, chapter 1, mishnayot 1–2 (text checked against the standard printed edition). */
export const MISHNA_TEXT =
  'משנה ראש השנה פרק א\'\n' +
  'א. ארבעה ראשי שנים הם: באחד בניסן — ראש השנה למלכים ולרגלים. באחד באלול — ראש השנה למעשר בהמה; רבי אלעזר ורבי שמעון אומרים: באחד בתשרי. באחד בתשרי — ראש השנה לשנים ולשמיטין וליובלות, לנטיעה ולירקות. באחד בשבט — ראש השנה לאילן, כדברי בית שמאי; בית הלל אומרים: בחמשה עשר בו.\n' +
  'ב. בארבעה פרקים העולם נידון: בפסח על התבואה, בעצרת על פירות האילן, בראש השנה כל באי העולם עוברין לפניו כבני מרון, ובחג נידונין על המים.';

export const QUESTIONS: { q: string; a: string; wrong: string[] }[] = [
  { q: 'כמה ראשי שנים יש לפי המשנה?', a: 'ארבעה', wrong: ['שלושה', 'חמישה', 'שניים'] },
  { q: 'באחד בניסן — ראש השנה ל...?', a: 'מלכים ולרגלים', wrong: ['מעשר בהמה', 'אילן', 'שמיטין'] },
  { q: 'באחד באלול — ראש השנה ל...?', a: 'מעשר בהמה', wrong: ['מלכים', 'אילן', 'ירקות'] },
  { q: 'לפי רבי אלעזר ורבי שמעון, ראש השנה למעשר בהמה הוא...', a: 'באחד בתשרי', wrong: ['באחד בניסן', 'בט"ו בשבט', 'באחד באלול'] },
  { q: 'באחד בתשרי — ראש השנה ל...?', a: 'שנים, שמיטין ויובלות', wrong: ['מלכים ורגלים', 'מעשר בהמה', 'אילן'] },
  { q: 'באחד בתשרי ראש השנה גם ל...?', a: 'נטיעה ולירקות', wrong: ['מעשר בהמה', 'מלכים', 'אילן'] },
  { q: 'ראש השנה לאילן — לפי בית שמאי?', a: 'באחד בשבט', wrong: ['בט"ו בשבט', 'באחד בניסן', 'באחד בתשרי'] },
  { q: 'ראש השנה לאילן — לפי בית הלל?', a: 'בט"ו בשבט', wrong: ['באחד בשבט', 'באחד באלול', 'באחד בתשרי'] },
  { q: 'בכמה פרקים (זמנים) העולם נידון?', a: 'ארבעה', wrong: ['שלושה', 'שניים', 'שבעה'] },
  { q: 'בפסח העולם נידון על...', a: 'התבואה', wrong: ['המים', 'פירות האילן', 'הירקות'] },
  { q: 'בעצרת (שבועות) נידונים על...', a: 'פירות האילן', wrong: ['התבואה', 'המים', 'הירקות'] },
  { q: 'בחג (סוכות) נידונים על...', a: 'המים', wrong: ['התבואה', 'פירות האילן', 'המלכים'] },
  { q: 'בראש השנה כל באי העולם עוברים לפניו...', a: 'כבני מרון', wrong: ['כמלכים', 'כחיילים במסדר', 'כציפורים'] },
];

interface Bub {
  c: Phaser.GameObjects.Container;
  label: string;
  vy: number;
  phase: number;
  dead: boolean;
}

/** D3 — Mishna quiz with floating answer bubbles; wrong answers turn into silly creatures. */
export default class D3_MishnaTest extends BaseMiniGame {
  qs: typeof QUESTIONS = [];
  qi = 0;
  qText!: Phaser.GameObjects.Text;
  bubs: Bub[] = [];
  answer = '';
  dan!: CharacterRig;
  scroll?: Phaser.GameObjects.Container;
  qTime = 0;

  setup() {
    this.qs = Phaser.Utils.Array.Shuffle([...QUESTIONS]);
    this.qi = 0;
    this.bubs = [];
    const card = this.add.graphics().setDepth(5);
    card.fillStyle(0xfff6e0).fillRoundedRect(190, 120, 900, 110, 24).lineStyle(5, 0x2b1d3a).strokeRoundedRect(190, 120, 900, 110, 24);
    this.qText = this.add.text(640, 175, '', { ...TXT(34, '#2b1d3a', 0), wordWrap: { width: 860, useAdvancedWrap: true } } as any).setOrigin(0.5).setDepth(6);
    this.dan = new CharacterRig(this, 110, 710, 'daniel', 0.55).setDepth(4);
    button(this, 1180, 175, '📜 המשנה', () => this.toggleScroll(), { w: 170, h: 64, size: 24, color: 0x4cc9f0 });
    this.setGoal(this.n(5, 3), 'notebook');
    this.setTimer(this.t(55));
    this.useMistakes();
  }

  onStart() {
    this.nextQ();
  }

  toggleScroll() {
    if (this.scroll) {
      this.scroll.destroy();
      this.scroll = undefined;
      return;
    }
    const g = this.add.graphics();
    g.fillStyle(0xf5e6c8).fillRoundedRect(-520, -230, 1040, 460, 24).lineStyle(6, 0x8d5524).strokeRoundedRect(-520, -230, 1040, 460, 24);
    const t = this.add.text(0, 0, MISHNA_TEXT, { ...TXT(24, '#2b1d3a', 0), fontStyle: '400', align: 'right', lineSpacing: 8, wordWrap: { width: 980, useAdvancedWrap: true } } as any).setOrigin(0.5);
    this.scroll = this.add.container(640, 430, [g, t]).setDepth(990);
    this.scroll.setSize(1040, 460).setInteractive().on('pointerdown', () => this.toggleScroll());
  }

  nextQ() {
    this.bubs.forEach((b) => b.c.destroy());
    this.bubs = [];
    if (this.ended) return;
    const q = this.qs[this.qi++ % this.qs.length];
    this.answer = q.a;
    this.qText.setText(q.q).setScale(0.4);
    this.tweens.add({ targets: this.qText, scale: 1, duration: 220, ease: 'Back.easeOut' });
    const n = Math.min(4, Math.max(2, this.diff.choices));
    const opts = Phaser.Utils.Array.Shuffle([q.a, ...Phaser.Utils.Array.Shuffle([...q.wrong]).slice(0, n - 1)]);
    const gap = 1000 / n;
    opts.forEach((label, i) => {
      const x = 140 + gap / 2 + i * gap;
      const r = 105 * this.diff.size;
      const g = this.add.graphics();
      g.fillStyle(0xbde0fe, 0.85).fillCircle(0, 0, r).lineStyle(5, 0x3a86ff).strokeCircle(0, 0, r);
      g.fillStyle(0xffffff, 0.7).fillEllipse(-r * 0.4, -r * 0.45, r * 0.5, r * 0.3);
      const t = this.add.text(0, 0, label, { ...TXT(26, '#2b1d3a', 0), wordWrap: { width: r * 1.7, useAdvancedWrap: true } } as any).setOrigin(0.5);
      const c = this.add.container(x, H + 60 + (i % 2) * 60, [g, t]).setDepth(20).setSize(r * 2, r * 2);
      c.setInteractive(new Phaser.Geom.Circle(0, 0, r), Phaser.Geom.Circle.Contains);
      const b: Bub = { c, label, vy: -this.s(120) - this.rnd(0, 25), phase: Math.random() * 6, dead: false };
      c.on('pointerdown', () => this.pick2(b));
      this.bubs.push(b);
    });
    this.qTime = 0;
  }

  pick2(b: Bub) {
    if (!this.playing || b.dead || this.scroll) return;
    if (b.label === this.answer) {
      b.dead = true;
      Audio.sfx('pop');
      confetti(this, b.c.x, b.c.y, 25);
      this.good(b.c.x, b.c.y - 80, 'נכון!');
      this.dan.setExpr('happy', 700);
      this.addProgress(1);
      this.time.delayedCall(500, () => this.nextQ());
    } else {
      b.dead = true;
      // the wrong answer turns into a silly creature
      const cr = new Living(this, b.c.x, b.c.y, 'pupi', { scale: 1.3, legs: true, mood: 'tongue' }).setDepth(25);
      cr.runLegs(true, 80);
      Audio.sfx('laugh');
      b.c.destroy();
      this.tweens.add({ targets: cr, x: cr.x < 640 ? -100 : 1380, y: 640, duration: 1400, onComplete: () => cr.destroy() });
      this.dan.setExpr('shock', 700);
      this.mistake(b.c.x, b.c.y - 80, 'הפך ליצור!');
    }
  }

  tick(dt: number) {
    if (this.scroll) return;
    this.qTime += dt;
    let anyVisible = false;
    for (const b of this.bubs) {
      if (b.dead) continue;
      b.phase += dt * 2;
      b.c.y += b.vy * dt;
      b.c.x += Math.sin(b.phase) * 30 * dt;
      if (b.c.y < 330) b.vy = Math.abs(b.vy) * 0.6; // bob back down a bit
      if (b.c.y > 560 && b.vy > 0) b.vy = -Math.abs(b.vy);
      if (b.c.y < H) anyVisible = true;
    }
    void anyVisible;
  }

  hint() {
    const b = this.bubs.find((x) => !x.dead && x.label === this.answer);
    if (b) sparkle(this, b.c.x, b.c.y, 10);
  }

  bot(dt: number) {
    this.botTimer -= dt;
    if (this.botTimer > 0) return;
    const b = this.bubs.find((x) => !x.dead && x.label === this.answer && x.c.y < 620);
    if (b) {
      this.pick2(b);
      this.botTimer = 0.8;
    }
  }

  async winAnim() {
    confetti(this, 640, 300, 70);
    popText(this, 640, 330, 'יישר כוח!', '#ffe14d', 64);
    this.dan.celebrate();
    await wait(this, 1600);
  }

  async loseAnim() {
    for (let i = 0; i < 4; i++) {
      const cr = new Living(this, 200 + i * 280, 600, 'pupi', { scale: 1.2, legs: true, mood: 'happy' }).setDepth(40);
      cr.runLegs(true, 100);
      this.tweens.add({ targets: cr, y: 560, angle: { from: -15, to: 15 }, duration: 200, yoyo: true, repeat: 4 });
    }
    Audio.sfx('laugh');
    this.dan.setExpr('sad');
    await wait(this, 1600);
  }
}
