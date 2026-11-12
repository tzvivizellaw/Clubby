import Phaser from 'phaser';
import { Audio } from '../../audio/AudioManager';
import { confetti, popText, sparkle, tween, wait, zzz } from '../../animations/effects';
import { Living } from '../../animations/living';
import { BaseMiniGame } from '../../engine/BaseMiniGame';

const PAIRS: { a: string; home: string; sfx: any }[] = [
  { a: 'dog', home: 'doghouse', sfx: 'woof' },
  { a: 'bird', home: 'nest', sfx: 'tweet' },
  { a: 'fish', home: 'fishbowl', sfx: 'splash' },
  { a: 'cow', home: 'barn', sfx: 'moo' },
  { a: 'frog', home: 'pond', sfx: 'ribbit' },
  { a: 'bee', home: 'hive', sfx: 'buzz' },
];

interface Item {
  o: Living;
  a: string;
  home: string;
  done: boolean;
}

/** E5 — drag each animal to its home; an elephant tries to sleep in the bird's nest. */
export default class E5_WhoSleepsWhere extends BaseMiniGame {
  items: Item[] = [];
  homes: { o: Phaser.GameObjects.Image; home: string }[] = [];
  round = 0;
  rounds = 2;
  gagDone = false;
  objs: Phaser.GameObjects.GameObject[] = [];

  setup() {
    this.round = 0;
    this.gagDone = false;
    this.rounds = this.isToddler ? 2 : 3;
    this.addHero(1180, 710, 0.6);
    this.setGoal(this.rounds * 3, 'nest');
  }

  onStart() {
    this.newRound();
  }

  newRound() {
    this.objs.forEach((o) => o.destroy());
    this.objs = [];
    this.items = [];
    this.homes = [];
    const set = Phaser.Utils.Array.Shuffle([...PAIRS]).slice(0, 3);
    const homeOrder = Phaser.Utils.Array.Shuffle([...set]);
    homeOrder.forEach((p, i) => {
      const h = this.add.image(250 + i * 390, 300, p.home).setDepth(5);
      h.setScale(Math.min(220 / h.width, 170 / h.height));
      this.homes.push({ o: h, home: p.home });
      this.objs.push(h);
    });
    set.forEach((p, i) => {
      const o = new Living(this, 250 + i * 390, 590, p.a, { scale: 1.5, eyes: false, mouth: false }).setDepth(20);
      const it: Item = { o, a: p.a, home: p.home, done: false };
      this.items.push(it);
      this.objs.push(o);
      this.draggable(o, (x, y) => this.drop(it, x, y), { hit: new Phaser.Geom.Rectangle(-60, -60, 120, 120), onPick: () => Audio.sfx(p.sfx) });
    });
  }

  drop(it: Item, x: number, y: number): boolean {
    const h = this.homes.find((hh) => Phaser.Math.Distance.Between(x, y, hh.o.x, hh.o.y) < 150);
    if (!h) return false;
    if (h.home !== it.home) {
      it.o.wobble();
      sparkle(this, this.homes.find((hh) => hh.home === it.home)!.o.x, 300, 8);
      return false;
    }
    this.place(it);
    return true;
  }

  async place(it: Item) {
    if (it.done) return;
    it.done = true;
    const h = this.homes.find((hh) => hh.home === it.home)!;
    it.o.disableInteractive();
    this.tweens.add({ targets: it.o, x: h.o.x, y: h.o.y + 10, scale: 0.9, duration: 250 });
    zzz(this, h.o.x + 40, h.o.y - 60);
    this.good(h.o.x, h.o.y - 100, 'לילה טוב!');
    this.addProgress(1);
    if (this.items.every((i) => i.done) && !this.ended) {
      // the elephant gag (once): tries to sleep in the nest
      if (!this.gagDone) {
        this.gagDone = true;
        const el = this.add.image(1400, 300, 'elephant').setDepth(30).setScale(1.6);
        await tween(this, { targets: el, x: 900, duration: 700 });
        popText(this, 900, 140, 'פיל בקן?! לא מתאים!', '#ffe14d', 36);
        Audio.sfx('trumpet');
        await tween(this, { targets: el, scaleY: 1.1, scaleX: 2, duration: 250, yoyo: true });
        await tween(this, { targets: el, x: -200, duration: 700 });
        el.destroy();
      }
      this.round++;
      if (this.round < this.rounds && !this.ended) this.time.delayedCall(300, () => this.newRound());
    }
  }

  hint() {
    const it = this.items.find((i) => !i.done);
    if (it) sparkle(this, this.homes.find((h) => h.home === it.home)!.o.x, 300, 10);
  }

  bot(dt: number) {
    this.botTimer -= dt;
    if (this.botTimer > 0) return;
    this.botTimer = 0.5;
    const it = this.items.find((i) => !i.done);
    if (it) this.place(it);
  }

  async winAnim() {
    for (const h of this.homes) zzz(this, h.o.x, h.o.y - 60);
    Audio.sfx('snore');
    confetti(this, 640, 250, 50);
    this.hero?.celebrate();
    await wait(this, 1500);
  }
}
