import { useEffect, useState } from 'react';
import { loadGradeIndex } from './content/loader';
import type { GradeIndex } from './types';

export default function App() {
  const [grade, setGrade] = useState<GradeIndex | null>(null);
  const [error, setError] = useState('');
  useEffect(() => { loadGradeIndex('grade4').then(setGrade, () => setError('تعذّر تحميل الدروس')); }, []);
  return (
    <main className="mx-auto max-w-2xl p-4">
      <h1 className="text-3xl font-bold text-teal-700"><span className="en">Hello Libya</span></h1>
      {error && <p role="alert">{error}</p>}
      {grade?.units.map(u => (
        <section key={u.id} className="mt-4">
          <h2 className="text-xl font-bold">{u.titleAr} <span className="en">{u.title}</span></h2>
          <ul>{u.lessons.map(l => <li key={l.id}>{l.titleAr} – <span className="en">{l.title}</span></li>)}</ul>
        </section>
      ))}
    </main>
  );
}
