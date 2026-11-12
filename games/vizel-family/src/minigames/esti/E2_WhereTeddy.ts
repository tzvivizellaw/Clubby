import Phaser from 'phaser';
import { Audio } from '../../audio/AudioManager';
import { confetti, popText, sparkle, tween, wait } from '../../animations/effects';
import { Living } from '../../animations/living';
import { BaseMiniGame } from '../../engine/BaseMiniGame';

const SPOTS = [
  { x: 250, y: 520, tex: 'pillow_r', s: 1.8 },
  { x: 520, y: 520, tex: 'toybox', s: 1.2 },
  { x: 790, y: 520, tex: 'basket', s: 1.3 },
  { x: 1060, y: 520, tex: 'pillow_b', s: 1.8 },
];
const SURPRISES = ['cat', 'sock_r', 'duck', 'banana', 'shoe_y'];

/** E2 — find the teddy (its ear wiggles); final twist: the teddy hides behind a bigger teddy. */
export default class E2_WhereTeddy extends BaseMiniGame {
  covers: Phaser.GameObjects.Image[] = [];
  where = 0;
  ear?: Phaser.GameObjects.Image;
  locked = true;
  round = 0;

  setup() {
    this.round = 0;
    this.addHero(1180, 710, 0.6);
    this.setGoal(this.n(4, 3), 'teddy');
  }

  onStart() {
    this.newRound();
  }

  newRound() {
    this.covers.forEach((c) => c.destroy());
    this.ear?.destroy();
    this.covers = [];
    const last = this.goal - this.progress === 1;
    this.where = this.rnd(0, SPOTS.length - 1);
    SPOTS.forEach((sp, i) => {
      // twist on the last round: one of the hiding places is a giant teddy cut-out
      const tex = last && i === this.where ? 'teddy' : sp.tex;
      const c = this.add.image(sp.x, sp.y, tex).setScale(last && i === this.where ? 2.2 : sp.s).setDepth(12).setInteractive();
      c.on('pointerdown', () => this.look(i));
      this.covers.push(c);
    });
    const sp = SPOTS[this.where];
    this.ear = this.add.image(sp.x + 40, sp.y - 80, 'teddy').setScale(0.5).setDepth(11).setCrop(0, 0, 86, 40);
    this.tweens.add({ targets: this.ear, angle: { from: -12, to: 12 }, duration: 300, yoyo: true, repeat: -1 });
    this.locked = false;
    Audio.say('esti.where_is_teddy');
  }

  async look(i: number) {
    if (!this.playing || this.locked) return;
    this.locked = true;
    const c = this.covers[i];
    await tween(this, { targets: c, y: c.y - 120, angle: -15, duration: 250, ease: 'Back.easeOut' });
    if (i === this.where) {
      this.ear?.destroy();
      const t = new Living(this, c.x, c.y, 'teddy', { scale: 1.6 }).setDepth(11);
      Audio.sfx('boing');
      this.good(c.x, c.y - 200, 'מצאנו!');
      if (c.texture.key === 'teddy') popText(this, 640, 200, 'הדובי התחבא מאחורי עצמו!', '#ffe14d', 40);
      this.hero?.celebrate();
      await tween(this, { targets: t, y: c.y - 60, duration: 300, yoyo: true });
      t.destroy();
      this.addProgress(1);
      if (!this.ended) this.newRound();
    } else {
      const s = this.add.image(c.x, c.y, this.pick(SURPRISES)).setDepth(11).setScale(1.2);
      Audio.sfx('laugh');
      await wait(this, 700);
      s.destroy();
      await tween(this, { targets: c, y: c.y + 120, angle: 0, duration: 200 });
      this.hint();
      this.locked = false;
    }
  }

  hint() {
    const sp = SPOTS[this.where];
    sparkle(this, sp.x, sp.y - 60, 10);
  }

  bot(dt: number) {
    this.botTimer -= dt;
    if (this.botTimer > 0 || this.locked) return;
    this.botTimer = 0.5;
    this.look(this.where);
  }

  async winAnim() {
    const t = new Living(this, 640, 420, 'teddy', { scale: 3 }).setDepth(40);
    t.setScale(0);
    await tween(this, { targets: t, scale: 3, duration: 400, ease: 'Back.easeOut' });
    confetti(this, 640, 300, 60);
    this.hero?.celebrate();
    await wait(this, 1200);
  }
}
