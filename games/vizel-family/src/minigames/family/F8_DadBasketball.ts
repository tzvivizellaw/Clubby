import Phaser from 'phaser';
import { Audio } from '../../audio/AudioManager';
import { confetti, dust, popText, stars, tween, wait } from '../../animations/effects';
import { CharacterRig } from '../../characters/CharacterRig';
import { BaseMiniGame } from '../../engine/BaseMiniGame';
import { TXT } from '../../engine/ui';

const BALL0 = { x: 270, y: 470 };
const RIM_Y = 300;
const G = 900;

/** F8 — two-tap timing shot (direction, then power). Daniel moves the hoop, Yedidya runs across. */
export default class F8_DadBasketball extends BaseMiniGame {
  dad!: CharacterRig;
  daniel!: CharacterRig;
  yed!: CharacterRig;
  hoop!: Phaser.GameObjects.Image;
  ball!: Phaser.GameObjects.Image;
  arrow!: Phaser.GameObjects.Graphics;
  meter!: Phaser.GameObjects.Graphics;
  stage: 'aim' | 'power' | 'fly' = 'aim';
  osc = 0;
  angle = 45;
  power = 0.5;
  vx = 0;
  vy = 0;
  shots = 0;
  maxShots = 6;
  shotsText!: Phaser.GameObjects.Text;
  flyT = 0;
  prevY = 0;
  scored = false;
  yedT = 5;

  hoopX(t = this.elapsed) {
    return 1020 + Math.sin(t * 0.9 * this.diff.speed) * (this.isToddler ? 30 : 110);
  }

  setup() {
    this.stage = 'aim';
    this.osc = 0;
    this.shots = 0;
    this.yedT = 4;
    this.dad = new CharacterRig(this, 200, 650, 'father', 0.85).setDepth(10);
    this.daniel = new CharacterRig(this, 1180, 650, 'daniel', 0.6).setDepth(9).face2(-1);
    this.yed = new CharacterRig(this, -200, 650, 'yedidya', 0.6).setDepth(12);
    this.hoop = this.add.image(this.hoopX(0), RIM_Y - 40, 'hoop').setDepth(8).setScale(0.95);
    this.ball = this.add.image(BALL0.x, BALL0.y, 'basketball').setDepth(15).setScale(0.75);
    this.arrow = this.add.graphics().setDepth(16);
    this.meter = this.add.graphics().setDepth(16);
    const goal = this.n(3, 1);
    this.maxShots = goal + (this.isEasy ? 5 : 3);
    this.setGoal(goal, 'basketball');
    this.shotsText = this.add.text(640, 130, '', TXT(28)).setOrigin(0.5).setDepth(20);
    this.updateShots();
    this.input.on('pointerdown', () => this.tap());
    this.input.keyboard?.on('keydown-SPACE', () => this.tap());
  }

  updateShots() {
    this.shotsText.setText(`כדורים שנשארו: ${this.maxShots - this.shots}`);
  }

  tap() {
    if (!this.playing) return;
    if (this.stage === 'aim') {
      this.stage = 'power';
      this.osc = 0;
      Audio.sfx('click');
    } else if (this.stage === 'power') this.shoot();
  }

  velocity(angle: number, power: number) {
    const v = 620 + power * 520;
    const a = Phaser.Math.DegToRad(angle);
    return { vx: Math.cos(a) * v, vy: -Math.sin(a) * v };
  }

  shoot() {
    const v = this.velocity(this.angle, this.power);
    this.vx = v.vx;
    this.vy = v.vy;
    this.stage = 'fly';
    this.flyT = 0;
    this.scored = false;
    this.shots++;
    this.updateShots();
    this.dad.throwPose();
    Audio.sfx('whoosh');
    this.arrow.clear();
    this.meter.clear();
  }

  endShot(made: boolean) {
    if (made) {
      Audio.sfx('ding');
      confetti(this, this.hoop.x, RIM_Y, 30);
      popText(this, this.hoop.x, RIM_Y - 100, this.pick(['סל!', 'שלשה!', 'איזה אלוף!']), '#ffe14d', 44);
      this.dad.setExpr('happy', 800);
      this.addProgress(1);
    } else {
      popText(this, this.ball.x, this.ball.y - 60, 'החטאה!', '#ff595e', 34);
      this.dad.setExpr('sad', 800);
      this.daniel.laugh(600);
    }
    if (this.ended) return;
    if (this.shots >= this.maxShots && this.progress < this.goal) {
      this.lose();
      return;
    }
    this.ball.setPosition(BALL0.x, BALL0.y).setAngle(0);
    this.stage = 'aim';
    this.osc = 0;
  }

