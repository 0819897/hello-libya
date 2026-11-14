import { useEffect, useState } from 'react';
import type { GradeIndex, Lesson } from '../types';
import { loadGradeIndex, loadGradeLessons } from '../content/loader';
import { useProgress } from '../state/ProgressContext';
import { Shell } from '../ui/Shell';
import { Pic, WordChip } from '../ui/WordChip';

export default function Dictionary() {
  const { progress } = useProgress();
  const [grade, setGrade] = useState<GradeIndex | null>(null);
  const [units, setUnits] = useState<{ unitId: string; lessons: Lesson[] }[] | null>(null);
  useEffect(() => {
    loadGradeIndex('grade4').then(async g => { setGrade(g); setUnits(await loadGradeLessons(g)); }).catch(() => setUnits([]));
  }, []);
  const learned = new Set(progress.learned);
  const groups = (units ?? []).map(u => ({
    unit: grade?.units.find(x => x.id === u.unitId),
    words: [...new Map(u.lessons.flatMap(l => l.words)
      .filter(w => learned.has(w.en)).map(w => [w.en, w])).values()],
  })).filter(g => g.words.length > 0);
  const extra = [...new Map(progress.imported.flatMap(l => l.words).filter(w => learned.has(w.en)).map(w => [w.en, w])).values()];
  if (extra.length) groups.push({ unit: undefined, words: extra });

  return (
    <Shell title="قاموسي">
      <h1 className="mb-4 text-2xl font-black">قاموسي <span className="text-lg font-normal">({progress.learned.length} كلمة)</span></h1>
      {!units && <p>جارٍ التحميل…</p>}
      {units && groups.length === 0 && <p className="text-lg">لم تتعلّم كلمات بعد. أكمل درساً لتظهر كلماتك هنا.</p>}
      {groups.map((g, i) => (
        <section key={g.unit?.id ?? 'extra' + i} className="mb-6">
          <h2 className="mb-2 text-xl font-bold">{g.unit ? <>{g.unit.titleAr} · <span className="en">{g.unit.title}</span></> : 'دروس إضافية'}</h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {g.words.map(w => (
              <li key={w.en} className="flex items-center gap-3 rounded-2xl bg-white p-2 shadow-sm">
                <span className="w-12 text-center"><Pic emoji={w.emoji} image={w.image} text="" className="text-3xl" /></span>
                <WordChip en={w.en} audio={w.audio} className="text-xl font-bold" />
                <span className="ms-auto text-lg">{w.ar}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </Shell>
  );
}
