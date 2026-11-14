import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { GradeEntry } from '../types';
import { loadGrades } from '../content/loader';
import { useProgress } from '../state/ProgressContext';
import { Shell } from '../ui/Shell';

export default function GradeMap() {
  const { progress } = useProgress();
  const [grades, setGrades] = useState<GradeEntry[] | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => { loadGrades().then(setGrades, () => setError(true)); }, []);
  const self = progress.mode === 'self';
  return (
    <Shell title={self ? 'اختر المستوى' : 'اختر الصف'}>
      <h1 className="mb-4 text-2xl font-black">أهلاً {progress.name}!</h1>
      {error && <p role="alert">تعذّر تحميل القائمة.</p>}
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {grades?.map(g => {
          const title = self ? g.levelTitleAr : g.titleAr;
          return (
            <li key={g.id}>
              {g.status === 'open' ? (
                <Link to={`/grade/${g.id}`} className="flex min-h-28 flex-col items-center justify-center rounded-3xl border-b-8 border-teal-800 bg-teal-500 p-3 text-center text-xl font-black text-white">
                  <span className="text-3xl" aria-hidden>⭐</span>{title}
                </Link>
              ) : (
                <div aria-disabled="true" className="flex min-h-28 flex-col items-center justify-center rounded-3xl border-b-8 border-gray-300 bg-gray-100 p-3 text-center text-lg font-bold text-gray-500">
                  <span aria-hidden>🔒</span>{title}<span className="text-sm">قريباً</span>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </Shell>
  );
}
