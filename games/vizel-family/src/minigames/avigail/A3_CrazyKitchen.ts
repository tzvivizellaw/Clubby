import Phaser from 'phaser';
import { Audio } from '../../audio/AudioManager';
import { confetti, explodeIntoConfetti, flash, popText, sparkle, tween, wait } from '../../animations/effects';
import { Living } from '../../animations/living';
import { BaseMiniGame, H } from '../../engine/BaseMiniGame';
import { TXT, text } from '../../engine/ui';

const RECIPES: { name: string; need: Record<string, number> }[] = [
  { name: 'סלט ישראלי', need: { tomato: 2, cucumber: 2, pepper: 1 } },
  { name: 'מרק ירקות', need: { carrot: 2, onion: 1, tomato: 1 } },
  { name: 'חביתה', need: { egg: 3, pepper: 1 } },
  { name: 'פשטידה', need: { egg: 2, cheese: 1, onion: 1 } },
];
const ALL = ['tomato', 'cucumber', 'pepper', 'carrot', 'onion', 'egg', 'cheese', 'apple', 'banana'];

interface Fly {
  o: Living;
  tex: string;
  vx: number;
  vy: number;
  dead: boolean;
}

/** A3 — catch only what the recipe needs, in the right amounts; the vegetables revolt. */
export default class A3_CrazyKitchen extends BaseMiniGame {
  flies: Fly[] = [];
  need: Record<string, number> = {};
  card!: Phaser.GameObjects.Container;
  spawnT = 0.6;
  revolt = false;
  recipeIdx = 0;
  recipes: typeof RECIPES = [];

  setup() {
    this.flies = [];
    this.revolt = false;
    this.spawnT = 0.6;
    this.recipeIdx = 0;
    this.recipes = Phaser.Utils.Array.Shuffle([...RECIPES]);
    this.setGoal(this.isEasy ? 1 : 2, 'soup');
    this.setTimer(this.t(this.goal * 26));
    this.useMistakes();
    this.addHero(1190, 710, 0.55);
    this.loadRecipe();
    this.input.on('gameobjectdown', (_p: any, go: any) => {
      const f = this.flies.find((x) => x.o === go);
      if (f) this.catchIt(f);
    });
  }

  loadRecipe() {
    const r = this.recipes[this.recipeIdx % this.recipes.length];
    this.need = { ...r.need };
    this.drawCard(r.name);
  }

  drawCard(name: string) {
    this.card?.destroy();
    const g = this.add.graphics();
    const rows = Object.keys(this.need);
    g.fillStyle(0xfff6e0).fillRoundedRect(-120, -40, 240, 70 + rows.length * 70, 20);
    g.lineStyle(5, 0x2b1d3a).strokeRoundedRect(-120, -40, 240, 70 + rows.length * 70, 20);
    const parts: Phaser.GameObjects.GameObject[] = [g, this.add.text(0, -8, name, TXT(26, '#ff595e', 4)).setOrigin(0.5)];
    rows.forEach((k, i) => {
      const ic = this.add.image(50, 50 + i * 70, k);
      ic.setScale(Math.min(56 / ic.width, 56 / ic.height));
      const left = this.need[k];
      parts.push(ic, this.add.text(-40, 50 + i * 70, left > 0 ? `× ${left}` : '✔', TXT(32, left > 0 ? '#2b1d3a' : '#8ac926', 0)).setOrigin(0.5));
    });
    this.card = this.add.container(150, 180, parts).setDepth(50);
  }

  spawn() {
    const needed = Object.keys(this.need).filter((k) => this.need[k] > 0);
    const tex = Math.random() < 0.55 && needed.length ? this.pick(needed) : this.pick(ALL);
    const fromLeft = Math.random() < 0.5;
    const o = new Living(this, fromLeft ? 340 : 1180, H + 40, tex, { scale: 1.15 * this.diff.size, mood: this.revolt ? 'angry' : 'happy' }).setDepth(30);
    o.setSize(o.iw * 1.3, o.ih * 1.3).setInteractive(new Phaser.Geom.Rectangle(-o.iw * 0.65, -o.ih * 0.65, o.iw * 1.3, o.ih * 1.3), Phaser.Geom.Rectangle.Contains);
    const sp = (this.revolt ? 1.3 : 1) * this.diff.speed;
    this.flies.push({ o, tex, vx: (fromLeft ? 1 : -1) * this.rnd(160, 330) * sp, vy: -this.rnd(720, 860) * Math.sqrt(sp), dead: false });
  }

