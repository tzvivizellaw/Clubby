import Phaser from 'phaser';

/**
 * 12 original cartoon backgrounds drawn with vector graphics (no bitmap assets needed).
 * Each has 3 parallax layers (back/mid/front) and a couple of ambient animations.
 */
export type BgKey =
  | 'livingRoom' | 'kitchen' | 'kidsRoom' | 'bathroom' | 'bedroom' | 'office'
  | 'car' | 'street' | 'court' | 'dream' | 'yard' | 'laundry';

export const BG_KEYS: BgKey[] = ['livingRoom', 'kitchen', 'kidsRoom', 'bathroom', 'bedroom', 'office', 'car', 'street', 'court', 'dream', 'yard', 'laundry'];

const O = 0x2b1d3a;
type G = Phaser.GameObjects.Graphics;

function box(g: G, x: number, y: number, w: number, h: number, fill: number, r = 0, line = 4) {
  g.fillStyle(fill, 1);
  if (r) g.fillRoundedRect(x, y, w, h, r);
  else g.fillRect(x, y, w, h);
  if (line) {
    g.lineStyle(line, O, 1);
    if (r) g.strokeRoundedRect(x, y, w, h, r);
    else g.strokeRect(x, y, w, h);
  }
}
function circ(g: G, x: number, y: number, r: number, fill: number, line = 4) {
  g.fillStyle(fill, 1).fillCircle(x, y, r);
  if (line) g.lineStyle(line, O, 1).strokeCircle(x, y, r);
}
function sky(g: G, top: number, bottom: number, h = 720) {
  g.fillGradientStyle(top, top, bottom, bottom, 1);
  g.fillRect(-100, -50, 1480, h + 50);
}
function floorBoards(g: G, y: number, color: number) {
  box(g, -100, y, 1480, 800 - y, color, 0, 0);
  g.lineStyle(3, Phaser.Display.Color.ValueToColor(color).darken(18).color, 1);
  for (let x = -100; x < 1400; x += 120) g.lineBetween(x, y, x - 40, 800);
  g.lineStyle(4, O).lineBetween(-100, y, 1400, y);
}
function windowFrame(g: G, x: number, y: number, w: number, h: number, skyTop = 0x8ecae6, skyBot = 0xd8f3ff) {
  g.fillGradientStyle(skyTop, skyTop, skyBot, skyBot, 1);
  g.fillRect(x, y, w, h);
  // distant hills of Modi'in Illit
  g.fillStyle(0x9bc995).fillEllipse(x + w * 0.3, y + h, w * 0.9, h * 0.6);
  g.fillStyle(0x7fb77e).fillEllipse(x + w * 0.8, y + h, w * 0.8, h * 0.45);
  g.lineStyle(8, 0xffffff).strokeRect(x, y, w, h);
  g.lineBetween(x + w / 2, y, x + w / 2, y + h);
  g.lineStyle(4, O).strokeRect(x - 4, y - 4, w + 8, h + 8);
}
function cloud(scene: Phaser.Scene, layer: Phaser.GameObjects.Container, x: number, y: number, s = 1, speed = 20) {
  const g = scene.add.graphics();
  g.fillStyle(0xffffff, 0.95);
  g.fillCircle(0, 0, 30 * s).fillCircle(35 * s, -10 * s, 38 * s).fillCircle(72 * s, 2 * s, 28 * s).fillRect(0, 0, 72 * s, 28 * s);
  g.setPosition(x, y);
  layer.add(g);
  scene.tweens.add({ targets: g, x: x + 1400, duration: (1400 / speed) * 1000, repeat: -1, onRepeat: () => g.setX(-200) });
  g.x = x;
  return g;
}
function stoneBuilding(g: G, x: number, baseY: number, w: number, floors: number, color = 0xf3ead8) {
  const h = floors * 46 + 20;
  box(g, x, baseY - h, w, h, color, 4, 4);
  for (let f = 0; f < floors; f++) {
    for (let i = 0; i < Math.floor(w / 50); i++) {
      const wx = x + 14 + i * 50, wy = baseY - h + 16 + f * 46;
      box(g, wx, wy, 26, 24, 0x8ecae6, 2, 2);
      g.lineStyle(2, 0xd9cdb5).lineBetween(x, wy + 34, x + w, wy + 34);
    }
  }
  // solar water heaters on the roof
  for (let i = 0; i < Math.floor(w / 60); i++) {
    const sx = x + 10 + i * 60;
    g.fillStyle(0x3a5a9c).fillRect(sx, baseY - h - 22, 34, 18);
    g.lineStyle(2, O).strokeRect(sx, baseY - h - 22, 34, 18);
    g.fillStyle(0xdee2e6).fillRect(sx + 36, baseY - h - 26, 14, 26);
    g.strokeRect(sx + 36, baseY - h - 26, 14, 26);
  }
}

