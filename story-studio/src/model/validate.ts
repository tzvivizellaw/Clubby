import type { Scene, Story } from './types';

/**
 * blocker  – the story can't start at all.
 * problem  – a reader can get stuck on some path (still playable elsewhere).
 * tip      – a suggestion for improvement; never blocks play.
 */
export type Severity = 'blocker' | 'problem' | 'tip';

export type IssueCode =
  | 'no-start'
  | 'missing-target'
  | 'broken-target'
  | 'unreachable'
  | 'no-reachable-ending'
  | 'trap-cycle'
  | 'empty-option-text'
  | 'unnamed-ending'
  | 'no-options';

export interface Issue {
  key: string;
  severity: Severity;
  code: IssueCode;
  message: string;
  sceneId?: string;
  optionId?: string;
}

/** All targets a scene can lead to (including null/missing ones). */
export function outgoing(scene: Scene): (string | null)[] {
  if (scene.next.type === 'goto') return [scene.next.target];
  if (scene.next.type === 'choice') return scene.next.options.map((o) => o.target);
  return [];
}

export function reachableFrom(story: Story, startId: string): Set<string> {
  const byId = new Map(story.scenes.map((s) => [s.id, s]));
  const seen = new Set<string>();
  const stack = byId.has(startId) ? [startId] : [];
  while (stack.length) {
    const id = stack.pop()!;
    if (seen.has(id)) continue;
    seen.add(id);
    const scene = byId.get(id)!;
    for (const t of outgoing(scene)) if (t && byId.has(t) && !seen.has(t)) stack.push(t);
  }
  return seen;
}

/** Scenes from which at least one ending can be reached. */
export function canReachEnding(story: Story): Set<string> {
  const byId = new Map(story.scenes.map((s) => [s.id, s]));
  const good = new Set(story.scenes.filter((s) => s.next.type === 'end').map((s) => s.id));
  let changed = true;
  while (changed) {
    changed = false;
    for (const s of story.scenes) {
      if (good.has(s.id)) continue;
      if (outgoing(s).some((t) => t && byId.has(t) && good.has(t))) {
        good.add(s.id);
        changed = true;
      }
    }
  }
  return good;
}

export function validateStory(story: Story): Issue[] {
  const issues: Issue[] = [];
  const byId = new Map(story.scenes.map((s) => [s.id, s]));
  const name = (s: Scene) => `״${s.name || 'סצנה ללא שם'}״`;

  if (!byId.has(story.startSceneId)) {
    issues.push({
      key: 'no-start',
      severity: 'blocker',
      code: 'no-start',
      message: 'עוד לא בחרנו סצנת פתיחה. איפה הסיפור מתחיל?',
    });
    return issues;
  }

  const reachable = reachableFrom(story, story.startSceneId);
  const endingOk = canReachEnding(story);
  const brokenScenes = new Set<string>();

  for (const scene of story.scenes) {
    const isReachable = reachable.has(scene.id);
    const linkSeverity = isReachable ? 'problem' : 'tip';
    const n = scene.next;
    if (n.type === 'goto') {
      if (!n.target) {
        brokenScenes.add(scene.id);
        issues.push({
          key: `missing:${scene.id}`,
          severity: linkSeverity,
          code: 'missing-target',
          sceneId: scene.id,
          message: `בסצנה ${name(scene)} עוד אין המשך. לאיזו סצנה היא תיקח אותנו?`,
        });
      } else if (!byId.has(n.target)) {
        brokenScenes.add(scene.id);
        issues.push({
          key: `broken:${scene.id}`,
          severity: linkSeverity,
          code: 'broken-target',
          sceneId: scene.id,
          message: `הסצנה ש${name(scene)} הובילה אליה נמחקה. בחרי לאן ממשיכים עכשיו.`,
        });
      }
    } else if (n.type === 'choice') {
      if (n.options.length === 0) {
        brokenScenes.add(scene.id);
        issues.push({
          key: `noopts:${scene.id}`,
          severity: linkSeverity,
          code: 'no-options',
          sceneId: scene.id,
          message: `בסצנה ${name(scene)} יש שאלה, אבל עוד אין אפשרויות לבחור.`,
        });
      }
      n.options.forEach((o, i) => {
        if (!o.text.trim()) {
          issues.push({
            key: `optext:${o.id}`,
            severity: 'tip',
            code: 'empty-option-text',
            sceneId: scene.id,
            optionId: o.id,
            message: `לבחירה מספר ${i + 1} בסצנה ${name(scene)} עוד אין טקסט. מה הקוראת תראה על הכפתור?`,
          });
        }
        if (!o.target) {
          brokenScenes.add(scene.id);
          issues.push({
            key: `missing:${o.id}`,
            severity: linkSeverity,
            code: 'missing-target',
            sceneId: scene.id,
            optionId: o.id,
            message: `לבחירה ״${o.text || `מספר ${i + 1}`}״ עוד אין המשך. לאיזו סצנה היא תיקח אותנו?`,
          });
        } else if (!byId.has(o.target)) {
          brokenScenes.add(scene.id);
          issues.push({
            key: `broken:${o.id}`,
            severity: linkSeverity,
            code: 'broken-target',
            sceneId: scene.id,
            optionId: o.id,
            message: `הבחירה ״${o.text || `מספר ${i + 1}`}״ הובילה לסצנה שנמחקה. בחרי לה יעד חדש.`,
          });
        }
      });
    } else if (n.type === 'end' && !n.endingName.trim()) {
      issues.push({
        key: `unnamed:${scene.id}`,
        severity: 'tip',
        code: 'unnamed-ending',
        sceneId: scene.id,
        message: `הסוף ב${name(scene)} עוד בלי שם. איך נקרא לו? למשל ״סוף של חברות״.`,
      });
    }

    if (!isReachable) {
      issues.push({
        key: `unreachable:${scene.id}`,
        severity: 'tip',
        code: 'unreachable',
        sceneId: scene.id,
        message: `אי אפשר להגיע לסצנה ${name(scene)} מסצנת הפתיחה. אפשר לחבר אליה בחירה — או להשאיר אותה לאחר כך.`,
      });
    }
  }

  const anyReachableEnding = [...reachable].some((id) => byId.get(id)!.next.type === 'end');
  if (!anyReachableEnding) {
    issues.push({
      key: 'no-ending',
      severity: 'problem',
      code: 'no-reachable-ending',
      message: 'עוד אין לסיפור סוף שאפשר להגיע אליו. סמני סצנה אחת כ״סיום״ וחברי אליה.',
    });
  } else {
    // Reachable scenes that can never reach an ending, and are not stuck only because of a missing link → a loop.
    const trapped = [...reachable].filter((id) => !endingOk.has(id) && !brokenScenes.has(id));
    const loopScenes = trapped.filter((id) => outgoing(byId.get(id)!).every((t) => t && byId.has(t) && !endingOk.has(t)));
    if (loopScenes.length) {
      const names = loopScenes.map((id) => name(byId.get(id)!)).join(', ');
      issues.push({
        key: `loop:${loopScenes.join(',')}`,
        severity: 'problem',
        code: 'trap-cycle',
        sceneId: loopScenes[0],
        message: `הסצנות ${names} מובילות אחת לשנייה במעגל, ואין מהן דרך לסיום. הוסיפי בחירה שיוצאת מהמעגל.`,
      });
    }
  }

  const order: Record<Severity, number> = { blocker: 0, problem: 1, tip: 2 };
  return issues.sort((a, b) => order[a.severity] - order[b.severity]);
}

export function canPlay(issues: Issue[]): boolean {
  return !issues.some((i) => i.severity === 'blocker');
}
