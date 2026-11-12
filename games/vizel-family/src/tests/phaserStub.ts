/** Minimal Phaser stand-in for unit tests (jsdom has no canvas). Only pure helpers are exercised. */
class Base {
  constructor(..._a: any[]) {}
}
const shuffle = <T>(a: T[]) => {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const Phaser: any = {
  Scene: Base,
  Game: Base,
  GameObjects: { Container: Base, Image: Base, Graphics: Base, Text: Base, Events: {} },
  Utils: { Array: { Shuffle: shuffle, GetRandom: <T>(a: T[]) => a[Math.floor(Math.random() * a.length)] } },
  Math: {
    Between: (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1)),
    Clamp: (v: number, a: number, b: number) => Math.max(a, Math.min(b, v)),
    DegToRad: (d: number) => (d * Math.PI) / 180,
    Distance: { Between: (x1: number, y1: number, x2: number, y2: number) => Math.hypot(x2 - x1, y2 - y1) },
    Vector2: class {
      constructor(public x = 0, public y = 0) {}
    },
  },
  Geom: { Rectangle: Base, Circle: Base },
  Display: { Color: { ValueToColor: () => ({ darken: () => ({ color: 0 }) }) } },
  Scale: {},
  Scenes: { Events: {} },
  AUTO: 0,
};
export default Phaser;
