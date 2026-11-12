import Phaser from 'phaser';
import { Audio } from '../../audio/AudioManager';
import { popText, sparkle, tween, wait, zzz } from '../../animations/effects';
import { CharacterRig } from '../../characters/CharacterRig';
import type { CastId } from '../../data/characters';
import { BaseMiniGame, W } from '../../engine/BaseMiniGame';
import { TXT, bubble } from '../../engine/ui';

interface Kid {
  rig: CharacterRig;
  awake: boolean;
  bedX: number;
}

const BED_Y = 520;
const KIDS: CastId[] = ['avigail', 'daniel', 'yedidya', 'esti'];
const TOYS = ['toycar', 'dino', 'basketball', 'block_r', 'teddy', 'block_b'];

/** F7 — put kids to sleep, collect toys, switch off the light, before dad falls asleep first. */
export default class F7_GoodNight extends BaseMiniGame {
  kids: Kid[] = [];
  toys: Phaser.GameObjects.Image[] = [];
  sleepy = 0;
  meter!: Phaser.GameObjects.Graphics;
  dad!: CharacterRig;
  switchBtn!: Phaser.GameObjects.Image;
  wakeT = 3;
  dark!: Phaser.GameObjects.Rectangle;

  setup() {
    this.kids = [];
    this.toys = [];
    this.sleepy = 0;
    this.wakeT = 3;
    const n = this.isToddler ? 2 : this.diff.tier === 'easy' ? 3 : 4;
    const xs = [200, 450, 700, 950].slice(0, n);
    xs.forEach((x, i) => {
      this.add.image(x, BED_Y + 40, 'bed').setScale(0.95, 0.8).setDepth(3);
      const rig = new CharacterRig(this, x, BED_Y + 20, KIDS[i], 0.62).setDepth(6);
      rig.setInteractive(new Phaser.Geom.Rectangle(-90, -330, 180, 360), Phaser.Geom.Rectangle.Contains);
      const k: Kid = { rig, awake: true, bedX: x };
      rig.on('pointerdown', () => this.tuck(k));
      this.kids.push(k);
      this.bounce(k);
    });
    const tc = this.n(5, 2);
    for (let i = 0; i < tc; i++) {
      const t = this.add.image(this.rnd(120, 1050), this.rnd(620, 690), TOYS[i % TOYS.length]).setDepth(8);
      t.setScale(Math.min(70 / t.width, 70 / t.height) * this.diff.size).setInteractive();
      t.on('pointerdown', () => this.collect(t));
      this.toys.push(t);
    }
    this.add.image(1180, 640, 'toybox').setScale(0.8).setDepth(7);
    this.switchBtn = this.add.image(1180, 330, 'lightswitch').setScale(1.4 * this.diff.size).setDepth(7).setInteractive();
    this.switchBtn.on('pointerdown', () => this.lightsOut());
    this.dad = new CharacterRig(this, 1180, 560, 'father', 0.45).setDepth(5);
    this.meter = this.add.graphics().setDepth(30);
    this.add.text(1050, 150, 'העייפות של אבא', TXT(22)).setOrigin(0.5).setDepth(30);
    this.dark = this.add.rectangle(640, 360, W, 720, 0x000000, 0).setDepth(60);
    this.drawMeter();
  }

  bounce(k: Kid) {
    this.tweens.killTweensOf(k.rig);
    k.rig.setAngle(0).setPosition(k.bedX, BED_Y + 20);
    k.rig.sleep(false);
    k.rig.setExpr('laugh');
    this.tweens.add({ targets: k.rig, y: BED_Y - 30, duration: 260, yoyo: true, repeat: -1, ease: 'Quad.easeOut' });
  }

  tuck(k: Kid) {
    if (!this.playing || !k.awake) return;
    k.awake = false;
    this.tweens.killTweensOf(k.rig);
    Audio.sfx('pop');
    k.rig.setPosition(k.bedX - 10, BED_Y + 20).setAngle(-80);
    k.rig.sleep(true);
    this.good(k.bedX, BED_Y - 60, 'לילה טוב!');
    // twist: a sleeping kid may wake another one (less likely as time passes)
    const p = 0.55 * Math.max(0, 1 - this.elapsed / (this.isEasy ? 18 : 28));
    const sleepers = this.kids.filter((x) => !x.awake && x !== k);
    if (sleepers.length && Math.random() < p) {
      this.time.delayedCall(500, () => {
        if (!this.playing) return;
        const w = this.pick(sleepers);
        if (!w.awake) this.wake(w);
      });
    }
  }

