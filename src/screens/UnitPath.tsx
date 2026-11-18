import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { GradeIndex } from '../types';
import { loadGradeIndex } from '../content/loader';
import { bigBadgeFor, isUnlocked, setLastGrade } from '../state/progress';
import { DAILY_QUESTS, loadDuo } from '../state/quests';
import { useProgress } from '../state/ProgressContext';
import { ProgressBar } from '../ui/ProgressBar';
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
  useEffect(() => { setLastGrade(grade.id); }, [grade.id]);
  const self = progress.mode === 'self';
  const isG5 = grade.id === 'grade5';
  const duo = loadDuo();
  const regular = grade.units.filter(u => u.kind === 'unit' && u.status === 'open');
  const allDone = regular.every(u => u.lessons.every(l => (progress.lessons[l.id]?.stars ?? 0) >= 1));
  const extra = progress.imported;
  let n = 0;
  return (
    <Shell title={self ? grade.levelTitleAr : grade.titleAr} gradeId={grade.id}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        {isG5 && duo.freezes > 0 ? (
          <span className="rounded-2xl bg-sky-100 px-3 py-1 text-sm font-bold text-sky-900">
            🧊 تجميد السلسلة مفعل ({duo.freezes})
          </span>
        ) : <span />}
        <Link to="/grades" className="flex min-h-12 items-center gap-1 rounded-2xl bg-white px-4 font-bold text-teal-800 shadow-sm">
          <span aria-hidden>⇄</span> {self ? 'تغيير المستوى' : 'تغيير الصف'}
        </Link>
      </div>
      {isG5 && (
        <section className="mb-6 space-y-3" aria-label="تحديات ومهام اليوم">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Link to={`/speed/${grade.id}`} className="flex min-h-16 flex-col items-center justify-center rounded-2xl border-b-4 border-amber-500 bg-amber-100 p-2 text-center font-black text-amber-950 hover:scale-[1.02] transition">
              <span className="text-2xl" aria-hidden>⚡</span>تحدّي البرق
            </Link>
            <Link to={`/stories/${grade.id}`} className="flex min-h-16 flex-col items-center justify-center rounded-2xl border-b-4 border-teal-700 bg-teal-100 p-2 text-center font-black text-teal-950 hover:scale-[1.02] transition">
              <span className="text-2xl" aria-hidden>📖</span>قصص المغامرة
            </Link>
            <Link to="/league" className="flex min-h-16 flex-col items-center justify-center rounded-2xl border-b-4 border-indigo-600 bg-indigo-100 p-2 text-center font-black text-indigo-950 hover:scale-[1.02] transition">
              <span className="text-2xl" aria-hidden>🏆</span>دوري المتصدرين
            </Link>
            <Link to="/shop" className="flex min-h-16 flex-col items-center justify-center rounded-2xl border-b-4 border-rose-500 bg-rose-100 p-2 text-center font-black text-rose-950 hover:scale-[1.02] transition">
              <span className="text-2xl" aria-hidden>🛒</span>متجر الجواهر
            </Link>
          </div>
          <div className="rounded-3xl border-2 border-amber-200 bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-lg font-black text-teal-800">🎯 المهام اليومية</h2>
              <span className="text-sm font-bold text-amber-700">{duo.claimed.length} / {DAILY_QUESTS.length} مكتملة</span>
            </div>
            <ul className="space-y-2">
              {DAILY_QUESTS.map(q => {
                const val = Math.min(q.target, q.get(duo));
                const done = duo.claimed.includes(q.id);
                return (
                  <li key={q.id} className="rounded-2xl bg-amber-50/70 p-2.5">
                    <div className="mb-1 flex items-center justify-between text-sm font-bold">
                      <span><span aria-hidden>{q.icon} </span>{q.titleAr}</span>
                      <span className={done ? 'text-green-800' : 'text-amber-800'}>
                        {done ? '✓ تم الاستلام' : `${val}/${q.target} (+${q.reward} 💎)`}
                      </span>
                    </div>
                    <ProgressBar value={val} max={q.target} label={q.titleAr} />
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      )}
      {progress.mistakes.length >= 4 && (
        <div className="mb-6 flex justify-center">
          <Link to={`/lesson/${grade.id}/review`} className="flex min-h-14 items-center gap-2 rounded-2xl border-4 border-rose-300 bg-rose-50 px-5 text-lg font-bold text-rose-800">
            <span aria-hidden>🔁</span> راجع أخطاءك ({progress.mistakes.length})
          </Link>
        </div>
      )}
      {grade.units.map((u, ui) => {
        const unitNum = u.id.match(/u(\d+)$/)?.[1] ?? (ui + 1);
        return (
        <section key={u.id} className="mb-10">
          <h2 className="mb-4 rounded-2xl bg-teal-700 px-4 py-3 text-white">
            <span className="block text-sm opacity-80">{u.kind === 'big-challenge' ? 'المراجعة' : `الوحدة ${unitNum}`}</span>
            <span className="text-xl font-bold">{u.titleAr}</span> · <span className="en">{u.title}</span>
          </h2>
          {u.status === 'soon' ? (
            <p className="text-center text-lg font-bold text-gray-500"><span aria-hidden>🔒</span> قريباً</p>
          ) : u.kind === 'big-challenge' ? (
            <div className="flex flex-col items-center">
              <Node i={0} to={`/big/${grade.id}`} locked={!(allDone || progress.teacherMode)} icon="🏆"
                done={progress.badges.includes(bigBadgeFor(grade.id))} label="التحدي الكبير"
                sub={!(allDone || progress.teacherMode) && <span className="text-sm text-gray-600">يُفتح بعد نجمة في كل دروس الوحدات 1–{regular.length}</span>} />
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
        );
      })}
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