  /** simulate a shot (used by the bot to choose timing; physics identical to the real flight) */
  simulate(angle: number, power: number): boolean {
    const v = this.velocity(angle, power);
    let x = BALL0.x, y = BALL0.y, vy = v.vy, t = this.elapsed;
    const dt = 1 / 120;
    for (let i = 0; i < 480; i++) {
      const py = y;
      vy += G * dt;
      x += v.vx * dt;
      y += vy * dt;
      t += dt;
      if (py < RIM_Y && y >= RIM_Y && Math.abs(x - this.hoopX(t)) < 34) return true;
      if (y > 720) return false;
    }
    return false;
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
    this.hoop.x = this.hoopX();
    this.daniel.x = this.hoop.x + 150;
    const sp = (this.isToddler ? 0.6 : 1.2) * this.diff.speed;
    if (this.stage === 'aim') {
      this.osc += dt * sp * 2.2;
      this.angle = 45 + Math.sin(this.osc) * 25;
      const a = Phaser.Math.DegToRad(this.angle);
      this.arrow.clear().lineStyle(10, 0xffbe0b).lineBetween(BALL0.x, BALL0.y, BALL0.x + Math.cos(a) * 160, BALL0.y - Math.sin(a) * 160);
      this.arrow.fillStyle(0xffbe0b).fillCircle(BALL0.x + Math.cos(a) * 160, BALL0.y - Math.sin(a) * 160, 12);
    } else if (this.stage === 'power') {
      this.osc += dt * sp * 2.6;
      this.power = (Math.sin(this.osc - Math.PI / 2) + 1) / 2;
      const g = this.meter.clear();
      g.fillStyle(0x2b1d3a).fillRoundedRect(80, 250, 40, 260, 14);
      g.fillStyle(this.power > 0.7 ? 0xff595e : 0x8ac926).fillRoundedRect(86, 504 - 248 * this.power, 28, 248 * this.power, 10);
    } else {
      this.flyT += dt;
      this.prevY = this.ball.y;
      this.vy += G * dt;
      this.ball.x += this.vx * dt;
      this.ball.y += this.vy * dt;
      this.ball.angle += 400 * dt;
      // Yedidya blocks the ball if it hits him
      if (this.yed.x > 0 && Math.abs(this.ball.x - this.yed.x) < 50 && this.ball.y > 470) {
        this.vx = -Math.abs(this.vx) * 0.5;
        this.vy = -300;
        this.yed.hit();
        stars(this, this.yed.x, 480, 700);
      }
      if (!this.scored && this.prevY < RIM_Y && this.ball.y >= RIM_Y && Math.abs(this.ball.x - this.hoop.x) < 34) {
        this.scored = true;
        this.endShot(true);
      } else if (this.ball.y > 700 || this.ball.x > 1320 || this.flyT > 4) {
        dust(this, this.ball.x, 690);
        this.endShot(false);
      }
    }
    // Yedidya runs across the court now and then
    this.yedT -= dt;
    if (this.yedT <= 0 && !this.isToddler) {
      this.yedT = this.rnd(6, 9);
      this.yed.setPosition(-150, 650).face2(1);
      this.yed.walkTo(1450, 650, 2600 / this.diff.speed, true);
    }
  }

  bot() {
    if (this.stage === 'aim' && Math.abs(this.angle - 50) < 3) this.tap();
    else if (this.stage === 'power' && this.simulate(this.angle, this.power)) this.tap();
  }

  async winAnim() {
    confetti(this, 640, 200, 80);
    Audio.say('daniel.three_pointer');
    this.dad.celebrate();
    await wait(this, 1600);
  }

  async loseAnim() {
    this.ball.setPosition(this.dad.x, -60);
    await tween(this, { targets: this.ball, y: this.dad.y - 260, duration: 400, ease: 'Quad.easeIn' });
    Audio.sfx('boing');
    this.tweens.add({ targets: this.ball, x: this.ball.x + 300, y: 600, duration: 600, ease: 'Bounce.easeOut' });
    await this.dad.fall();
  }
}