  wake(k: Kid) {
    k.awake = true;
    const b = bubble(this, k.bedX, 250, this.pick(['אבאאא!', 'אני צמא!', 'עוד סיפור!', 'אני לא עייף!']), { size: 24 });
    this.time.delayedCall(1200, () => b.destroy());
    Audio.say(k.rig.cid === 'esti' ? 'esti.abba' : k.rig.cid === 'yedidya' ? 'yedidya.one_more_story' : k.rig.cid, undefined, { subtitle: false });
    this.bounce(k);
  }

  collect(t: Phaser.GameObjects.Image) {
    if (!this.playing || !t.active || !this.toys.includes(t)) return;
    this.toys.splice(this.toys.indexOf(t), 1);
    Audio.sfx('whoosh');
    t.disableInteractive();
    this.tweens.add({ targets: t, x: 1180, y: 620, scale: 0.2, angle: 360, duration: 350, onComplete: () => t.destroy() });
  }

  lightsOut() {
    if (!this.playing) return;
    const awake = this.kids.filter((k) => k.awake).length;
    if (awake || this.toys.length) {
      popText(this, 1180, 260, awake ? 'עוד לא כולם ישנים!' : 'יש צעצועים על הרצפה!', '#ffbe0b', 26);
      Audio.sfx('wrong');
      if (this.toys.length) this.toys.forEach((t) => sparkle(this, t.x, t.y, 4));
      return;
    }
    this.win();
  }

  drawMeter() {
    const g = this.meter;
    const f = Phaser.Math.Clamp(this.sleepy / 100, 0, 1);
    g.clear();
    g.fillStyle(0x2b1d3a).fillRoundedRect(850, 170, 400, 26, 12);
    g.fillStyle(f < 0.5 ? 0x8ecae6 : f < 0.8 ? 0xb388eb : 0x6a4c93).fillRoundedRect(854, 174, 392 * f, 18, 9);
  }

  tick(dt: number) {
    const awake = this.kids.filter((k) => k.awake).length;
    const rate = (this.isEasy ? 1.0 : 1.5) + awake * (this.isEasy ? 0.45 : 0.8);
    this.sleepy += rate * dt * this.diff.speed * (100 / 60);
    this.drawMeter();
    if (this.sleepy > 70 && Math.random() < dt) zzz(this, this.dad.x, this.dad.y - 160);
    this.dad.setExpr(this.sleepy > 70 ? 'sleep' : 'smile');
    if (this.sleepy >= 100) return this.lose();
    // random wake-ups early on
    this.wakeT -= dt;
    if (this.wakeT <= 0) {
      this.wakeT = this.rnd(4, 7);
      const sleepers = this.kids.filter((k) => !k.awake);
      if (sleepers.length && this.elapsed < (this.isEasy ? 15 : 24) && Math.random() < 0.6) this.wake(this.pick(sleepers));
    }
  }

  hint() {
    const k = this.kids.find((x) => x.awake);
    if (k) sparkle(this, k.bedX, BED_Y - 100, 10);
  }

  bot(dt: number) {
    this.botTimer -= dt;
    if (this.botTimer > 0) return;
    this.botTimer = 0.3;
    const k = this.kids.find((x) => x.awake);
    if (k) return this.tuck(k);
    if (this.toys.length) return this.collect(this.toys[0]);
    this.lightsOut();
  }

  async winAnim() {
    Audio.sfx('click');
    await tween(this, { targets: this.dark, fillAlpha: 0.75, duration: 400 });
    Audio.sfx('snore');
    this.dad.sleep(true);
    await wait(this, 1400);
  }

  async loseAnim() {
    this.dad.sleep(true);
    await tween(this, { targets: this.dad, angle: -90, y: 650, duration: 400 });
    Audio.sfx('snore');
    this.kids.forEach((k) => k.awake || this.wake(k));
    await wait(this, 1400);
  }
}
