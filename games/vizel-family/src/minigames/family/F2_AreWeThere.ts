import Phaser from 'phaser';
import { Audio } from '../../audio/AudioManager';
import { confetti, dust, popText, shake, tween, wait } from '../../animations/effects';
import { Living } from '../../animations/living';
import { CharacterRig } from '../../characters/CharacterRig';
import type { CastId } from '../../data/characters';
import { BaseMiniGame, H } from '../../engine/BaseMiniGame';
import { TXT, bubble } from '../../engine/ui';

const LANES = [190, 380, 570];
const CAR_Y = 600;
const OBST = ['cone', 'basketball', 'duck', 'chicken'];
const GPS = ['פנה ימינה!', 'לא, שמאלה!', 'בעצם... תחזור הביתה', 'אני מחשבת מסלול... אולי', 'מי שאל אותי בכלל?'];

interface Kid {
  rig: CharacterRig;
  want: 'snack' | 'question' | null;
  timer: number;
  b?: Phaser.GameObjects.Container;
}

/** F2 — lane driving + answering the kids in the back seat; the GPS argues with everyone. */
export default class F2_AreWeThere extends BaseMiniGame {
  car!: Living;
  lane = 1;
  obstacles: Phaser.GameObjects.Image[] = [];
  kids: Kid[] = [];
  patience = 100;
  patienceG!: Phaser.GameObjects.Graphics;
  road!: Phaser.GameObjects.Graphics;
  scroll = 0;
  spawnT = 1;
  askT = 2;
  gps!: Living;
  hitCool = 0;

