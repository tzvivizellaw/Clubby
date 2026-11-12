import Phaser from 'phaser';
import { Audio } from '../../audio/AudioManager';
import { confetti, popText, tween, wait } from '../../animations/effects';
import { Living } from '../../animations/living';
import { BaseMiniGame } from '../../engine/BaseMiniGame';
import { TXT, bubble, button } from '../../engine/ui';

export interface ShopItem {
  tex: string;
  name: string;
  price: number;
  food: number;
  decor: boolean;
  fun: boolean;
}

export const SHOP: ShopItem[] = [
  { tex: 'cake', name: 'עוגה', price: 30, food: 4, decor: false, fun: false },
  { tex: 'pizza', name: 'פיצה', price: 20, food: 3, decor: false, fun: false },
  { tex: 'candy', name: 'ממתקים', price: 10, food: 2, decor: false, fun: false },
  { tex: 'sandwich', name: 'כריכים', price: 15, food: 2, decor: false, fun: false },
  { tex: 'balloon_r', name: 'בלונים', price: 10, food: 0, decor: true, fun: false },
  { tex: 'garland', name: 'שרשרת', price: 15, food: 0, decor: true, fun: false },
  { tex: 'magichat', name: 'קוסם', price: 35, food: 0, decor: false, fun: true },
  { tex: 'speaker', name: 'מוזיקה', price: 20, food: 0, decor: false, fun: true },
  { tex: 'gamebox', name: 'משחקים', price: 15, food: 0, decor: false, fun: true },
];

export interface Req {
  budget: number;
  food: number;
}

export function valid(sel: ShopItem[], r: Req) {
  const cost = sel.reduce((a, s) => a + s.price, 0);
  const food = sel.reduce((a, s) => a + s.food, 0);
  return { ok: cost <= r.budget && food >= r.food && sel.some((s) => s.decor) && sel.some((s) => s.fun), cost, food };
}

/** cheapest valid selection (brute force over 2^9) */
export function cheapest(r: Omit<Req, 'budget'>): number {
  let best = Infinity;
  for (let m = 1; m < 1 << SHOP.length; m++) {
    const sel = SHOP.filter((_, i) => m & (1 << i));
    const v = valid(sel, { budget: 1e9, food: r.food });
    if (v.ok) best = Math.min(best, v.cost);
  }
  return best;
}

/** A7 — plan a surprise party within budget and requirements; the balloons argue about colours. */
export default class A7_SurpriseParty extends BaseMiniGame {
  req!: Req;
  sel = new Set<number>();
  cards: Phaser.GameObjects.Container[] = [];
  reqText!: Phaser.GameObjects.Text;
  sumText!: Phaser.GameObjects.Text;
  round = 0;

