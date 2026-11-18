import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { GameResult, GradeIndex, Lesson, Question } from '../types';
import { loadGradeIndex, loadGradeLessons } from '../content/loader';
import { bigChallengePassed, buildBigChallenge } from '../engine/bigChallenge';
import { makeRng } from '../engine/rng';
import { pointsFor } from '../engine/scoring';
import { registry } from '../games/registry';
import { buzz, chime } from '../audio/speak';
import { bigBadgeFor } from '../state/progress';
import { useProgress } from '../state/ProgressContext';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { ProgressBar } from '../ui/ProgressBar';

const SECONDS = 10;

export function BigChallengeRun({ units, titles, gradeId = 'grade4', rng: rngProp }: { units: Lesson[][]; titles: string[]; gradeId?: string; rng?: () => number }) {
  const { progress, update } = useProgress();
  const navigate = useNavigate();
  const rng = useMemo(() => rngProp ?? makeRng(Date.now() & 0xffffffff), [rngProp]);
  const { rounds, final } = useMemo(() => {
    const b = buildBigChallenge(units, rng);
    const strip = (qs: Question[]) => qs.filter(q => registry[q.type]).map(q => ({ ...q, explainAr: undefined }));
    return { rounds: b.rounds.map(strip), final: strip(b.final) };
  }, [units, rng]);
  const stages = [...rounds, final];
  const total = stages.reduce((s, r) => s + r.length, 0);

  const [stage, setStage] = useState(0);
  const [intro, setIntro] = useState(true);
  const [qi, setQi] = useState(0);
  const [feedback, setFeedback] = useState<null | { attempts: number } | 'timeout'>(null);
  const [left, setLeft] = useState(SECONDS);
  const [done, setDone] = useState(false);
  const correct = useRef(0);
  const points = useRef(0);
  const isFinal = stage === stages.length - 1;
  const current = !intro && !done ? stages[stage]?.[qi] : undefined;

  useEffect(() => {
    if (!isFinal || !current || feedback) return;
    setLeft(SECONDS);
    const started = Date.now();
    const id = setInterval(() => {
      const l = SECONDS - Math.floor((Date.now() - started) / 1000);
      setLeft(Math.max(0, l));
      if (l <= 0) { clearInterval(id); buzz(progress.sound); setFeedback('timeout'); }
    }, 250);
    return () => clearInterval(id);
  }, [current?.id, feedback, isFinal]); // eslint-disable-line react-hooks/exhaustive-deps

  const answered = (r: GameResult) => {
    if (feedback) return;
    if (r.attempts === 1) correct.current++;
    points.current += pointsFor(r.attempts);
    chime(progress.sound);
    setFeedback({ attempts: r.attempts });
  };
  const finish = () => {
    const passed = bigChallengePassed(correct.current, total);
    const badge = bigBadgeFor(gradeId);
    update(p => ({ ...p, points: p.points + points.current,
      badges: passed && !p.badges.includes(badge) ? [...p.badges, badge] : p.badges }));
    setDone(true);
  };
  const next = () => {
    setFeedback(null);
    if (qi + 1 < stages[stage].length) return setQi(qi + 1);
    if (stage + 1 < stages.length) { setStage(stage + 1); setQi(0); return setIntro(true); }
    finish();
  };

  if (done) {
    const passed = bigChallengePassed(correct.current, total);
    const pct = Math.round((correct.current / Math.max(1, total)) * 100);
    return (
      <Card className="text-center">
        <p className="text-6xl" aria-hidden>{passed ? '🏆' : '💪'}</p>
        <h2 className="mt-2 text-3xl font-black text-teal-700">{passed ? 'نجحت في التحدي الكبير!' : 'قريب جداً! حاول مرة أخرى'}</h2>
        <p className="mt-2 text-xl">أجبت صحيحاً من المحاولة الأولى: {correct.current} من {total} ({pct}٪)</p>
        <p className="mt-1">تحتاج 70٪ للنجاح.</p>
        <p className="mt-1 text-2xl font-black text-amber-600">+{points.current} نقطة</p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          {passed && <Button onClick={() => navigate(`/certificate/${gradeId}`)}>🎓 شهادتي</Button>}
          <Button variant="soft" onClick={() => window.location.reload()}>أعد التحدي</Button>
        </div>
      </Card>
    );
  }

  const Game = current ? registry[current.type] : undefined;
  return (
    <div>
      <ol className="mb-3 flex flex-wrap justify-center gap-2" aria-label="جولات التحدي">
        {stages.map((_, i) => (
          <li key={i} aria-current={i === stage ? 'step' : undefined}
            className={`rounded-full px-3 py-1 font-bold ${i === stage ? 'bg-teal-600 text-white' : i < stage ? 'bg-teal-100 text-teal-800' : 'bg-white text-gray-500'}`}>
            {i < stage ? '✓ ' : ''}{i === stages.length - 1 ? 'النهائية' : `الجولة ${i + 1}`}
          </li>
        ))}
      </ol>
      {intro ? (
        <Card className="text-center">
          <p className="text-5xl" aria-hidden>{isFinal ? '⏱️' : '🎯'}</p>
          <h2 className="mt-2 text-2xl font-bold">{isFinal ? 'الجولة النهائية' : `الجولة ${stage + 1}: ${titles[stage] ?? ''}`}</h2>
          <p className="mt-2 text-lg">{stages[stage].length} أسئلة{isFinal ? ` من كل الوحدات، و${SECONDS} ثوانٍ لكل سؤال` : ''}.</p>
          <Button className="mt-4" onClick={() => setIntro(false)}>ابدأ</Button>
        </Card>
      ) : (<>
        <div className="mb-3"><ProgressBar value={qi} max={stages[stage].length} label="التقدّم في الجولة" /></div>
        {isFinal && !feedback && (
          <p className={`mb-2 text-center text-xl font-black ${left <= 3 ? 'text-rose-700' : 'text-teal-800'}`} role="timer" aria-live="off">
            ⏱️ {left}
          </p>
        )}
        {Game && current && (
          <Card>
            <div aria-hidden={!!feedback} className={feedback ? 'pointer-events-none' : ''}>
              <Game key={`${stage}-${qi}-${current.id}`} question={current} onDone={answered} />
            </div>
            {feedback && (
              <div role="status" className={`mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border-4 p-3 ${feedback === 'timeout' ? 'border-rose-500 bg-rose-50' : 'border-green-600 bg-green-50'}`}>
                <span className="text-xl font-bold">
                  {feedback === 'timeout' ? <><span aria-hidden>⏱️✗ </span>انتهى الوقت!</> : <><span aria-hidden>✓ </span>{feedback.attempts === 1 ? 'أحسنت!' : 'صحيح'}</>}
                </span>
                <Button onClick={next} autoFocus>التالي</Button>
              </div>
            )}
          </Card>
        )}
      </>)}
    </div>
  );
}

