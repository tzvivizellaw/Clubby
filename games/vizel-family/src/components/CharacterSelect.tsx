import { useState } from 'react';
import { useApp } from '../app/store';
import { Audio } from '../audio/AudioManager';
import { CHARACTERS, PLAYERS, type PlayerId } from '../data/characters';
import { CharacterArt } from './Art';

const TIER_LABEL = { toddler: 'פעוטות', easy: 'קל', medium: 'בינוני־מתקדם', hard: 'מתקדם' } as const;

export function CharacterSelect() {
  const { setPlayer, setScreen, save, updateSave } = useApp();
  const [chosen, setChosen] = useState<PlayerId | null>(null);
  const [name, setName] = useState(save.playerName);
  const pick = (id: PlayerId) => {
    if (chosen) return;
    Audio.unlock();
    Audio.sfx('boing');
    const voice = { avigail: 'avigail.i_will_fix_it', daniel: 'daniel.best_at_this', yedidya: 'yedidya.i_am_superhero', esti: 'esti.moo' }[id];
    Audio.say(voice);
    setChosen(id);
    setTimeout(() => {
      setPlayer(id);
      updateSave((s) => {
        s.playerName = name.trim();
      });
      setScreen('map');
    }, 1500);
  };
  return (
    <div className="screen select-screen">
      <h2 className="screen-title">מי משחק?</h2>
      <input className="name-input" placeholder="השם שלך (לא חובה)" value={name} maxLength={16} onChange={(e) => setName(e.target.value)} />
      <div className="cards">
        {PLAYERS.map((id) => {
          const c = CHARACTERS[id];
          const isChosen = chosen === id;
          return (
            <button
              key={id}
              data-testid={`pick-${id}`}
              className={`char-card ${isChosen ? `chosen enter-${id}` : ''} ${chosen && !isChosen ? 'dim' : ''}`}
              style={{ ['--accent' as any]: c.color }}
              onClick={() => pick(id)}
            >
              <CharacterArt id={id} pose={{ expr: isChosen ? 'laugh' : 'smile', armR: isChosen ? 160 : 10 }} className="card-art" />
              <div className="card-name">{c.name}</div>
              <div className="card-age">{id === 'avigail' || id === 'esti' ? 'בת' : 'בן'} {c.age}</div>
              <div className="card-role">{c.role}</div>
              <div className="card-tier">רמה: {TIER_LABEL[c.tier!]}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
