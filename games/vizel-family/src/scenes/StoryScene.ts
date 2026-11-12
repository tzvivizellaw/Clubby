import Phaser from 'phaser';
import { Audio } from '../audio/AudioManager';
import { confetti, dust, explodeIntoConfetti, shake, tween } from '../animations/effects';
import { Living } from '../animations/living';
import { drawBackground, type BgKey } from '../assets/backgrounds';
import { CharacterRig } from '../characters/CharacterRig';
import { LOOKS } from '../characters/parts';
import type { CastId } from '../data/characters';
import { TXT, bubble, text } from '../engine/ui';
import type { StoryStep } from '../minigames/types';

export interface StoryData {
  steps: StoryStep[];
  bg: BgKey;
  kind: 'intro' | 'win' | 'lose' | 'other';
  title?: string;
  fast?: boolean; // test mode: run quickly
  onDone: () => void;
}

type Actor = CharacterRig | Living | Phaser.GameObjects.Image;

/**
 * Story Director: interprets short scripted cut-scenes (3–10s intro, 2–6s outro).
 * Tap = fast-forward the current beat, "דלג" = skip the whole scene.
 */
export class StoryScene extends Phaser.Scene {
  private actors = new Map<string, Actor>();
  private skipping = false;
  private ff: (() => void) | null = null;
  private data2!: StoryData;
  private bubbleObj?: Phaser.GameObjects.Container;
  private doneCalled = false;

  constructor() {
    super('Story');
  }

  create(data: StoryData) {
    this.data2 = data;
    this.actors = new Map();
    this.skipping = false;
    this.ff = null;
    this.doneCalled = false;
    this.cameras.main.setBackgroundColor('#2b1d3a');
    this.cameras.main.fadeIn(200);
    if (data.steps[0]?.t !== 'bg') drawBackground(this, data.bg);
    if (data.kind === 'intro') Audio.music(null);
    // cinematic letterbox
    const top = this.add.rectangle(640, -40, 1280, 80, 0x000000).setDepth(990);
    const bot = this.add.rectangle(640, 760, 1280, 80, 0x000000).setDepth(990);
    this.tweens.add({ targets: top, y: 30, duration: 300 });
    this.tweens.add({ targets: bot, y: 690, duration: 300 });
    if (data.title) {
      const t = text(this, 640, 30, data.title, 30, '#ffe14d', 0).setDepth(991);
      t.setStroke('#000', 0);
    }
    const skip = this.add.text(70, 30, 'דלג ⏭', TXT(28, '#ffffff', 6)).setOrigin(0.5).setDepth(995).setInteractive({ useHandCursor: true });
    skip.on('pointerdown', (_p: any, _x: any, _y: any, e: Phaser.Types.Input.EventData) => {
      e?.stopPropagation?.();
      this.skip();
    });
    this.input.on('pointerdown', () => this.ff?.());
    this.input.keyboard?.on('keydown-SPACE', () => this.ff?.());
    this.input.keyboard?.on('keydown-ESC', () => this.skip());
    this.play(data.steps);
  }

  skip() {
    this.skipping = true;
    this.ff?.();
  }

  private sleep(ms: number) {
    if (this.skipping) return Promise.resolve();
    const m = this.data2.fast ? Math.min(ms, 60) : ms;
    return new Promise<void>((res) => {
      let done = false;
      const fin = () => {
        if (done) return;
        done = true;
        ev.remove();
        if (this.ff === fin) this.ff = null;
        res();
      };
      const ev = this.time.delayedCall(m, fin);
      this.ff = fin;
    });
  }

  private async play(steps: StoryStep[]) {
    for (const s of steps) {
      if (this.skipping || !this.scene.isActive()) break;
      try {
        await this.step(s);
      } catch (e) {
        console.warn('story step failed', s, e);
      }
    }
    this.end();
  }

  private end() {
    if (this.doneCalled) return;
    this.doneCalled = true;
    this.bubbleObj?.destroy();
    this.cameras.main.fadeOut(200, 0, 0, 0);
    this.time.delayedCall(220, () => this.data2.onDone());
  }

  private headTop(r: CharacterRig) {
    const L = LOOKS[r.cid];
    return r.y - (150 + 150 * L.headScale) * r.baseScale - 10;
  }

