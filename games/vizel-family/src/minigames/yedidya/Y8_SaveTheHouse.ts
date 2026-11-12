import Phaser from 'phaser';
import { Audio } from '../../audio/AudioManager';
import { confetti, popText, sparkle, splash, tween, wait } from '../../animations/effects';
import { Living } from '../../animations/living';
import { CharacterRig } from '../../characters/CharacterRig';
import { BaseMiniGame, W } from '../../engine/BaseMiniGame';
import { text } from '../../engine/ui';

/** Y8 — three tasks in a row against a cartoon flood: close taps, plug leaks, pump the water out. */
export default class Y8_SaveTheHouse extends BaseMiniGame {
  level = 0; // 0..100
  water!: Phaser.GameObjects.Rectangle;
  task = 0;
  objs: Phaser.GameObjects.GameObject[] = [];
  taps: { o: Living; turns: number; spray: Phaser.Time.TimerEvent }[] = [];
  holes: { x: number; y: number; done: boolean; spray: Phaser.Time.TimerEvent }[] = [];
  plugs: Phaser.GameObjects.Image[] = [];
  pump?: Phaser.GameObjects.Image;
  title?: Phaser.GameObjects.Text;
  yed!: CharacterRig;

  setup() {
    this.level = 10;
    this.task = 0;
    this.water = this.add.rectangle(W / 2, 720, W, 0, 0x4cc9f0, 0.55).setOrigin(0.5, 1).setDepth(40);
    this.add.line(0, 0, 0, 150, W, 150, 0xff595e).setOrigin(0).setLineWidth(4).setDepth(41);
    this.yed = new CharacterRig(this, 120, 700, 'yedidya', 0.5).setDepth(30);
    this.setGoal(3, 'faucet', false);
  }

  onStart() {
    this.startTask();
  }

  clear() {
    this.objs.forEach((o) => o.destroy());
    this.objs = [];
    this.taps.forEach((t) => t.spray.remove());
    this.holes.forEach((h) => h.spray.remove());
    this.taps = [];
    this.holes = [];
    this.plugs = [];
    this.pump = undefined;
  }

  startTask() {
    this.clear();
    this.title?.destroy();
    const titles = ['1: לוחצים פעמיים על כל ברז!', '2: גוררים פקק לכל חור!', '3: לוחצים מהר על המשאבה!'];
    this.title = text(this, 640, 200, titles[this.task], 38, '#ffe14d', 8).setDepth(50);
    Audio.sfx('whoosh');
    if (this.task === 0) {
      const n = this.isToddler ? 2 : 3;
      for (let i = 0; i < n; i++) {
        const x = 330 + i * 300;
        const o = new Living(this, x, 380, 'faucet', { scale: 1.3 * this.diff.size, mood: 'shock', eyeX: -0.1 }).setDepth(20);
        const spray = this.time.addEvent({ delay: 250, loop: true, callback: () => splash(this, x + 50, 440, 2) });
        const t = { o, turns: 0, spray };
        o.tap(() => this.turnTap(t));
        this.taps.push(t);
        this.objs.push(o);
      }
    } else if (this.task === 1) {
      const pipe = this.add.rectangle(640, 360, 900, 50, 0x8d99ae).setStrokeStyle(5, 0x2b1d3a).setDepth(15);
      this.objs.push(pipe);
      const n = this.isToddler ? 2 : 3;
      for (let i = 0; i < n; i++) {
        const x = 360 + i * 280;
        const hole = this.add.circle(x, 360, 14, 0x2b1d3a).setDepth(16);
        const spray = this.time.addEvent({ delay: 200, loop: true, callback: () => splash(this, x, 340, 2) });
        this.holes.push({ x, y: 360, done: false, spray });
        this.objs.push(hole);
        const plug = this.add.image(300 + i * 300, 600, 'plug').setScale(1.3 * this.diff.size).setDepth(45);
        this.plugs.push(plug);
        this.objs.push(plug);
        this.draggable(plug, (px, py) => {
          const h = this.holes.find((hh) => !hh.done && Phaser.Math.Distance.Between(px, py, hh.x, hh.y) < 70);
          if (!h) return false;
          this.plugHole(h, plug);
          return true;
        });
      }
    } else {
      this.pump = this.add.image(640, 470, 'pump').setScale(1.3).setDepth(45).setInteractive();
      this.pump.on('pointerdown', () => this.pumpIt());
      this.objs.push(this.pump);
    }
  }