  setup() {
    this.obstacles = [];
    this.kids = [];
    this.patience = 100;
    this.lane = 1;
    this.spawnT = 1.2;
    this.askT = 2;
    this.hitCool = 0;
    this.road = this.add.graphics().setDepth(1);
    this.drawRoad();
    this.car = new Living(this, LANES[1], CAR_Y, 'car_top', { scale: 1.05, eyeY: -0.36, eyeSpread: 18, eyeSize: 9, mouth: false }).setDepth(20);
    // back seat panel
    const panel = this.add.graphics().setDepth(5);
    panel.fillStyle(0x343a40).fillRoundedRect(720, 150, 540, 540, 30);
    panel.lineStyle(6, 0x2b1d3a).strokeRoundedRect(720, 150, 540, 540, 30);
    panel.fillStyle(0x6c757d).fillRoundedRect(740, 470, 500, 200, 20);
    const who: CastId[] = this.player === 'esti' ? ['avigail', 'daniel', 'yedidya'] : (['avigail', 'daniel', 'yedidya', 'esti'] as CastId[]).filter((k) => k !== this.player).slice(0, 3);
    who.forEach((id, i) => {
      const rig = new CharacterRig(this, 820 + i * 170, 640, id, 0.75).setDepth(8);
      rig.setInteractive(new Phaser.Geom.Rectangle(-70, -330, 140, 330), Phaser.Geom.Rectangle.Contains);
      const kid: Kid = { rig, want: null, timer: 0 };
      rig.on('pointerdown', () => this.answer(kid));
      this.kids.push(kid);
    });
    this.gps = new Living(this, 990, 220, 'phone', { scale: 1.1, mood: 'smug' }).setDepth(9);
    this.add.text(990, 290, 'ניווט', TXT(20)).setOrigin(0.5).setDepth(9);
    this.patienceG = this.add.graphics().setDepth(30);
    this.add.text(990, 160, 'הסבלנות של אבא', TXT(22)).setOrigin(0.5).setDepth(30);
    this.drawPatience();
    this.setTimer(this.t(30), 'win');
    // controls: tap left/right half of the road, swipe, or arrows
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (!this.playing || p.x > 700) return;
      this.steer(p.x < this.car.x ? -1 : 1);
    });
    this.input.keyboard?.on('keydown-LEFT', () => this.steer(-1));
    this.input.keyboard?.on('keydown-RIGHT', () => this.steer(1));
  }

  onStart() {
    this.time.addEvent({
      delay: 4200, loop: true,
      callback: () => {
        if (!this.playing) return;
        this.gps.setMood(this.pick(['smug', 'angry', 'tongue']));
        const b = bubble(this, 990, 120, this.pick(GPS), { size: 20, tail: 'down' });
        this.time.delayedCall(1800, () => b.destroy());
      },
    });
  }

  dashes: Phaser.GameObjects.Rectangle[] = [];

  drawRoad() {
    const g = this.road;
    g.clear();
    g.fillStyle(0x52b788).fillRect(0, 100, 700, 620);
    g.fillStyle(0x495057).fillRect(90, 100, 580, 620);
    g.lineStyle(6, 0x2b1d3a).strokeRect(90, 100, 580, 620);
    this.dashes = [];
    for (let y = 100; y < H + 80; y += 80) for (const x of [286, 476]) this.dashes.push(this.add.rectangle(x, y, 8, 44, 0xffffff).setDepth(2));
  }

  moveDashes(d: number) {
    for (const r of this.dashes) {
      r.y += d;
      if (r.y > H + 40) r.y -= (this.dashes.length / 2) * 80;
      r.setVisible(r.y > 120);
    }
  }

  drawPatience() {
    const g = this.patienceG;
    const f = this.patience / 100;
    g.clear();
    g.fillStyle(0x2b1d3a).fillRoundedRect(790, 176, 400, 26, 12);
    g.fillStyle(f > 0.5 ? 0x8ac926 : f > 0.25 ? 0xffca3a : 0xff595e).fillRoundedRect(794, 180, 392 * f, 18, 9);
  }

  steer(d: number) {
    if (!this.playing) return;
    const nl = Phaser.Math.Clamp(this.lane + d, 0, 2);
    if (nl === this.lane) return;
    this.lane = nl;
    Audio.sfx('whoosh');
    this.tweens.add({ targets: this.car, x: LANES[nl], angle: { from: d * 12, to: 0 }, duration: 160 });
  }

  answer(k: Kid) {
    if (!this.playing || !k.want) return;
    if (k.want === 'snack') {
      const c = this.add.image(990, 330, 'cookie').setDepth(40).setScale(0.6);
      this.tweens.add({ targets: c, x: k.rig.x, y: k.rig.y - 180, duration: 250, onComplete: () => c.destroy() });
      popText(this, k.rig.x, 420, 'יאמי!', '#8ac926', 30);
    } else popText(this, k.rig.x, 420, 'עוד 5 דקות!', '#8ac926', 26);
    k.want = null;
    k.b?.destroy();
    k.rig.setExpr('happy', 900);
    this.good();
  }

  lowerPatience(n: number, x: number, y: number, label: string) {
    this.patience = Math.max(0, this.patience - n);
    this.drawPatience();
    popText(this, x, y, label, '#ff595e', 30);
    Audio.sfx('wrong');
    this.hero?.shock();
    if (this.patience <= 0) this.lose();
  }

  tick(dt: number) {
    const speed = this.s(330);
    this.scroll += speed * dt;
    this.moveDashes(speed * dt);
    this.hitCool -= dt;
    this.spawnT -= dt;
    if (this.spawnT <= 0) {
      const lanes = Phaser.Utils.Array.Shuffle([0, 1, 2]).slice(0, Math.random() < 0.25 && !this.isEasy ? 2 : 1);
      for (const l of lanes) {
        const o = this.add.image(LANES[l], 60, this.pick(OBST)).setDepth(15);
        o.setScale(Math.min(90 / o.width, 90 / o.height));
        (o as any).lane = l;
        this.obstacles.push(o);
      }
      this.spawnT = (this.isEasy ? 1.6 : 1.1) / this.diff.speed;
    }
    for (const o of [...this.obstacles]) {
      o.y += speed * dt;
      if (this.hitCool <= 0 && Math.abs(o.y - CAR_Y) < 70 && (o as any).lane === this.lane) {
        this.hitCool = 0.8;
        this.obstacles.splice(this.obstacles.indexOf(o), 1);
        dust(this, o.x, o.y);
        shake(this, 0.01, 200);
        this.car.setMood('shock', 600);
        this.tweens.add({ targets: o, x: o.x + 300, y: o.y - 200, angle: 400, alpha: 0, duration: 500, onComplete: () => o.destroy() });
        this.lowerPatience(this.isEasy ? 15 : 22, o.x, o.y - 40, 'בום!');
      } else if (o.y > H + 60) {
        this.obstacles.splice(this.obstacles.indexOf(o), 1);
        o.destroy();
      }
    }
    // kids' requests
    this.askT -= dt;
    if (this.askT <= 0) {
      const free = this.kids.filter((k) => !k.want);
      if (free.length) {
        const k = this.pick(free);
        k.want = Math.random() < 0.5 ? 'snack' : 'question';
        k.timer = this.isEasy ? 6 : 4.2 / this.diff.speed + 0.8;
        k.b = bubble(this, k.rig.x, 330, k.want === 'snack' ? 'אני רעב! 🍪' : 'מתי מגיעים?!', { size: 22 });
        k.b.setDepth(35);
        k.rig.setExpr('shout', 800);
        Audio.sfx('pop');
      }
      this.askT = (this.isEasy ? 3.4 : 2.4) / this.diff.speed;
    }
    for (const k of this.kids) {
      if (!k.want) continue;
      k.timer -= dt;
      if (k.timer <= 0) {
        k.want = null;
        k.b?.destroy();
        k.rig.cry(900);
        this.lowerPatience(this.isEasy ? 12 : 18, k.rig.x, 420, 'בכי!');
      }
    }
  }

  hint() {
    const k = this.kids.find((x) => x.want);
    if (k) this.tweens.add({ targets: k.rig, scale: k.rig.scale * 1.15, duration: 150, yoyo: true, repeat: 2 });
  }

  bot(dt: number) {
    for (const k of this.kids) if (k.want && k.timer < 3) this.answer(k);
    this.botTimer -= dt;
    if (this.botTimer > 0) return;
    // distance to the nearest obstacle ahead in each lane; drive toward the clearest lane
    const clear = (l: number) => {
      const ys = this.obstacles.filter((o) => (o as any).lane === l && o.y < CAR_Y + 40).map((o) => CAR_Y - o.y);
      return ys.length ? Math.min(...ys.filter((d) => d > -40).concat(9999)) : 9999;
    };
    if (clear(this.lane) > 320) return;
    const best = [0, 1, 2].sort((a, b) => clear(b) - clear(a) || Math.abs(a - this.lane) - Math.abs(b - this.lane))[0];
    if (best !== this.lane && clear(this.lane + Math.sign(best - this.lane)) > 60) this.steer(Math.sign(best - this.lane));
    this.botTimer = 0.12;
  }

  async winAnim() {
    Audio.sfx('honk');
    confetti(this, this.car.x, 300, 60);
    this.car.setMood('happy');
    await tween(this, { targets: this.car, y: -150, duration: 900, ease: 'Quad.easeIn' });
  }

  async loseAnim() {
    Audio.say('father.what_is_going_on');
    await tween(this, { targets: this.car, angle: 720, duration: 900 });
    this.kids.forEach((k) => k.rig.cry(1000));
    await wait(this, 600);
  }
}