  setup() {
    this.round = 0;
    this.setGoal(this.isEasy ? 1 : 2, 'cake');
    this.setTimer(this.t(this.goal * 34));
    this.useMistakes();
    SHOP.forEach((it, i) => {
      const x = 330 + (i % 3) * 210, y = 230 + Math.floor(i / 3) * 150;
      const g = this.add.graphics();
      const draw = (on: boolean) => {
        g.clear();
        g.fillStyle(on ? 0xffe066 : 0xfff6e0).fillRoundedRect(-95, -65, 190, 130, 18);
        g.lineStyle(on ? 7 : 4, on ? 0x8ac926 : 0x2b1d3a).strokeRoundedRect(-95, -65, 190, 130, 18);
      };
      draw(false);
      const ic = this.add.image(-45, -5, it.tex);
      ic.setScale(Math.min(70 / ic.width, 70 / ic.height));
      const t1 = this.add.text(35, -35, it.name, TXT(22, '#2b1d3a', 0)).setOrigin(0.5);
      const t2 = this.add.text(35, 0, `${it.price} ₪`, TXT(24, '#ff595e', 0)).setOrigin(0.5);
      const t3 = this.add.text(35, 35, it.food ? `🍴×${it.food}` : it.decor ? 'קישוט' : 'כיף!', TXT(18, '#2b1d3a', 0)).setOrigin(0.5);
      const c = this.add.container(x, y, [g, ic, t1, t2, t3]).setDepth(10).setSize(190, 130);
      c.setInteractive(new Phaser.Geom.Rectangle(-95, -65, 190, 130), Phaser.Geom.Rectangle.Contains);
      c.on('pointerdown', () => this.toggle(i));
      (c as any).draw = draw;
      this.cards.push(c);
    });
    const panel = this.add.graphics().setDepth(5);
    panel.fillStyle(0xfff6e0).fillRoundedRect(980, 150, 270, 330, 20).lineStyle(5, 0x2b1d3a).strokeRoundedRect(980, 150, 270, 330, 20);
    this.reqText = this.add.text(1115, 250, '', { ...TXT(22, '#2b1d3a', 0), wordWrap: { width: 240 } } as any).setOrigin(0.5).setDepth(6);
    this.sumText = this.add.text(1115, 410, '', TXT(26, '#2b1d3a', 0)).setOrigin(0.5).setDepth(6);
    button(this, 1115, 560, 'הפתעה!', () => this.submit(), { w: 230, h: 80, color: 0xff7bd5 });
    // arguing balloons
    const b1 = new Living(this, 120, 260, 'balloon_r', { scale: 1.2 }).setDepth(4);
    const b2 = new Living(this, 120, 450, 'balloon_b', { scale: 1.2 }).setDepth(4);
    this.tweens.add({ targets: [b1, b2], y: '-=14', duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.time.addEvent({
      delay: 3000, loop: true,
      callback: () => {
        if (!this.playing) return;
        const first = Math.random() < 0.5;
        const who = first ? b1 : b2;
        who.setMood('angry', 1200);
        const bb = bubble(this, who.x + 60, who.y - 90, first ? 'אדום הכי יפה!' : 'כחול! ברור שכחול!', { size: 18 });
        this.time.delayedCall(1300, () => bb.destroy());
      },
    });
    this.newRound();
  }

  newRound() {
    this.sel.clear();
    this.cards.forEach((c) => (c as any).draw(false));
    const food = this.rnd(this.isEasy ? 3 : 5, this.isEasy ? 5 : 8);
    const min = cheapest({ food });
    const slack = this.diff.tier === 'hard' ? 5 : this.diff.tier === 'medium' ? 15 : 25;
    this.req = { food, budget: min + slack };
    this.reqText.setText(`תקציב: ${this.req.budget} ₪\nאוכל: לפחות 🍴×${food}\nקישוט: לפחות 1\nכיף: לפחות 1`);
    this.updateSum();
  }

  selected() {
    return [...this.sel].map((i) => SHOP[i]);
  }

  updateSum() {
    const v = valid(this.selected(), this.req);
    this.sumText.setText(`${v.cost}/${this.req.budget} ₪   🍴${v.food}`).setColor(v.cost > this.req.budget ? '#ff595e' : '#2b1d3a');
  }

  toggle(i: number) {
    if (!this.playing) return;
    if (this.sel.has(i)) this.sel.delete(i);
    else this.sel.add(i);
    (this.cards[i] as any).draw(this.sel.has(i));
    Audio.sfx(this.sel.has(i) ? 'coin' : 'click');
    this.updateSum();
  }

  submit() {
    if (!this.playing) return;
    const sel = this.selected();
    const v = valid(sel, this.req);
    if (v.ok) {
      confetti(this, 640, 300, 40);
      this.good(640, 300, 'מסיבה מושלמת!');
      this.round++;
      this.addProgress(1);
      if (!this.ended) this.time.delayedCall(600, () => this.newRound());
      return;
    }
    const why = v.cost > this.req.budget ? 'עברנו את התקציב!' : v.food < this.req.food ? 'אין מספיק אוכל!' : !sel.some((s) => s.decor) ? 'חסר קישוט!' : 'חסר משהו כיפי!';
    this.mistake(1115, 300, why);
  }

  hint() {
    // pre-select a valid plan's first item
    const plan = this.botPlan();
    const i = plan.find((k) => !this.sel.has(k));
    if (i != null) this.tweens.add({ targets: this.cards[i], scale: 1.12, duration: 160, yoyo: true, repeat: 2 });
  }

  botPlan(): number[] {
    let best: number[] = [];
    let bestCost = Infinity;
    for (let m = 1; m < 1 << SHOP.length; m++) {
      const idx = SHOP.map((_, i) => i).filter((i) => m & (1 << i));
      const v = valid(idx.map((i) => SHOP[i]), this.req);
      if (v.ok && v.cost < bestCost) {
        bestCost = v.cost;
        best = idx;
      }
    }
    return best;
  }

  bot(dt: number) {
    this.botTimer -= dt;
    if (this.botTimer > 0) return;
    this.botTimer = 0.3;
    const plan = this.botPlan();
    const extra = [...this.sel].find((i) => !plan.includes(i));
    if (extra != null) return this.toggle(extra);
    const need = plan.find((i) => !this.sel.has(i));
    if (need != null) return this.toggle(need);
    this.submit();
  }

  async winAnim() {
    Audio.music('party');
    for (let i = 0; i < 8; i++) {
      const b = this.add.image(this.rnd(100, 1180), 800, this.pick(['balloon_r', 'balloon_b', 'balloon_g', 'balloon_y', 'balloon_p'])).setDepth(60);
      this.tweens.add({ targets: b, y: -150, duration: 1600 + i * 80, ease: 'Sine.easeIn' });
    }
    confetti(this, 640, 200, 80);
    await wait(this, 1700);
  }

  async loseAnim() {
    const cake = new Living(this, 300, 600, 'cake', { legs: true, scale: 1.2, mood: 'tongue' }).setDepth(60);
    cake.runLegs(true, 70);
    popText(this, 640, 300, 'העוגה בורחת!', '#ff595e', 44);
    await tween(this, { targets: cake, x: 1450, duration: 1500 });
  }
}
