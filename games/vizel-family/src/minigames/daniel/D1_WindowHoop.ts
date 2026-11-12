import Phaser from 'phaser';
import { Audio } from '../../audio/AudioManager';
import { confetti, dust, popText, tween, wait } from '../../animations/effects';
import { Living } from '../../animations/living';
import { CharacterRig } from '../../characters/CharacterRig';
import { BaseMiniGame } from '../../engine/BaseMiniGame';
import { TXT } from '../../engine/ui';

const B0 = { x: 250, y: 300 };
const G = 900;
const RIM_DY = 30; // rim y relative to hoop sprite centre (scaled)
const K = 4.2; // drag -> velocity factor
const MAXV = 1250;

/** D1 — slingshot from the bedroom window into a moving hoop that grows legs and runs. */
export default class D1_WindowHoop extends BaseMiniGame {
  hoop!: Living;
  ball!: Phaser.GameObjects.Image;
  dots: Phaser.GameObjects.Arc[] = [];
  dragging = false;
  flying = false;
  vx = 0;
  vy = 0;
  shots = 0;
  maxShots = 7;
  legs = false;
  shotsText!: Phaser.GameObjects.Text;
  scored = false;
  flyT = 0;

  hoopPos(t = this.elapsed) {
    const sp = this.diff.speed * (this.legs ? 1.7 : 1) * (this.isToddler ? 0.5 : 1);
    return { x: 930 + Math.sin(t * 0.8 * sp) * 200, y: 470 - (this.legs ? Math.abs(Math.sin(t * 3 * sp)) * 50 : 0) };
  }

