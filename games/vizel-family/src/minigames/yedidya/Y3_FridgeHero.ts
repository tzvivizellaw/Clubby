import Phaser from 'phaser';
import { Audio } from '../../audio/AudioManager';
import { confetti, popText, sparkle, tween, wait } from '../../animations/effects';
import { Living } from '../../animations/living';
import { CharacterRig } from '../../characters/CharacterRig';
import { BaseMiniGame } from '../../engine/BaseMiniGame';
import { TXT, bubble } from '../../engine/ui';

const LANES = [400, 640, 880];
const CATCH_Y = 560;
const COLORS: Record<string, { he: string; hex: number; foods: string[] }> = {
  red: { he: 'אדום', hex: 0xff595e, foods: ['tomato', 'apple'] },
  yellow: { he: 'צהוב', hex: 0xffca3a, foods: ['banana', 'pepper', 'cheese'] },
  green: { he: 'ירוק', hex: 0x8ac926, foods: ['cucumber'] },
};
const LYRICS = ['🎵 אני מקרר שר, קר לי וטוב לי 🎵', '🎵 תפסו רק {c}, אל תפספסו! 🎵', '🎵 לה לה לה, דלת פתוחה! 🎵'];

interface Food {
  o: Phaser.GameObjects.Image;
  lane: number;
  color: string;
  done: boolean;
}

/** Y3 — lane-catch foods of the colour the singing fridge asks for. */
export default class Y3_FridgeHero extends BaseMiniGame {
  yed!: CharacterRig;
  lane = 1;
  foods: Food[] = [];
  color = 'red';
  fridge!: Living;
  swatch!: Phaser.GameObjects.Arc;
  label!: Phaser.GameObjects.Text;
  spawnT = 0.5;
  colorT = 9;

  setup() {
    this.foods = [];
    this.lane = 1;
    this.spawnT = 0.6;
    this.colorT = 9;
    this.fridge = new Living(this, 640, 150, 'fridge', { scale: 0.55, eyeY: -0.25 }).setDepth(5);
    this.yed = new CharacterRig(this, LANES[1], 700, 'yedidya', 0.6).setDepth(20);
    this.yed.holdItem('plate', 0.6);
    this.swatch = this.add.circle(1120, 200, 44, 0xff595e).setStrokeStyle(6, 0x2b1d3a).setDepth(30);
    this.label = this.add.text(1120, 270, '', TXT(30)).setOrigin(0.5).setDepth(30);
    this.setColor(this.pick(Object.keys(COLORS)));
    this.setGoal(this.n(8, 4), 'tomato');
    this.setTimer(this.t(26));
    this.useMistakes();
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => this.move(p.x < this.yed.x - 60 ? -1 : p.x > this.yed.x + 60 ? 1 : 0));
    this.input.keyboard?.on('keydown-LEFT', () => this.move(-1));
    this.input.keyboard?.on('keydown-RIGHT', () => this.move(1));
  }

  setColor(c: string) {
    this.color = c;
    this.swatch.setFillStyle(COLORS[c].hex);
    this.label.setText(`רק ${COLORS[c].he}!`);
    this.tweens.add({ targets: this.swatch, scale: 1.4, duration: 150, yoyo: true, repeat: 2 });
    this.fridge.setMood('happy');
    const b = bubble(this, 640, 300, this.pick(LYRICS).replace('{c}', COLORS[c].he), { size: 24 });
    this.time.delayedCall(2000, () => b.destroy());
    Audio.say('narrator', `רק ${COLORS[c].he}!`, { subtitle: false, instruction: true });
  }

  move(d: number) {
    if (!this.playing || !d) return;
    const nl = Phaser.Math.Clamp(this.lane + d, 0, 2);
    if (nl === this.lane) return;
    this.lane = nl;
    this.yed.face2(d > 0 ? 1 : -1);
    this.tweens.add({ targets: this.yed, x: LANES[nl], duration: 140 });
    Audio.sfx('whoosh');
  }

  spawn() {
    const good = Math.random() < 0.55;
    const c = good ? this.color : this.pick(Object.keys(COLORS).filter((k) => k !== this.color));
    const lane = this.rnd(0, 2);
    const o = this.add.image(LANES[lane], 210, this.pick(COLORS[c].foods)).setDepth(15);
    o.setScale(Math.min(80 / o.width, 80 / o.height) * this.diff.size);
    this.fridge.setMood('tongue', 300);
    this.foods.push({ o, lane, color: c, done: false });
  }

  tick(dt: number) {
    this.spawnT -= dt;
    if (this.spawnT <= 0) {
      this.spawn();
      this.spawnT = (this.isToddler ? 1.6 : 1.1) / this.diff.speed;
    }
    this.colorT -= dt;
    if (this.colorT <= 0) {
      this.colorT = 9;
      this.setColor(this.pick(Object.keys(COLORS).filter((k) => k !== this.color)));
    }
    const v = this.s(230);
    for (const f of [...this.foods]) {
      f.o.y += v * dt;
      f.o.angle += 60 * dt;
      if (!f.done && f.lane === this.lane && f.o.y > CATCH_Y - 40 && f.o.y < CATCH_Y + 30) {
        f.done = true;
        this.foods.splice(this.foods.indexOf(f), 1);
        this.tweens.add({ targets: f.o, y: this.yed.y - 150, scale: 0.3, duration: 120, onComplete: () => f.o.destroy() });
        if (f.color === this.color) {
          this.good(f.o.x, f.o.y, 'יאמי!');
          this.addProgress(1);
        } else this.mistake(f.o.x, f.o.y, `זה ${COLORS[f.color].he}!`);
      } else if (f.o.y > 760) {
        this.foods.splice(this.foods.indexOf(f), 1);
        f.o.destroy();
      }
    }
  }

  hint() {
    for (const f of this.foods) if (f.color === this.color) sparkle(this, f.o.x, f.o.y, 5);
  }

  bot(dt: number) {
    this.botTimer -= dt;
    if (this.botTimer > 0) return;
    this.botTimer = 0.1;
    const goods = this.foods.filter((f) => f.color === this.color && f.o.y < CATCH_Y - 30).sort((a, b) => b.o.y - a.o.y);
    const bads = this.foods.filter((f) => f.color !== this.color && f.o.y < CATCH_Y + 20 && f.o.y > CATCH_Y - 200);
    let want = goods[0]?.lane ?? this.lane;
    if (bads.some((b) => b.lane === want)) want = [0, 1, 2].find((l) => !bads.some((b) => b.lane === l)) ?? want;
    if (want !== this.lane) this.move(Math.sign(want - this.lane));
  }

  async winAnim() {
    this.fridge.setMood('happy');
    await tween(this, { targets: this.fridge, angle: 20, duration: 300, yoyo: true });
    popText(this, 640, 300, '🎵 תודה תודה! 🎵', '#ffe14d', 44);
    confetti(this, 640, 300, 50);
    this.yed.celebrate();
    await wait(this, 1200);
  }

  async loseAnim() {
    const m = this.add.image(640, 200, 'milk').setDepth(40);
    await tween(this, { targets: m, x: this.yed.x, y: this.yed.y - 200, angle: 180, duration: 400 });
    const drip = this.add.ellipse(this.yed.x, this.yed.y - 220, 140, 60, 0xffffff).setDepth(41);
    void drip;
    this.yed.setExpr('dizzy');
    Audio.sfx('splash');
    await wait(this, 1200);
  }
}