  private async step(s: StoryStep): Promise<void> {
    switch (s.t) {
      case 'bg':
        drawBackground(this, s.key);
        return;
      case 'char': {
        const r = new CharacterRig(this, s.x, s.y ?? 650, s.who, s.scale ?? 0.85).setDepth(10);
        if (s.face) r.face2(s.face);
        if (s.expr) r.setExpr(s.expr);
        this.actors.set(s.who, r);
        if (s.from && s.from !== 'none') {
          const p = r.enter(s.from, 650);
          await this.sleep(300);
          void p;
        }
        return;
      }
      case 'say': {
        const r = this.actors.get(s.who);
        this.bubbleObj?.destroy();
        let x = 640, y = 160;
        if (r instanceof CharacterRig) {
          x = r.x;
          y = Math.max(110, this.headTop(r) - 50);
          r.setExpr(s.expr ?? 'shout');
        }
        this.bubbleObj = bubble(this, x, y, s.text, { size: 30, tailX: 0 });
        const ms = s.ms ?? Audio.say(s.voice ?? s.who, s.text);
        let flap = false;
        const talk = r instanceof CharacterRig ? this.time.addEvent({ delay: 130, loop: true, callback: () => r.active && r.setExpr((flap = !flap) ? (s.expr ?? 'shout') : 'smile') }) : null;
        await this.sleep(ms);
        talk?.remove();
        if (r instanceof CharacterRig && r.active) r.setExpr(s.expr && s.expr !== 'shout' ? s.expr : 'smile');
        this.bubbleObj?.destroy();
        this.bubbleObj = undefined;
        return;
      }
      case 'prop': {
        let o: Actor;
        if (s.living || s.legs) {
          const l = new Living(this, s.x, s.y, s.tex, { scale: s.scale ?? 1, legs: s.legs, mood: s.mood as any });
          o = l;
        } else o = this.add.image(s.x, s.y, s.tex).setScale(s.scale ?? 1);
        o.setDepth(12);
        this.actors.set(s.id, o);
        const sc = o.scale;
        if (s.from === 'top') {
          o.y = -150;
          await tween(this, { targets: o, y: s.y, duration: 500, ease: 'Bounce.easeOut' });
          dust(this, s.x, s.y + 30);
        } else if (s.from !== 'none') {
          o.setScale(0);
          Audio.sfx('pop');
          await tween(this, { targets: o, scale: sc, duration: 260, ease: 'Back.easeOut' });
        }
        return;
      }
      case 'act':
        return this.act(s.target, s.a, s.to, s.wait ?? true, s.ms);
      case 'zoom': {
        const cam = this.cameras.main;
        Audio.sfx('whoosh');
        cam.zoomTo(s.z, 300, 'Quad.easeOut');
        if (s.x != null) cam.pan(s.x, s.y ?? 360, 300, 'Quad.easeOut');
        else if (s.z === 1) cam.pan(640, 360, 300);
        await this.sleep(320);
        return;
      }
      case 'shake':
        shake(this, 0.015, 350);
        return this.sleep(200);
      case 'confetti':
        confetti(this, s.x ?? 640, s.y ?? 250, 60);
        Audio.sfx('confetti');
        return this.sleep(300);
      case 'wait':
        return this.sleep(s.ms);
      case 'sfx':
        Audio.sfx(s.name);
        return;
      case 'caption': {
        const t = text(this, 640, 360, s.text, 64, '#ffe14d', 12).setDepth(980).setScale(0.3);
        await tween(this, { targets: t, scale: 1, duration: 260, ease: 'Back.easeOut' });
        await this.sleep(900);
        t.destroy();
        return;
      }
      case 'black': {
        const r = this.add.rectangle(640, 360, 1400, 800, 0x000000).setDepth(989).setAlpha(0);
        await tween(this, { targets: r, alpha: 1, duration: 280 });
        return this.sleep(200);
      }
    }
  }