  catchIt(f: Fly) {
    if (!this.playing || f.dead) return;
    f.dead = true;
    if ((this.need[f.tex] ?? 0) > 0) {
      this.need[f.tex]--;
      this.good(f.o.x, f.o.y, '+1');
      this.tweens.add({ targets: f.o, x: 150, y: 260, scale: 0.2, duration: 300, onComplete: () => f.o.destroy() });
      this.drawCard(this.recipes[this.recipeIdx % this.recipes.length].name);
      const done = Object.values(this.need).every((v) => v <= 0);
      if (!this.revolt && this.recipeIdx === 0 && Object.values(this.need).reduce((a, b) => a + b, 0) <= 2 && !this.isEasy) this.startRevolt();
      if (done) {
        Audio.sfx('ding');
        confetti(this, 150, 260, 30);
        this.recipeIdx++;
        this.addProgress(1);
        if (!this.ended) this.loadRecipe();
      }
    } else {
      f.o.setMood('tongue');
      this.tweens.add({ targets: f.o, scale: 0, duration: 250, onComplete: () => f.o.destroy() });
      this.mistake(f.o.x, f.o.y, f.tex in this.need ? 'כבר יש מספיק!' : 'זה לא במתכון!');
    }
  }

  startRevolt() {
    this.revolt = true;
    flash(this, 0xff595e);
    const banner = text(this, 640, 300, 'המרד של הירקות!', 64, '#ff595e', 10).setDepth(90).setAngle(-6);
    this.time.delayedCall(1200, () => banner.destroy());
    Audio.sfx('roar');
    this.flies.forEach((f) => f.o.setMood('angry'));
  }

  tick(dt: number) {
    this.spawnT -= dt;
    if (this.spawnT <= 0) {
      this.spawn();
      this.spawnT = (this.revolt ? 0.55 : 0.8) / this.diff.speed;
    }
    for (const f of [...this.flies]) {
      if (f.dead) {
        this.flies.splice(this.flies.indexOf(f), 1);
        continue;
      }
      f.vy += 800 * dt;
      f.o.x += f.vx * dt;
      f.o.y += f.vy * dt;
      f.o.angle += f.vx * 0.15 * dt;
      if (f.o.y > H + 80 && f.vy > 0) {
        f.dead = true;
        f.o.destroy();
      }
    }
  }

  hint() {
    for (const f of this.flies) if ((this.need[f.tex] ?? 0) > 0) sparkle(this, f.o.x, f.o.y, 6);
  }

  bot() {
    for (const f of this.flies) if (!f.dead && (this.need[f.tex] ?? 0) > 0 && f.o.y < 600) this.catchIt(f);
  }

  async winAnim() {
    this.hero?.celebrate();
    const s = this.add.image(640, 380, 'soup').setDepth(80).setScale(0);
    await tween(this, { targets: s, scale: 2, duration: 400, ease: 'Back.easeOut' });
    sparkle(this, 640, 330, 14);
    await wait(this, 1000);
  }

  async loseAnim() {
    const t = new Living(this, 640, 380, 'tomato', { scale: 1, mood: 'angry' }).setDepth(80);
    Audio.sfx('stretch');
    await tween(this, { targets: t, scale: 4.5, duration: 900, ease: 'Quad.easeIn' });
    explodeIntoConfetti(this, t, 90);
    Audio.sfx('confetti');
    popText(this, 640, 300, 'בום עגבנייה!', '#ff595e', 50);
    this.hero?.fall();
    await wait(this, 1300);
  }
}
