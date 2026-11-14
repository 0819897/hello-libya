import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { GradeIndex } from '../types';
import { loadGradeIndex } from '../content/loader';
import { isUnlocked } from '../state/progress';
import { useProgress } from '../state/ProgressContext';
import { Shell } from '../ui/Shell';
import { StarRow } from '../ui/StarRow';

const offsets = ['translate-x-0', '-translate-x-12', '-translate-x-20', '-translate-x-12', 'translate-x-0', 'translate-x-12', 'translate-x-20', 'translate-x-12'];
const nodeCls = 'flex h-20 w-20 items-center justify-center rounded-full border-b-8 text-3xl font-black';

function Node({ to, locked, done, label, sub, icon, i }: { to: string; locked: boolean; done?: boolean; label: React.ReactNode; sub?: React.ReactNode; icon: string; i: number }) {
  const inner = (<>
    <span className={`${nodeCls} ${locked ? 'border-gray-400 bg-gray-200 text-gray-500' : done ? 'border-amber-600 bg-amber-400' : 'border-teal-800 bg-teal-500 text-white'}`} aria-hidden>
      {locked ? '🔒' : icon}
    </span>
    <span className="mt-1 max-w-44 text-center font-bold leading-tight">{label}</span>
    {sub}
  </>);
  const cls = `flex flex-col items-center ${offsets[i % offsets.length]}`;
  return locked
    ? <div className={`${cls} opacity-70`} aria-disabled="true">{inner}</div>
    : <Link to={to} className={`${cls} rounded-2xl p-1 hover:scale-105 transition`}>{inner}</Link>;
}

export function UnitPathView({ grade }: { grade: GradeIndex }) {
  const { progress } = useProgress();
  const self = progress.mode === 'self';
  const regular = grade.units.filter(u => u.kind === 'unit' && u.status === 'open');
  const allDone = regular.every(u => u.lessons.every(l => (progress.lessons[l.id]?.stars ?? 0) >= 1));
  const extra = progress.imported;
  let n = 0;
  return (
    <Shell title={self ? grade.levelTitleAr : grade.titleAr}>
      {progress.mistakes.length >= 4 && (
        <div className="mb-6 flex justify-center">
          <Link to={`/lesson/${grade.id}/review`} className="flex min-h-14 items-center gap-2 rounded-2xl border-4 border-rose-300 bg-rose-50 px-5 text-lg font-bold text-rose-800">
            <span aria-hidden>🔁</span> راجع أخطاءك ({progress.mistakes.length})
          </Link>
        </div>
      )}
      {grade.units.map((u, ui) => (
        <section key={u.id} className="mb-10">
          <h2 className="mb-4 rounded-2xl bg-teal-700 px-4 py-3 text-white">
            <span className="block text-sm opacity-80">{u.kind === 'big-challenge' ? 'المراجعة' : `الوحدة ${ui + 1}`}</span>
            <span className="text-xl font-bold">{u.titleAr}</span> · <span className="en">{u.title}</span>
          </h2>
          {u.status === 'soon' ? (
            <p className="text-center text-lg font-bold text-gray-500"><span aria-hidden>🔒</span> قريباً</p>
          ) : u.kind === 'big-challenge' ? (
            <div className="flex flex-col items-center">
              <Node i={0} to={`/big/${grade.id}`} locked={!(allDone || progress.teacherMode)} icon="🏆"
                done={progress.badges.includes('big-challenge')} label="التحدي الكبير"
                sub={!(allDone || progress.teacherMode) && <span className="text-sm text-gray-600">يُفتح بعد نجمة في كل دروس الوحدات 1–3</span>} />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-5">
              {u.lessons.map(l => {
                const st = progress.lessons[l.id]?.stars ?? 0;
                return <Node key={l.id} i={n++} to={`/lesson/${grade.id}/${l.id}`} locked={!isUnlocked(progress, grade, l.id)}
                  done={st > 0} icon={st > 0 ? '✓' : '▶'} label={<>{l.titleAr}<span className="en block text-sm font-normal">{l.title}</span></>}
                  sub={<StarRow stars={st} size="text-lg" />} />;
              })}
            </div>
          )}
        </section>
      ))}
      {extra.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 rounded-2xl bg-amber-600 px-4 py-3 text-xl font-bold text-white">دروس إضافية</h2>
          <div className="flex flex-col items-center gap-5">
            {extra.map((l, i) => <Node key={l.id} i={i} to={`/lesson/${grade.id}/${l.id}`} locked={false}
              done={(progress.lessons[l.id]?.stars ?? 0) > 0} icon="★"
              label={<>{l.titleAr}<span className="en block text-sm font-normal">{l.title}</span></>}
              sub={<StarRow stars={progress.lessons[l.id]?.stars ?? 0} size="text-lg" />} />)}
          </div>
        </section>
      )}
    </Shell>
  );
}

export default function UnitPath() {
  const { gradeId = 'grade4' } = useParams();
  const [grade, setGrade] = useState<GradeIndex | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => { loadGradeIndex(gradeId).then(setGrade, () => setError(true)); }, [gradeId]);
  if (error) return <Shell><p role="alert" className="text-center text-xl">تعذّر تحميل الدروس. <Link className="underline" to="/grades">العودة</Link></p></Shell>;
  if (!grade) return <Shell><p className="text-center text-xl">جارٍ التحميل…</p></Shell>;
  return <UnitPathView grade={grade} />;
}