  private async act(target: string, a: string, to?: [number, number], waitIt = true, ms?: number) {
    const o = this.actors.get(target);
    if (!o) return;
    let p: Promise<unknown> = Promise.resolve();
    if (o instanceof CharacterRig) {
      const r = o;
      switch (a) {
        case 'run':
        case 'moveTo':
        case 'exit':
          p = r.walkTo(to ? to[0] : r.x < 640 ? -250 : 1530, to ? to[1] : r.y, ms ?? 700, a !== 'moveTo');
          break;
        case 'jump':
        case 'bounce':
          p = r.jump();
          break;
        case 'shake':
          p = r.hit();
          break;
        case 'spin':
          p = r.spin();
          break;
        case 'dance':
          p = (async () => {
            r.setExpr('happy');
            for (let i = 0; i < 2; i++) {
              r.face2(-1);
              await r.jump(40, 260);
              r.face2(1);
              await r.jump(40, 260);
            }
          })();
          break;
        case 'fall':
          p = r.fall();
          break;
        case 'shock':
          p = r.shock();
          break;
        case 'celebrate':
          p = r.celebrate();
          break;
        case 'cry':
          p = r.cry();
          break;
        case 'laugh':
          Audio.sfx('laugh');
          p = r.laugh();
          break;
        case 'fly': {
          r.fly(true);
          p = tween(this, { targets: r, x: to?.[0] ?? r.x + 300, y: to?.[1] ?? r.y - 200, duration: ms ?? 800, ease: 'Sine.easeInOut' });
          break;
        }
        case 'land':
          r.fly(false);
          p = tween(this, { targets: r, y: to?.[1] ?? 650, duration: 300 }).then(() => r.bumpLand());
          break;
        case 'sleep':
          r.sleep(true);
          break;
        case 'wake':
          r.sleep(false);
          break;
        case 'wave':
          p = r.wave();
          break;
        case 'hips':
          r.handsOnHips();
          break;
        case 'rollEyes':
          p = r.rollEyes();
          break;
        case 'throw':
          p = r.throwPose();
          break;
        case 'angry':
          r.setExpr('angry');
          p = r.hit();
          break;
        case 'squash':
          p = r.squash();
          break;
        case 'stretch':
          p = r.stretch();
          break;
        case 'hide':
          r.setVisible(false);
          break;
        case 'show':
          r.setVisible(true);
          break;
        case 'flip':
          r.face2(r.scaleX > 0 ? -1 : 1);
          break;
        case 'grow':
          p = tween(this, { targets: r, scale: r.scale * 1.6, duration: 400, ease: 'Back.easeOut' });
          break;
        case 'explode':
          explodeIntoConfetti(this, r);
          Audio.sfx('confetti');
          break;
      }
    } else {
      const l = o as any;
      const isLiving = o instanceof Living;
      switch (a) {
        case 'legs':
          if (isLiving) (o as Living).runLegs(true, 90);
          break;
        case 'run':
        case 'moveTo':
        case 'exit': {
          if (isLiving) (o as Living).runLegs(true, 80);
          const tx = to ? to[0] : l.x < 640 ? -250 : 1530;
          if (l.scaleX && Math.sign(tx - l.x) < 0 && a === 'run') l.scaleX = -Math.abs(l.scaleX);
          p = tween(this, { targets: o, x: tx, y: to ? to[1] : l.y, duration: ms ?? 800, ease: 'Sine.easeIn' });
          break;
        }
        case 'jump':
        case 'bounce':
          p = tween(this, { targets: o, y: l.y - 60, duration: 200, yoyo: true, repeat: a === 'bounce' ? 2 : 0, ease: 'Quad.easeOut' });
          break;
        case 'shake':
        case 'angry':
          if (isLiving && a === 'angry') (o as Living).setMood('angry');
          p = tween(this, { targets: o, angle: { from: -12, to: 12 }, duration: 70, yoyo: true, repeat: 4 }).then(() => l.setAngle(0));
          break;
        case 'spin':
          p = tween(this, { targets: o, angle: l.angle + 360, duration: 600 });
          break;
        case 'dance':
          p = tween(this, { targets: o, angle: { from: -20, to: 20 }, y: l.y - 25, duration: 200, yoyo: true, repeat: 5 }).then(() => l.setAngle(0));
          break;
        case 'grow':
          Audio.sfx('stretch');
          p = tween(this, { targets: o, scale: l.scale * 2.2, duration: 600, ease: 'Back.easeOut' });
          break;
        case 'shrink':
          p = tween(this, { targets: o, scale: l.scale * 0.4, duration: 400 });
          break;
        case 'explode':
          explodeIntoConfetti(this, o);
          Audio.sfx('confetti');
          p = this.sleep(400);
          break;
        case 'tongue':
          if (isLiving) (o as Living).tongue(1200);
          Audio.sfx('laugh');
          break;
        case 'shock':
          if (isLiving) (o as Living).setMood('shock', 1200);
          p = tween(this, { targets: o, scaleY: l.scaleY * 1.2, duration: 120, yoyo: true });
          break;
        case 'peek':
          p = tween(this, { targets: o, y: l.y - 40, duration: 300, yoyo: true, hold: 400 });
          break;
        case 'squash':
          p = tween(this, { targets: o, scaleX: l.scaleX * 1.3, scaleY: l.scaleY * 0.7, duration: 120, yoyo: true });
          break;
        case 'stretch':
          p = tween(this, { targets: o, scaleX: l.scaleX * 0.7, scaleY: l.scaleY * 1.4, duration: 160, yoyo: true });
          break;
        case 'fly':
          p = tween(this, { targets: o, x: to?.[0] ?? l.x, y: to?.[1] ?? -200, angle: 30, duration: ms ?? 900, ease: 'Sine.easeIn' });
          break;
        case 'fall':
          p = tween(this, { targets: o, angle: 90, y: l.y + 30, duration: 300, ease: 'Bounce.easeOut' });
          break;
        case 'hide':
          l.setVisible(false);
          break;
        case 'show':
          l.setVisible(true);
          break;
        case 'flip':
          l.scaleX *= -1;
          break;
        case 'sleep':
          if (isLiving) (o as Living).setMood('sleep');
          break;
        case 'laugh':
          if (isLiving) (o as Living).setMood('happy');
          Audio.sfx('laugh');
          p = tween(this, { targets: o, angle: { from: -8, to: 8 }, duration: 90, yoyo: true, repeat: 5 });
          break;
        case 'celebrate':
          p = tween(this, { targets: o, y: l.y - 50, duration: 220, yoyo: true, repeat: 1 });
          break;
      }
    }
    if (waitIt) await Promise.race([p, this.sleep(ms ?? 1800)]);
    else await this.sleep(150);
  }
}

export type { CastId };
