import { describe, expect, it } from 'vitest';
import { clueTrue, makeClues, type Suspect } from '../minigames/avigail/A2_WhoTookIt';
import { makeEq } from '../minigames/avigail/A4_DanielsTest';
import { allCodes, score } from '../minigames/avigail/A6_SecretAgent';
import { cheapest, SHOP, valid } from '../minigames/avigail/A7_SurpriseParty';
import { MISHNA_TEXT, QUESTIONS } from '../minigames/daniel/D3_MishnaTest';
import { flows, makePuzzle, rot } from '../minigames/daniel/D5_Inventor';
import { bfs, makeMaze } from '../minigames/daniel/D6_RunawayBall';

let seed = 1;
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const rnd = (a: number, b: number) => a + Math.floor(rand() * (b - a + 1));

describe('A2 detective clues', () => {
  it('always narrow down to exactly the culprit', () => {
    for (let k = 0; k < 200; k++) {
      const combos: Suspect[] = [];
      for (const color of ['red', 'blue', 'green'] as const) for (const legs of [true, false]) for (const window of [true, false]) combos.push({ color, legs, window });
      const sus = combos.sort(() => rand() - 0.5).slice(0, 6);
      const t = rnd(0, 5);
      const clues = makeClues(sus, t);
      const left = sus.filter((s) => clues.every((c) => clueTrue(c, s)));
      expect(left).toEqual([sus[t]]);
      expect(clues.length).toBeLessThanOrEqual(5);
    }
  });
});

describe('A4 equations', () => {
  it('"correct" flag matches the arithmetic', () => {
    for (let k = 0; k < 300; k++) {
      const e = makeEq(k % 2 === 0, rnd);
      const r = e.op === '+' ? e.a + e.b : e.op === '-' ? e.a - e.b : e.a * e.b;
      expect(e.shown === r).toBe(e.correct);
      expect(r).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('A6 code breaking', () => {
  it('scores like Mastermind and a consistent-guess strategy solves within 8 tries', () => {
    expect(score([0, 1, 2, 3], [0, 2, 1, 4])).toEqual({ exact: 1, near: 2 });
    for (const nSym of [5, 6]) {
      for (let k = 0; k < 40; k++) {
        const codes = allCodes(nSym, 4);
        const code = codes[rnd(0, codes.length - 1)];
        const hist: { g: number[]; s: ReturnType<typeof score> }[] = [];
        let tries = 0;
        for (;;) {
          const c = codes.find((cand) => hist.every((h) => {
            const s = score(cand, h.g);
            return s.exact === h.s.exact && s.near === h.s.near;
          }))!;
          tries++;
          const s = score(code, c);
          hist.push({ g: c, s });
          if (s.exact === 4) break;
        }
        expect(tries).toBeLessThanOrEqual(8);
      }
    }
  });
});

describe('A7 party planning', () => {
  it('generated budgets are always feasible', () => {
    for (let food = 3; food <= 8; food++) {
      const min = cheapest({ food });
      expect(Number.isFinite(min)).toBe(true);
      let ok = false;
      for (let m = 1; m < 1 << SHOP.length; m++) if (valid(SHOP.filter((_, i) => m & (1 << i)), { budget: min + 5, food }).ok) ok = true;
      expect(ok).toBe(true);
    }
  });
});

describe('D3 Mishna content', () => {
  it('every correct answer appears in the Mishna text and options are distinct', () => {
    const norm = (s: string) => s.replace(/בט"ו/g, 'בחמשה עשר').replace(/[,]/g, '');
    for (const q of QUESTIONS) {
      expect(new Set([q.a, ...q.wrong]).size).toBe(q.wrong.length + 1);
      const key = norm(q.a).split(' ').filter((w) => w.length > 2)[0] ?? q.a;
      expect(norm(MISHNA_TEXT).includes(key.replace(/^ב/, '')) || MISHNA_TEXT.includes(q.a), q.q).toBe(true);
    }
    expect(MISHNA_TEXT).toContain('ארבעה ראשי שנים הם');
    expect(MISHNA_TEXT).toContain('ובחג נידונין על המים');
  });
});

describe('D5 pipe puzzle', () => {
  it('the generated solution always flows', () => {
    for (let k = 0; k < 200; k++) {
      const p = makePuzzle(rnd(4, 6), rnd(3, 4), rand);
      const rots = p.base.map((b, i) => {
        if (!p.path.has(i)) return 0;
        for (let r = 0; r < 4; r++) if (rot(b, r) === p.solution[i]) return r;
        throw new Error('unreachable solution');
      });
      expect(flows(p, rots)).toBe(true);
    }
  });
});

describe('D6 maze', () => {
  it('the goal is always reachable', () => {
    for (let k = 0; k < 100; k++) {
      const w = makeMaze(9, 5, rand);
      expect(bfs(w, 9, 5, 0, 44)).not.toBeNull();
    }
  });
});