export default function BigChallenge() {
  const { gradeId = 'grade4' } = useParams();
  const { progress } = useProgress();
  const [data, setData] = useState<{ grade: GradeIndex; units: Lesson[][] } | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    loadGradeIndex(gradeId).then(async grade => {
      const groups = await loadGradeLessons(grade);
      const regular = grade.units.filter(u => u.kind === 'unit' && u.status === 'open');
      setData({ grade, units: regular.map(u => groups.find(g => g.unitId === u.id)?.lessons ?? []) });
    }).catch(() => setError(true));
  }, [gradeId]);
  const regular = data?.grade.units.filter(u => u.kind === 'unit' && u.status === 'open') ?? [];
  const unlocked = progress.teacherMode || regular.every(u => u.lessons.every(l => (progress.lessons[l.id]?.stars ?? 0) >= 1));
  return (
    <main className="mx-auto max-w-3xl p-4">
      <div className="mb-3 flex items-center justify-between">
        <Link to={`/grade/${gradeId}`} className="flex min-h-12 items-center rounded-xl px-3 font-bold text-teal-800 hover:bg-teal-50">→ رجوع</Link>
        <h1 className="text-xl font-bold">🏆 التحدي الكبير</h1>
      </div>
      {error && <Card role="alert" className="text-center text-xl">تعذّر تحميل التحدي.</Card>}
      {!data && !error && <p className="text-center text-xl">جارٍ التحميل…</p>}
      {data && !unlocked && <Card className="text-center text-xl"><span aria-hidden>🔒</span> احصل على نجمة واحدة على الأقل في كل دروس الوحدات 1–{regular.length} لفتح التحدي الكبير.</Card>}
      {data && unlocked && <BigChallengeRun units={data.units} titles={regular.map(u => u.titleAr)} gradeId={gradeId} />}
    </main>
  );
}