export interface BgHandle {
  layers: Phaser.GameObjects.Container[];
  update: (px: number) => void;
}

export function drawBackground(scene: Phaser.Scene, key: BgKey): BgHandle {
  const back = scene.add.container(0, 0).setDepth(-30);
  const mid = scene.add.container(0, 0).setDepth(-20);
  const front = scene.add.container(0, 0).setDepth(-10);
  const gb = scene.add.graphics();
  const gm = scene.add.graphics();
  const gf = scene.add.graphics();
  back.add(gb);
  mid.add(gm);
  front.add(gf);
  const anim = (g: Phaser.GameObjects.Graphics | Phaser.GameObjects.Container, layer: Phaser.GameObjects.Container) => layer.add(g);

  switch (key) {
    case 'livingRoom': {
      box(gb, -100, -10, 1480, 760, 0xffe8b0, 0, 0);
      gb.lineStyle(10, 0xffd98a, 0.6);
      for (let x = -80; x < 1400; x += 70) gb.lineBetween(x, 0, x, 600);
      windowFrame(gb, 860, 90, 260, 200);
      floorBoards(gm, 590, 0xc68b59);
      gm.fillStyle(0xe76f51, 0.85).fillEllipse(640, 660, 760, 90);
      gm.lineStyle(4, O).strokeEllipse(640, 660, 760, 90);
      box(gm, 60, 210, 170, 380, 0xa0662b, 6);
      for (let i = 0; i < 4; i++) {
        gm.lineStyle(4, O).lineBetween(60, 290 + i * 80, 230, 290 + i * 80);
        for (let b = 0; b < 5; b++) box(gm, 76 + b * 28, 238 + i * 80, 20, 50, [0xe63946, 0x457b9d, 0xf4a261, 0x2a9d8f, 0x8338ec][b], 2, 2);
      }
      box(gm, 420, 120, 140, 100, 0xb5838d, 4);
      box(gm, 434, 134, 112, 72, 0xbde0fe, 2, 2);
      gm.fillStyle(0x8ac926).fillTriangle(434, 206, 480, 150, 546, 206);
      // clock with ticking hand
      circ(gm, 700, 140, 40, 0xfff8e7);
      const hand = scene.add.graphics({ x: 700, y: 140 });
      hand.lineStyle(4, O).lineBetween(0, 0, 0, -30);
      anim(hand, mid);
      scene.tweens.add({ targets: hand, angle: 360, duration: 12000, repeat: -1 });
      // plant
      box(gf, 1180, 520, 70, 70, 0xe76f51, 8);
      gf.fillStyle(0x52b788);
      for (let i = 0; i < 6; i++) gf.fillEllipse(1215 + Math.cos(i) * 30, 470 - (i % 3) * 20, 30, 70);
      break;
    }
    case 'kitchen': {
      box(gb, -100, -10, 1480, 760, 0xdff3f2, 0, 0);
      gb.lineStyle(2, 0xb7e0dd);
      for (let x = -100; x < 1400; x += 50) gb.lineBetween(x, 260, x, 470);
      for (let y = 260; y < 470; y += 50) gb.lineBetween(-100, y, 1400, y);
      windowFrame(gb, 520, 70, 240, 170);
      for (let i = 0; i < 4; i++) box(gb, 40 + i * 110, 40, 100, 170, 0xf4a261, 8);
      for (let i = 0; i < 3; i++) box(gb, 860 + i * 120, 40, 110, 170, 0xf4a261, 8);
      floorBoards(gm, 600, 0xe9c46a);
      box(gm, -20, 470, 1320, 26, 0xf1faee, 4);
      for (let i = 0; i < 9; i++) {
        box(gm, -10 + i * 150, 496, 144, 104, 0xe76f51, 6);
        circ(gm, 62 + i * 150, 548, 6, 0xf4c542, 2);
      }
      // steaming pot
      box(gf, 1080, 420, 110, 54, 0x8d99ae, 10);
      const steam = scene.add.graphics();
      steam.lineStyle(5, 0xffffff, 0.7);
      steam.beginPath();
      steam.moveTo(1120, 410);
      steam.lineTo(1110, 380);
      steam.lineTo(1124, 350);
      steam.strokePath();
      anim(steam, front);
      scene.tweens.add({ targets: steam, alpha: 0.2, y: -12, duration: 900, yoyo: true, repeat: -1 });
      break;
    }
    case 'kidsRoom': {
      box(gb, -100, -10, 1480, 760, 0xd8c8f4, 0, 0);
      gb.fillStyle(0xfff3b0);
      for (let i = 0; i < 18; i++) {
        const x = (i * 157) % 1280, y = 40 + ((i * 89) % 360);
        gb.fillCircle(x, y, 6);
      }
      windowFrame(gb, 940, 80, 220, 180);
      floorBoards(gm, 600, 0x90be6d);
      box(gm, 40, 260, 300, 340, 0xa0662b, 8);
      box(gm, 56, 300, 268, 70, 0x7fc8f8, 8);
      box(gm, 56, 460, 268, 70, 0xff8fb1, 8);
      box(gm, 500, 330, 200, 270, 0xffbe0b, 6);
      for (let i = 0; i < 3; i++) gm.lineStyle(4, O).lineBetween(500, 400 + i * 66, 700, 400 + i * 66);
      circ(gm, 540, 380, 16, 0xff595e);
      circ(gm, 650, 440, 16, 0x1982c4);
      box(gm, 590, 500, 40, 30, 0x8ac926, 4);
      gf.fillStyle(0xffffff, 0.5).fillEllipse(860, 670, 360, 60);
      break;
    }
    case 'bathroom': {
      box(gb, -100, -10, 1480, 760, 0xcaf0f8, 0, 0);
      gb.lineStyle(3, 0x90e0ef);
      for (let x = -100; x < 1400; x += 64) gb.lineBetween(x, 0, x, 620);
      for (let y = 0; y < 620; y += 64) gb.lineBetween(-100, y, 1400, y);
      box(gb, 940, 90, 200, 240, 0xe0fbfc, 100);
      floorBoards(gm, 620, 0xade8f4);
      box(gm, 200, 430, 880, 200, 0xffffff, 60);
      gm.fillStyle(0x90e0ef).fillEllipse(640, 450, 820, 50);
      box(gm, 80, 260, 30, 200, 0xff8fb1, 6);
      // drip from faucet
      box(gm, 1040, 400, 40, 30, 0xcbd5e1, 6);
      const drop = scene.add.graphics({ x: 1060, y: 440 });
      drop.fillStyle(0x5ec8ff).fillCircle(0, 0, 6);
      anim(drop, mid);
      scene.tweens.add({ targets: drop, y: 470, alpha: 0, duration: 900, repeat: -1 });
      break;
    }
    case 'bedroom': {
      box(gb, -100, -10, 1480, 760, 0x1d3557, 0, 0);
      windowFrame(gb, 120, 80, 260, 200, 0x0b132b, 0x1c2541);
      circ(gb, 300, 140, 34, 0xfff3b0, 3);
      gb.fillStyle(0xffffff);
      for (let i = 0; i < 10; i++) gb.fillCircle(130 + ((i * 47) % 240), 95 + ((i * 31) % 170), 2);
      floorBoards(gm, 600, 0x6d597a);
      box(gm, 560, 400, 560, 200, 0x7fc8f8, 18);
      box(gm, 540, 330, 40, 270, 0xa0662b, 8);
      box(gm, 1110, 380, 40, 220, 0xa0662b, 8);
      gm.fillStyle(0xffffff).fillEllipse(660, 400, 160, 50);
      // night lamp glow
      const glow = scene.add.graphics();
      glow.fillStyle(0xfff3b0, 0.25).fillCircle(1230, 470, 70);
      anim(glow, front);
      scene.tweens.add({ targets: glow, alpha: 0.5, duration: 1400, yoyo: true, repeat: -1 });
      box(gf, 1210, 480, 40, 120, 0x8d99ae, 6);
      break;
    }
    case 'office': {
      box(gb, -100, -10, 1480, 760, 0xdde5f0, 0, 0);
      for (let s = 0; s < 2; s++) {
        box(gb, 60 + s * 900, 70, 300, 440, 0x6d4c41, 6);
        for (let r = 0; r < 4; r++) {
          gb.lineStyle(4, O).lineBetween(60 + s * 900, 170 + r * 100, 360 + s * 900, 170 + r * 100);
          for (let b = 0; b < 8; b++) box(gb, 72 + s * 900 + b * 34, 98 + r * 100, 28, 70, [0x7b2cbf, 0x9d0208, 0x2d6a4f, 0x1d3557][(b + r) % 4], 2, 2);
        }
      }
      box(gb, 520, 90, 230, 150, 0xfdf6e3, 4);
      gb.lineStyle(3, O).lineBetween(635, 120, 635, 210);
      gb.lineBetween(575, 140, 695, 140);
      gb.strokeCircle(580, 170, 18);
      gb.strokeCircle(690, 170, 18);
      floorBoards(gm, 600, 0x8d6e63);
      box(gm, 330, 470, 620, 40, 0x6d4c41, 6);
      box(gm, 360, 510, 30, 90, 0x6d4c41, 4);
      box(gm, 890, 510, 30, 90, 0x6d4c41, 4);
      break;
    }
    case 'car': {
      sky(gb, 0x8ecae6, 0xe0fbfc);
      gb.fillStyle(0x9bc995).fillEllipse(300, 420, 900, 260);
      gb.fillStyle(0x7fb77e).fillEllipse(1000, 430, 900, 220);
      gb.fillStyle(0x6c757d).fillTriangle(640, 300, 200, 720, 1080, 720);
      gb.lineStyle(8, 0xffffff).lineBetween(640, 320, 640, 720);
      for (let i = 0; i < 3; i++) cloud(scene, back, 200 + i * 450, 80 + i * 30, 0.9, 25);
      box(gm, -50, 540, 1380, 220, 0x343a40, 40);
      circ(gm, 380, 600, 70, 0x495057);
      gm.lineStyle(10, O).strokeCircle(380, 600, 50);
      box(gm, 700, 570, 200, 80, 0x212529, 10);
      box(gm, 714, 580, 172, 60, 0x4cc9f0, 6, 2);
      break;
    }
    case 'street': {
      sky(gb, 0x74c0fc, 0xe7f5ff);
      for (let i = 0; i < 4; i++) cloud(scene, back, i * 360, 60 + (i % 2) * 50, 1, 15);
      gb.fillStyle(0xa9d18e).fillEllipse(200, 520, 900, 320);
      gb.fillStyle(0x8fbc6b).fillEllipse(1050, 520, 900, 300);
      stoneBuilding(gm, 20, 560, 260, 6);
      stoneBuilding(gm, 320, 560, 210, 5, 0xefe3c8);
      stoneBuilding(gm, 580, 560, 260, 7);
      stoneBuilding(gm, 890, 560, 200, 5, 0xefe3c8);
      stoneBuilding(gm, 1120, 560, 220, 6);
      box(gm, -100, 560, 1480, 40, 0xced4da, 0, 4);
      box(gm, -100, 600, 1480, 200, 0x495057, 0, 0);
      gm.lineStyle(8, 0xffffff);
      for (let x = -80; x < 1400; x += 120) gm.lineBetween(x, 660, x + 60, 660);
      for (let i = 0; i < 4; i++) {
        box(gf, 120 + i * 340, 470, 16, 100, 0x8d6e63, 2);
        circ(gf, 128 + i * 340, 450, 50, 0x52b788);
      }
      break;
    }
    case 'court': {
      sky(gb, 0x4dabf7, 0xd0ebff);
      for (let i = 0; i < 3; i++) cloud(scene, back, 100 + i * 500, 70 + i * 40, 1.1, 18);
      gb.fillStyle(0xa9d18e).fillEllipse(640, 470, 1600, 200);
      gm.lineStyle(3, 0x495057, 0.8);
      for (let x = -100; x < 1400; x += 30) gm.lineBetween(x, 300, x + 30, 460);
      for (let x = -100; x < 1400; x += 30) gm.lineBetween(x + 30, 300, x, 460);
      gm.lineStyle(6, O).lineBetween(-100, 300, 1400, 300);
      box(gm, -100, 460, 1480, 300, 0xe76f51, 0, 0);
      gm.lineStyle(6, 0xffffff);
      gm.lineBetween(-100, 470, 1400, 470);
      gm.strokeEllipse(640, 600, 340, 140);
      break;
    }
    case 'dream': {
      sky(gb, 0x3c096c, 0xc77dff);
      gb.fillStyle(0xffffff);
      for (let i = 0; i < 40; i++) gb.fillCircle((i * 131) % 1300, (i * 71) % 500, (i % 3) + 1);
      circ(gb, 1080, 130, 70, 0xfff3b0, 0);
      gb.fillStyle(0x3c096c).fillCircle(1110, 115, 62);
      for (let i = 0; i < 3; i++) {
        const isl = scene.add.graphics({ x: 180 + i * 420, y: 300 + (i % 2) * 80 });
        isl.fillStyle(0x80ffdb).fillEllipse(0, 0, 200, 50);
        isl.fillStyle(0x7400b8).fillTriangle(-100, 0, 100, 0, 0, 90);
        isl.lineStyle(4, O).strokeEllipse(0, 0, 200, 50);
        mid.add(isl);
        scene.tweens.add({ targets: isl, y: isl.y - 20, duration: 1800 + i * 300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      }
      box(gm, -100, 620, 1480, 200, 0x9d4edd, 0, 0);
      gm.fillStyle(0xe0aaff);
      for (let x = -80; x < 1400; x += 90) gm.fillEllipse(x, 620, 110, 40);
      break;
    }
    case 'yard': {
      sky(gb, 0x74c0fc, 0xe7f5ff);
      const sun = scene.add.graphics({ x: 1140, y: 110 });
      sun.fillStyle(0xffd43b).fillCircle(0, 0, 54);
      sun.lineStyle(6, 0xffd43b);
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        sun.lineBetween(Math.cos(a) * 66, Math.sin(a) * 66, Math.cos(a) * 88, Math.sin(a) * 88);
      }
      back.add(sun);
      scene.tweens.add({ targets: sun, angle: 360, duration: 30000, repeat: -1 });
      for (let i = 0; i < 3; i++) cloud(scene, back, i * 420, 70 + (i % 2) * 40, 0.9, 12);
      gm.fillStyle(0xf8f9fa);
      for (let x = -100; x < 1400; x += 50) {
        box(gm, x, 380, 40, 200, 0xf8f9fa, 6, 3);
      }
      box(gm, -100, 560, 1480, 260, 0x74c69d, 0, 0);
      gm.lineStyle(4, O).lineBetween(-100, 560, 1400, 560);
      box(gm, 120, 260, 30, 320, 0x8d6e63, 4);
      circ(gm, 135, 230, 110, 0x52b788);
      circ(gm, 70, 280, 60, 0x40916c);
      // clothesline
      gm.lineStyle(3, O).lineBetween(700, 300, 1250, 320);
      [0xff595e, 0x1982c4, 0xffca3a, 0x8ac926].forEach((c, i) => box(gm, 740 + i * 120, 304 + i * 5, 70, 70, c, 6, 3));
      break;
    }
    case 'laundry': {
      box(gb, -100, -10, 1480, 760, 0xb8e0d2, 0, 0);
      box(gb, 60, 80, 400, 30, 0xa0662b, 4);
      [0xff595e, 0x1982c4, 0xffca3a, 0x8ac926, 0x9b5de5].forEach((c, i) => box(gb, 80 + i * 74, 20, 50, 60, c, 8, 3));
      floorBoards(gm, 600, 0xcfd8dc);
      for (let i = 0; i < 2; i++) {
        box(gm, 840 + i * 220, 340, 200, 260, 0xf8f9fa, 16);
        circ(gm, 940 + i * 220, 480, 70, 0x90e0ef);
        gm.lineStyle(10, 0xadb5bd).strokeCircle(940 + i * 220, 480, 70);
        box(gm, 860 + i * 220, 356, 80, 20, 0xced4da, 4, 2);
      }
      const suds = scene.add.graphics({ x: 940, y: 480 });
      suds.fillStyle(0xffffff, 0.8).fillCircle(-20, 10, 18).fillCircle(15, -10, 22).fillCircle(20, 25, 14);
      mid.add(suds);
      scene.tweens.add({ targets: suds, angle: 360, duration: 2000, repeat: -1 });
      break;
    }
  }
  // Bake the static vector art into textures once per scene (big win on phones / software GL).
  for (const [layer, g] of [[back, gb], [mid, gm], [front, gf]] as const) {
    const rt = scene.add.renderTexture(-100, -60, 1480, 840).setOrigin(0);
    rt.draw(g, 100, 60);
    layer.remove(g, true);
    layer.addAt(rt, 0);
  }
  return {
    layers: [back, mid, front],
    update: (px: number) => {
      const off = (px - 640) / 640;
      back.x = -off * 4;
      mid.x = -off * 10;
      front.x = -off * 20;
    },
  };
}
