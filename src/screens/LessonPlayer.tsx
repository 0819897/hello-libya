import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { GameResult, Lesson, Question, Word } from '../types';
import { buildChallenge, buildQuestions } from '../engine/questions';
import { makeRng } from '../engine/rng';
import { pointsFor, starsFor } from '../engine/scoring';
import { registry } from '../games/registry';
import { chime, speak } from '../audio/speak';
import { completeLesson, orderedLessonIds, todayStr } from '../state/progress';
import { useProgress } from '../state/ProgressContext';
import { loadGradeIndex, loadLesson } from '../content/loader';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { ProgressBar } from '../ui/ProgressBar';
import { Pic, WordChip } from '../ui/WordChip';
import Result from './Result';

type Phase = 'learn' | 'play' | 'challenge-intro' | 'challenge' | 'result';
const playable = (qs: Question[]) => qs.filter(q => registry[q.type]);

const findWord = (lesson: Lesson, q: Question): Word | undefined => {
  const key = (q.wordEn ?? (typeof q.answer === 'string' ? q.answer : '')).toLowerCase();
  return lesson.words.find(w => w.en.toLowerCase() === key);
};

export function LessonRun({ lesson, rng: rngProp, onFinish, onNext }: {
  lesson: Lesson; rng?: () => number; onFinish?: (p: { lessonId: string; correct: number; total: number }) => void; onNext?: () => void;
}) {
  const { progress, update } = useProgress();
  const rng = useMemo(() => rngProp ?? makeRng(Date.now() & 0xffffffff), [rngProp]);
  const rounds = useMemo(() => lesson.games.map(g => playable(buildQuestions(lesson, g, rng))).filter(r => r.length > 0), [lesson, rng]);
  const challenge = useMemo(() => playable(buildChallenge(lesson, rng)).map(q => ({ ...q, explainAr: undefined })), [lesson, rng]);
  const cards = lesson.words.length + (lesson.grammar ? 1 : 0);

  const [phase, setPhase] = useState<Phase>('learn');
  const [card, setCard] = useState(0);
  const [round, setRound] = useState(0);
  const [queue, setQueue] = useState<Question[]>(rounds[0] ?? []);
  const [qi, setQi] = useState(0);
  const [feedback, setFeedback] = useState<GameResult | null>(null);
  const points = useRef(0);
  const firstRight = useRef(0);
  const missed = useRef<string[]>([]);
  const saved = useRef(false);

  const startPlay = () => {
    if (rounds.length === 0) return setPhase('challenge-intro');
    setRound(0); setQueue(rounds[0]); setQi(0); setPhase('play');
  };
  const current = phase === 'play' ? queue[qi] : phase === 'challenge' ? challenge[qi] : undefined;

  const answered = (r: GameResult) => {
    if (!current) return;
    points.current += pointsFor(r.attempts);
    if (phase === 'play' && r.attempts > 1 && !current.id.endsWith(':again')) setQueue(q => [...q, { ...current, id: current.id + ':again' }]);
    if (phase === 'challenge') {
      if (r.attempts === 1) firstRight.current++;
      else { const w = findWord(lesson, current); if (w) missed.current.push(w.en); }
    }
    chime(progress.sound);
    const w = findWord(lesson, current);
    if (w) speak(w, progress.sound);
    setFeedback(r);
  };

  const finish = () => {
    const total = challenge.length;
    if (!saved.current) {
      saved.current = true;
      const miss = [...new Set(missed.current)];
      update(p => completeLesson(p, { lessonId: lesson.id, correct: firstRight.current, total, points: points.current,
        learned: lesson.words.map(w => w.en).filter(en => !miss.includes(en)), missed: miss, today: todayStr() }));
      onFinish?.({ lessonId: lesson.id, correct: firstRight.current, total });
    }
    setPhase('result');
  };

  const next = () => {
    setFeedback(null);
    if (phase === 'play') {
      if (qi + 1 < queue.length) return setQi(qi + 1);
      if (round + 1 < rounds.length) { setRound(round + 1); setQueue(rounds[round + 1]); return setQi(0); }
      return setPhase('challenge-intro');
    }
    if (qi + 1 < challenge.length) return setQi(qi + 1);
    finish();
  };

  const phaseIdx = { learn: 0, play: 1, 'challenge-intro': 2, challenge: 2, result: 3 }[phase];
  const [barValue, barMax] = phase === 'learn' ? [card, cards] : phase === 'play' ? [qi, queue.length]
    : phase === 'challenge' ? [qi, challenge.length] : [1, 1];

  if (phase === 'result') {
    const miss = [...new Set(missed.current)];
    return <Result stars={starsFor(firstRight.current, challenge.length)} points={points.current} correct={firstRight.current}
      total={challenge.length} missed={lesson.words.filter(w => miss.includes(w.en))} onNext={onNext}
      onRetry={() => { saved.current = false; points.current = 0; firstRight.current = 0; missed.current = []; setCard(0); setQi(0); setPhase('learn'); }} />;
  }

  const Game = current ? registry[current.type] : undefined;
  return (
    <div>
      <ol className="mb-3 flex justify-center gap-2" aria-label="مراحل الدرس">
        {['تعلّم', 'العب', 'تحدَّ'].map((t, i) => (
          <li key={t} aria-current={i === phaseIdx ? 'step' : undefined}
            className={`rounded-full px-4 py-1 font-bold ${i === phaseIdx ? 'bg-teal-600 text-white' : i < phaseIdx ? 'bg-teal-100 text-teal-800' : 'bg-white text-gray-500'}`}>
            {i < phaseIdx ? '✓ ' : ''}{t}
          </li>
        ))}
      </ol>
      <div className="mb-4"><ProgressBar value={barValue} max={barMax} label="التقدّم في المرحلة" /></div>

      {phase === 'learn' && (
        <Card className="text-center">
          {card < lesson.words.length ? (() => {
            const w = lesson.words[card];
            return (<>
              <div className="my-2 min-h-24"><Pic emoji={w.emoji} image={w.image} text="" className="text-8xl" /></div>
              <div className="text-4xl font-black"><WordChip en={w.en} audio={w.audio} /></div>
              <p className="mt-2 text-2xl">{w.ar}</p>
            </>);
          })() : (<>
            <h2 className="mb-2 text-2xl font-bold">قاعدة الدرس</h2>
            <p className="whitespace-pre-line text-lg leading-relaxed" dir="auto">{lesson.grammar?.explainAr}</p>
            <ul className="mt-3 space-y-1">{lesson.grammar?.examples.map(e => <li key={e} className="text-2xl"><WordChip en={e} /></li>)}</ul>
          </>)}
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            {card > 0 && <Button variant="soft" onClick={() => setCard(card - 1)}>السابق</Button>}
            {card + 1 < cards ? <Button onClick={() => setCard(card + 1)}>الكلمة التالية</Button> : <Button onClick={startPlay}>هيا نلعب!</Button>}
            {card + 1 < cards && <Button variant="ghost" onClick={startPlay}>تخطَّ إلى اللعب</Button>}
          </div>
        </Card>
      )}

      {phase === 'challenge-intro' && (
        <Card className="text-center">
          <p className="text-5xl" aria-hidden>🏆</p>
          <h2 className="mt-2 text-2xl font-bold">وقت التحدّي!</h2>
          <p className="mt-2 text-lg">{challenge.length} أسئلة بدون مساعدة. نجومك تأتي من هنا.</p>
          <Button className="mt-4" onClick={() => { setQi(0); setPhase(challenge.length ? 'challenge' : 'result'); if (!challenge.length) finish(); }}>ابدأ التحدّي</Button>
        </Card>
      )}

      {Game && current && (
        <Card>
          <div aria-hidden={!!feedback} className={feedback ? 'pointer-events-none' : ''}>
            <Game key={current.id} question={current} onDone={answered} />
          </div>
          {feedback && (
            <div role="status" className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border-4 border-green-600 bg-green-50 p-3">
              <span className="text-xl font-bold text-green-800"><span aria-hidden>✓ </span>
                {feedback.attempts === 1 ? 'أحسنت! إجابة صحيحة' : 'صحيح! سنعيد هذا السؤال لاحقاً للتثبيت'}
                {current.wordEn && <span className="en mx-2">{current.wordEn}</span>}
              </span>
              <Button onClick={next} autoFocus>التالي</Button>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

export default function LessonPlayer() {
  const { gradeId = '', lessonId = '' } = useParams();
  const { progress } = useProgress();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [nextId, setNextId] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let live = true;
    setLesson(null); setError('');
    const imported = progress.imported.find(l => l.id === lessonId);
    if (imported) { setLesson(imported); setNextId(null); return; }
    loadGradeIndex(gradeId).then(async g => {
      const ref = g.units.flatMap(u => u.lessons).find(l => l.id === lessonId);
      if (!ref) throw new Error();
      const ids = orderedLessonIds(g);
      const l = await loadLesson(ref, gradeId);
      if (live) { setLesson(l); setNextId(ids[ids.indexOf(lessonId) + 1] ?? null); }
    }).catch(() => live && setError('تعذّر فتح هذا الدرس'));
    return () => { live = false; };
  }, [gradeId, lessonId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <main className="mx-auto max-w-3xl p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <Link to={`/grade/${gradeId}`} className="flex min-h-12 items-center rounded-xl px-3 font-bold text-teal-800 hover:bg-teal-50">→ رجوع</Link>
        {lesson && <h1 className="text-xl font-bold">{lesson.titleAr} · <span className="en">{lesson.title}</span></h1>}
      </div>
      {error && <Card role="alert" className="text-center text-xl">{error} <Link className="block underline" to="/">العودة للرئيسية</Link></Card>}
      {!lesson && !error && <p className="text-center text-xl">جارٍ التحميل…</p>}
      {lesson && <LessonRun key={lesson.id} lesson={lesson}
        onNext={nextId ? () => navigate(`/lesson/${gradeId}/${nextId}`) : undefined} />}
    </main>
  );
}