  setup() {
    this.shots = 0;
    this.legs = false;
    this.flying = false;
    this.dragging = false;
    // the window of Daniel's room
    const wall = this.add.graphics().setDepth(2);
    wall.fillStyle(0xf3ead8).fillRect(0, 0, 360, 720).lineStyle(6, 0x2b1d3a).strokeRect(-10, -10, 370, 740);
    wall.fillStyle(0x8ecae6).fillRect(90, 160, 240, 220).lineStyle(8, 0xffffff).strokeRect(90, 160, 240, 220);
    const d = new CharacterRig(this, 180, 420, 'daniel', 0.6).setDepth(3);
    void d;
    this.hoop = new Living(this, 930, 470, 'hoop', { scale: 0.75, eyeY: -0.3, eyeSpread: 30, legs: false }).setDepth(5);
    this.ball = this.add.image(B0.x, B0.y, 'basketball').setDepth(10).setScale(0.75);
    for (let i = 0; i < 9; i++) this.dots.push(this.add.circle(0, 0, 6, 0xffffff).setDepth(9).setVisible(false));
    const goal = this.n(3, 1);
    this.maxShots = goal + (this.isEasy ? 6 : 4);
    this.setGoal(goal, 'basketball');
    this.shotsText = this.add.text(640, 130, '', TXT(28)).setOrigin(0.5).setDepth(20);
    this.updateShots();
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (!this.playing || this.flying) return;
      this.dragging = true;
    });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => this.dragging && this.aim(p.x, p.y));
    this.input.on('pointerup', (p: Phaser.Input.Pointer) => {
      if (!this.dragging) return;
      this.dragging = false;
      this.dots.forEach((d) => d.setVisible(false));
      const v = this.dragVel(p.x, p.y);
      if (Math.hypot(v.vx, v.vy) > 200) this.launch(v.vx, v.vy);
      else this.ball.setPosition(B0.x, B0.y);
    });
  }

  updateShots() {
    this.shotsText.setText(`כדורים: ${this.maxShots - this.shots}`);
  }

  dragVel(px: number, py: number) {
    let vx = (B0.x - px) * K, vy = (B0.y - py) * K;
    const m = Math.hypot(vx, vy);
    if (m > MAXV) {
      vx *= MAXV / m;
      vy *= MAXV / m;
    }
    return { vx, vy };
  }

  aim(px: number, py: number) {
    const { vx, vy } = this.dragVel(px, py);
    const pull = Math.min(90, Math.hypot(px - B0.x, py - B0.y));
    const a = Math.atan2(py - B0.y, px - B0.x);
    this.ball.setPosition(B0.x + Math.cos(a) * pull, B0.y + Math.sin(a) * pull);
    this.dots.forEach((d, i) => {
      const t = (i + 1) * 0.07;
      d.setPosition(B0.x + vx * t, B0.y + vy * t + 0.5 * G * t * t).setVisible(true).setAlpha(1 - i * 0.09);
    });
  }

  launch(vx: number, vy: number) {
    if (!this.playing || this.flying) return;
    this.flying = true;
    this.scored = false;
    this.flyT = 0;
    this.vx = vx;
    this.vy = vy;
    this.ball.setPosition(B0.x, B0.y);
    this.shots++;
    this.updateShots();
    Audio.sfx('whoosh');
  }

  endShot(made: boolean) {
    this.flying = false;
    if (made) {
      Audio.sfx('ding');
      confetti(this, this.hoop.x, this.hoop.y, 30);
      popText(this, this.hoop.x, this.hoop.y - 120, this.pick(['סל!', 'שלשה!', 'נקי!']), '#ffe14d', 44);
      this.hoop.setMood('shock', 600);
      this.addProgress(1);
      if (!this.legs && this.progress >= 2 && !this.isToddler) {
        this.legs = true;
        this.hoop.destroy();
        this.hoop = new Living(this, this.hoopPos().x, 470, 'hoop', { scale: 0.75, eyeY: -0.3, eyeSpread: 30, legs: true }).setDepth(5);
        this.hoop.runLegs(true, 90).setMood('smug');
        popText(this, 900, 300, 'לסל צמחו רגליים!', '#ff595e', 36);
        Audio.sfx('boing');
      }
    } else {
      this.hoop.tongue(700);
      popText(this, this.ball.x, Math.min(this.ball.y, 640) - 40, 'פספוס!', '#ff595e', 30);
    }
    if (this.ended) return;
    if (this.shots >= this.maxShots && this.progress < this.goal) return void this.lose();
    this.ball.setPosition(B0.x, B0.y).setAngle(0);
  }

  /** fixed sub-steps keep the ball physics identical at any frame rate (and match the bot's prediction) */
  tick(dt: number) {
    const n = Math.max(1, Math.ceil(dt / (1 / 120)));
    const h = dt / n;
    const e0 = this.elapsed - dt;
    for (let i = 0; i < n && this.playing; i++) {
      this.elapsed = e0 + (i + 1) * h;
      this.tickStep(h);
    }
  }

  tickStep(dt: number) {
    const hp = this.hoopPos();
    this.hoop.setPosition(hp.x, hp.y);
    if (!this.flying) return;
    this.flyT += dt;
    const py = this.ball.y;
    this.vy += G * dt;
    this.ball.x += this.vx * dt;
    this.ball.y += this.vy * dt;
    this.ball.angle += 300 * dt;
    const rimY = hp.y + RIM_DY;
    if (!this.scored && py < rimY && this.ball.y >= rimY && Math.abs(this.ball.x - hp.x) < 40) {
      this.scored = true;
      this.endShot(true);
    } else if (this.ball.y > 700 || this.ball.x > 1320 || this.ball.x < -40 || this.flyT > 4) {
      dust(this, this.ball.x, 690, 5);
      this.endShot(false);
    }
  }

  bot() {
    if (this.flying) return;
    for (let T = 0.7; T <= 1.6; T += 0.05) {
      const hp = this.hoopPos(this.elapsed + T);
      const vx = (hp.x - B0.x) / T;
      const vy = (hp.y + RIM_DY - B0.y - 0.5 * G * T * T) / T;
      if (Math.hypot(vx, vy) <= MAXV * 0.98 && vy + G * T > 100) return this.launch(vx, vy);
    }
  }

  async winAnim() {
    this.hoop.setMood('sad');
    const flag = this.add.rectangle(this.hoop.x + 60, this.hoop.y - 120, 50, 34, 0xffffff).setStrokeStyle(3, 0x2b1d3a).setDepth(6);
    this.tweens.add({ targets: flag, angle: 10, duration: 150, yoyo: true, repeat: 5 });
    confetti(this, 640, 250, 60);
    await wait(this, 1500);
  }

  async loseAnim() {
    this.hoop.setMood('tongue');
    await tween(this, { targets: this.hoop, angle: { from: -15, to: 15 }, y: this.hoop.y - 30, duration: 180, yoyo: true, repeat: 4 });
    Audio.sfx('laugh');
    await wait(this, 400);
  }
}
