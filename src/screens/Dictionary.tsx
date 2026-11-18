import { useEffect, useState } from 'react';
import type { GradeIndex, Lesson } from '../types';
import { loadGradeIndex, loadGradeLessons, loadGrades } from '../content/loader';
import { useProgress } from '../state/ProgressContext';
import { Shell } from '../ui/Shell';
import { Pic, WordChip } from '../ui/WordChip';

export default function Dictionary() {
  const { progress } = useProgress();
  const [sections, setSections] = useState<{ grade: GradeIndex; units: { unitId: string; lessons: Lesson[] }[] }[] | null>(null);
  useEffect(() => {
    loadGrades().then(async gs => {
      const open = gs.filter(g => g.status === 'open');
      const loaded = await Promise.all(open.map(async g => {
        const grade = await loadGradeIndex(g.id);
        return { grade, units: await loadGradeLessons(grade) };
      }));
      setSections(loaded);
    }).catch(() => setSections([]));
  }, []);
  const self = progress.mode === 'self';
  const learned = new Set(progress.learned);
  const groups = (sections ?? []).flatMap(({ grade, units }) => units.map(u => ({
    gradeLabel: self ? grade.levelTitleAr : grade.titleAr,
    unit: grade.units.find(x => x.id === u.unitId),
    words: [...new Map(u.lessons.flatMap(l => l.words)
      .filter(w => learned.has(w.en)).map(w => [w.en, w])).values()],
  }))).filter(g => g.words.length > 0);
  const extra = [...new Map(progress.imported.flatMap(l => l.words).filter(w => learned.has(w.en)).map(w => [w.en, w])).values()];
  if (extra.length) groups.push({ gradeLabel: '', unit: undefined, words: extra });

  return (
    <Shell title="قاموسي">
      <h1 className="mb-4 text-2xl font-black">قاموسي <span className="text-lg font-normal">({progress.learned.length} كلمة)</span></h1>
      {!sections && <p>جارٍ التحميل…</p>}
      {sections && groups.length === 0 && <p className="text-lg">لم تتعلّم كلمات بعد. أكمل درساً لتظهر كلماتك هنا.</p>}
      {groups.map((g, i) => (
        <section key={g.unit?.id ?? 'extra' + i} className="mb-6">
          <h2 className="mb-2 text-xl font-bold">
            {g.unit ? <>{g.gradeLabel} — {g.unit.titleAr} · <span className="en">{g.unit.title}</span></> : 'دروس إضافية'}
          </h2>
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
