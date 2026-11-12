import Phaser from 'phaser';
import { FONT } from '../animations/effects';
import { Audio } from '../audio/AudioManager';

export const TXT = (size: number, color = '#ffffff', stroke = 8): Phaser.Types.GameObjects.Text.TextStyle =>
  ({ fontFamily: FONT, fontSize: `${size}px`, color, fontStyle: '900', stroke: '#2b1d3a', strokeThickness: stroke, align: 'center', rtl: true } as any);

export function text(scene: Phaser.Scene, x: number, y: number, s: string, size = 32, color = '#ffffff', stroke = 7) {
  return scene.add.text(x, y, s, TXT(size, color, stroke)).setOrigin(0.5);
}

/** Speech bubble with tail. Returns the container (destroy when done). */
export function bubble(scene: Phaser.Scene, x: number, y: number, s: string, o: { size?: number; maxW?: number; tail?: 'down' | 'up' | 'none'; color?: number; tailX?: number } = {}) {
  const size = o.size ?? 28;
  const t = scene.add
    .text(0, 0, s, { fontFamily: FONT, fontSize: `${size}px`, color: '#2b1d3a', fontStyle: '700', align: 'center', rtl: true, wordWrap: { width: o.maxW ?? 420, useAdvancedWrap: true } } as any)
    .setOrigin(0.5);
  const w = Math.max(90, t.width + 40), h = t.height + 28;
  const g = scene.add.graphics();
  g.fillStyle(o.color ?? 0xffffff).fillRoundedRect(-w / 2, -h / 2, w, h, 22);
  g.lineStyle(4, 0x2b1d3a).strokeRoundedRect(-w / 2, -h / 2, w, h, 22);
  const tx = Phaser.Math.Clamp(o.tailX ?? 0, -w / 2 + 30, w / 2 - 30);
  if ((o.tail ?? 'down') === 'down') {
    g.fillStyle(o.color ?? 0xffffff).fillTriangle(tx - 14, h / 2 - 3, tx + 14, h / 2 - 3, tx, h / 2 + 24);
    g.lineStyle(4, 0x2b1d3a).lineBetween(tx - 14, h / 2, tx, h / 2 + 24).lineBetween(tx + 14, h / 2, tx, h / 2 + 24);
  } else if (o.tail === 'up') {
    g.fillStyle(o.color ?? 0xffffff).fillTriangle(tx - 14, -h / 2 + 3, tx + 14, -h / 2 + 3, tx, -h / 2 - 24);
    g.lineStyle(4, 0x2b1d3a).lineBetween(tx - 14, -h / 2, tx, -h / 2 - 24).lineBetween(tx + 14, -h / 2, tx, -h / 2 - 24);
  }
  const c = scene.add.container(Phaser.Math.Clamp(x, w / 2 + 10, 1270 - w / 2), y, [g, t]).setDepth(950);
  c.setScale(0.3);
  scene.tweens.add({ targets: c, scale: 1, duration: 200, ease: 'Back.easeOut' });
  return c;
}

/** Big chunky cartoon button. */
export function button(scene: Phaser.Scene, x: number, y: number, label: string, cb: () => void, o: { w?: number; h?: number; color?: number; size?: number; icon?: string } = {}) {
  const w = o.w ?? 260, h = o.h ?? 84;
  const g = scene.add.graphics();
  const draw = (pressed: boolean) => {
    g.clear();
    g.fillStyle(0x2b1d3a).fillRoundedRect(-w / 2, -h / 2 + 8, w, h, 26);
    g.fillStyle(o.color ?? 0xffbe0b).fillRoundedRect(-w / 2, -h / 2 + (pressed ? 6 : 0), w, h, 26);
    g.lineStyle(5, 0x2b1d3a).strokeRoundedRect(-w / 2, -h / 2 + (pressed ? 6 : 0), w, h, 26);
  };
  draw(false);
  const parts: Phaser.GameObjects.GameObject[] = [g];
  const t = scene.add.text(0, 0, label, TXT(o.size ?? 34, '#ffffff', 7)).setOrigin(0.5);
  parts.push(t);
  if (o.icon) {
    const ic = scene.add.image(-w / 2 + 44, 0, o.icon);
    ic.setScale(Math.min(60 / ic.width, 60 / ic.height));
    parts.push(ic);
    t.setX(20);
  }
  const c = scene.add.container(x, y, parts).setDepth(960).setSize(w, h);
  c.setInteractive(new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h + 8), Phaser.Geom.Rectangle.Contains);
  c.on('pointerdown', () => {
    draw(true);
    t.setY(6);
  });
  c.on('pointerout', () => {
    draw(false);
    t.setY(0);
  });
  c.on('pointerup', () => {
    draw(false);
    t.setY(0);
    Audio.sfx('click');
    cb();
  });
  return c;
}

/** Fit an image into a box (keeps aspect). */
export function fit(img: Phaser.GameObjects.Image | Phaser.GameObjects.Container, maxW: number, maxH: number) {
  const w = (img as any).width || (img as any).iw || 100;
  const h = (img as any).height || (img as any).ih || 100;
  img.setScale(Math.min(maxW / w, maxH / h));
  return img;
}