  turnTap(t: { o: Living; turns: number; spray: Phaser.Time.TimerEvent }) {
    if (!this.playing || t.turns >= 2) return;
    t.turns++;
    Audio.sfx('click');
    this.tweens.add({ targets: t.o, angle: t.turns * 25, duration: 120 });
    if (t.turns >= 2) {
      t.spray.remove();
      t.o.setMood('happy');
      this.good(t.o.x, t.o.y - 80, 'נסגר!');
      if (this.taps.every((x) => x.turns >= 2)) this.nextTask();
    }
  }

  plugHole(h: { x: number; y: number; done: boolean; spray: Phaser.Time.TimerEvent }, plug: Phaser.GameObjects.Image) {
    if (!this.playing || h.done) return;
    h.done = true;
    h.spray.remove();
    plug.disableInteractive();
    this.tweens.add({ targets: plug, x: h.x, y: h.y, angle: 0, scale: 0.9, duration: 120 });
    this.good(h.x, h.y - 70, 'נסתם!');
    if (this.holes.every((x) => x.done)) this.nextTask();
  }

  pumpIt() {
    if (!this.playing || this.task !== 2 || !this.pump) return;
    this.level = Math.max(0, this.level - (this.isEasy ? 6 : 4.5));
    Audio.sfx('splash');
    this.tweens.add({ targets: this.pump, scaleY: 1.1, duration: 60, yoyo: true });
    splash(this, 720, 380, 3);
    if (this.level <= 0) this.win();
  }

  nextTask() {
    this.task++;
    this.addProgress(1);
    if (this.task < 3) this.time.delayedCall(500, () => this.playing && this.startTask());
    else this.startTask();
  }

  tick(dt: number) {
    let rate = this.task === 0 ? 2.2 + this.taps.filter((t) => t.turns < 2).length * 1.4 : this.task === 1 ? 2 + this.holes.filter((h) => !h.done).length * 1.2 : 2.4;
    rate *= this.diff.speed * (this.isToddler ? 0.5 : 1);
    this.level = Math.min(100, this.level + rate * dt);
    this.water.height = (this.level / 100) * 570;
    if (this.level >= 100) this.lose();
  }

  hint() {
    if (this.task === 0) this.taps.filter((t) => t.turns < 2).forEach((t) => sparkle(this, t.o.x, t.o.y, 6));
    if (this.task === 1) this.holes.filter((h) => !h.done).forEach((h) => sparkle(this, h.x, h.y, 6));
  }

  bot(dt: number) {
    this.botTimer -= dt;
    if (this.botTimer > 0) return;
    this.botTimer = 0.12;
    if (this.task === 0) {
      const t = this.taps.find((x) => x.turns < 2);
      if (t) this.turnTap(t);
    } else if (this.task === 1) {
      const h = this.holes.find((x) => !x.done);
      const p = this.plugs.find((x) => x.input?.enabled);
      if (h && p) this.plugHole(h, p);
    } else this.pumpIt();
  }

  async winAnim() {
    this.clear();
    await tween(this, { targets: this.water, height: 0, duration: 500 });
    this.yed.fly(true);
    await tween(this, { targets: this.yed, y: 400, x: 640, duration: 600 });
    confetti(this, 640, 300, 70);
    popText(this, 640, 250, 'הבית הוצל!', '#ffe14d', 52);
    await wait(this, 1100);
  }

  async loseAnim() {
    const d = new Living(this, 640, 330, 'duck', { scale: 3 }).setDepth(45);
    this.tweens.add({ targets: d, angle: { from: -10, to: 10 }, duration: 300, yoyo: true, repeat: 3 });
    Audio.sfx('quack');
    await wait(this, 1400);
  }
}
