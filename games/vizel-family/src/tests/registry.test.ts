import { describe, expect, it } from 'vitest';
import { OBJ } from '../assets/objects';
import { BG_KEYS } from '../assets/backgrounds';
import { THEMES } from '../audio/music';
import { getVoice, VOICE_REGISTRY } from '../audio/VoiceRegistry';
import { SERIES } from '../data/characters';
import { difficultyFor } from '../data/difficulty';
import { allGames, LOADERS, REGISTRY } from '../minigames/registry';

describe('mini-game registry', () => {
  const games = allGames();

  it('has 40 mini-games, 8 per series, unique ids', () => {
    expect(games.length).toBe(40);
    for (const s of SERIES) expect(REGISTRY[s].length).toBe(8);
    expect(new Set(games.map((g) => g.id)).size).toBe(40);
  });

  it('every mini-game has a real implementation file', () => {
    for (const g of games) expect(LOADERS[g.id], g.id).toBeTypeOf('function');
  });

  it('every definition has the required fields', () => {
    for (const g of games) {
      for (const k of ['id', 'title', 'instructions', 'short', 'duration', 'winCondition', 'loseCondition', 'winAnimation', 'loseAnimation', 'item'] as const) {
        expect(String(g[k]).length, `${g.id}.${k}`).toBeGreaterThan(0);
      }
      expect(g.intro.length, `${g.id} intro`).toBeGreaterThan(2);
      expect(g.win.length, `${g.id} win`).toBeGreaterThan(1);
      expect(g.lose.length, `${g.id} lose`).toBeGreaterThan(0);
      expect(OBJ[g.icon], `${g.id} icon ${g.icon}`).toBeDefined();
      expect(BG_KEYS).toContain(g.bg);
      if (g.music) expect(THEMES[g.music], `${g.id} music`).toBeDefined();
    }
  });

  it('nextStage chains each series in order and ends with null', () => {
    for (const s of SERIES) {
      const list = REGISTRY[s];
      list.forEach((g, i) => expect(g.nextStage).toBe(list[i + 1]?.id ?? null));
      list.forEach((g, i) => expect(g.index).toBe(i));
    }
  });

  it('story scripts reference only existing textures, voices and props', () => {
    for (const g of games) {
      for (const kind of ['intro', 'win', 'lose'] as const) {
        const ids = new Set<string>();
        for (const st of g[kind]) {
          if (st.t === 'prop') {
            expect(OBJ[st.tex], `${g.id}.${kind} prop ${st.tex}`).toBeDefined();
            ids.add(st.id);
          }
          if (st.t === 'char') ids.add(st.who);
          if (st.t === 'say' && st.voice) expect(getVoice(st.voice), `${g.id} voice ${st.voice}`).toBeDefined();
          if (st.t === 'act') expect(ids.has(st.target), `${g.id}.${kind} act on unknown ${st.target}`).toBe(true);
        }
      }
      for (const v of g.voiceEvents) expect(getVoice(v), `${g.id} voiceEvent ${v}`).toBeDefined();
    }
  });
});

describe('voice registry', () => {
  it('maps the recording phrases to files per speaker with variants', () => {
    const k = getVoice('father.where_are_keys')!;
    expect(k.speaker).toBe('father');
    expect(k.files[0]).toBe('father/father_where_are_keys_01.mp3');
    expect(k.files.length).toBeGreaterThan(1);
    for (const v of Object.values(VOICE_REGISTRY)) expect(v.files.every((f) => f.startsWith(`${v.speaker}/${v.speaker}_`) && f.endsWith('.mp3'))).toBe(true);
  });
});

describe('difficulty', () => {
  it('differs per child and respects parent settings', () => {
    expect(difficultyFor('esti').hardFail).toBe(false);
    expect(difficultyFor('esti', 'harder').hardFail).toBe(false);
    expect(difficultyFor('yedidya').tier).toBe('easy');
    expect(difficultyFor('daniel').tier).toBe('medium');
    expect(difficultyFor('avigail').tier).toBe('hard');
    expect(difficultyFor('avigail', 'easier').tier).toBe('medium');
    expect(difficultyFor('yedidya', 'harder').tier).toBe('medium');
  });
});
