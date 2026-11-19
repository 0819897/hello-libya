import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { Word } from '../types';
import { loadGradeIndex, loadGradeLessons } from '../content/loader';
import { makeRng, shuffle } from '../engine/rng';
import { buzz, chime, speak } from '../audio/speak';
import { todayStr } from '../state/progress';
import { loadDuo, recordActivity, saveDuo } from '../state/quests';
import { useProgress } from '../state/ProgressContext';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { ChoiceButton } from '../games/common';
import { Pic } from '../ui/WordChip';

function nextDeal(pool: Word[], rng: () => number, prevEn?: string): { target: Word; options: Word[] } {
  const candidates = pool.length > 1 ? pool.filter(w => w.en !== prevEn) : pool;
  const target = candidates[Math.floor(rng() * candidates.length)] ?? pool[0];
  const others = shuffle(pool.filter(w => w.en !== target.en && w.ar !== target.ar), rng).slice(0, 3);
  return { target, options: shuffle([target, ...others], rng) };
}

export function SpeedRun({ words, seconds = 60, rng: rngProp }: { words: Word[]; seconds?: number; rng?: () => number }) {
  const { progress, update } = useProgress();
  const rng = useMemo(() => rngProp ?? makeRng(Date.now() & 0xffffffff), [rngProp]);
  const [phase, setPhase] = useState<'intro' | 'run' | 'done'>('intro');
  const [left, setLeft] = useState(seconds);
  const [deal, setDeal] = useState(() => nextDeal(words, rng));
  const [wrongAr, setWrongAr] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [xp, setXp] = useState(0);
  const [summary, setSummary] = useState<{ best: number; isNewBest: boolean; bonusGems: number }>({ best: 0, isNewBest: false, bonusGems: 0 });

  const scoreRef = useRef(0);
  const xpRef = useRef(0);
  const maxComboRef = useRef(0);
  const finishedRef = useRef(false);

  const finish = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    const today = todayStr();
    const d0 = loadDuo(today);
    const isNewBest = scoreRef.current > d0.bestSpeedScore;
    const best = Math.max(d0.bestSpeedScore, scoreRef.current);
    const act = recordActivity({ ...d0, bestSpeedScore: best }, { xp: xpRef.current, maxCombo: maxComboRef.current, today });
    saveDuo(act.duo);
    const totalGain = xpRef.current + act.bonusGems;
    if (totalGain > 0) update(p => ({ ...p, points: p.points + totalGain }));
    setSummary({ best, isNewBest, bonusGems: act.bonusGems });
    setPhase('done');
  };

  useEffect(() => {
    if (phase !== 'run') return;
    setLeft(seconds);
    const started = Date.now();
    const id = setInterval(() => {
      const rem = Math.max(0, seconds - Math.floor((Date.now() - started) / 1000));
      setLeft(rem);
      if (rem <= 0) { clearInterval(id); finish(); }
    }, 250);
    return () => clearInterval(id);
  }, [phase, seconds]); // eslint-disable-line react-hooks/exhaustive-deps

  const start = () => {
    scoreRef.current = 0; xpRef.current = 0; maxComboRef.current = 0; finishedRef.current = false;
    setScore(0); setCombo(0); setXp(0); setWrongAr([]);
    const first = nextDeal(words, rng);
    setDeal(first);
    setPhase('run');
    speak(first.target, progress.sound);
  };

  const pick = (w: Word) => {
    if (w.en === deal.target.en) {
      const nextCombo = wrongAr.length === 0 ? combo + 1 : 1;
      const gain = nextCombo >= 3 ? 10 : 5;
      scoreRef.current += 1;
      xpRef.current += gain;
      if (nextCombo > maxComboRef.current) maxComboRef.current = nextCombo;
      setScore(scoreRef.current);
      setXp(xpRef.current);
      setCombo(nextCombo);
      setWrongAr([]);
      chime(progress.sound);
      speak(w, progress.sound);
      setDeal(nextDeal(words, rng, w.en));
      return;
    }
    setCombo(0);
    setWrongAr(prev => [...prev, w.ar]);
    buzz(progress.sound);
  };

  if (phase === 'intro') {
    const best = loadDuo().bestSpeedScore;
    return (
      <Card className="text-center">
        <p className="text-6xl" aria-hidden>⚡</p>
        <h2 className="mt-2 text-3xl font-black text-teal-700">تحدّي البرق ({seconds} ثانية)</h2>
        <p className="mt-2 text-lg">طابق أكبر عدد من مفردات الصف الخامس قبل انتهاء الوقت!</p>
        <p className="mt-1 font-bold text-amber-700">🔥 3 إجابات متتالية تمنحك نقاطاً مضاعفة (+10 💎)</p>
        {best > 0 && <p className="mt-2 font-bold text-teal-800">🏆 رقمك القياسي: {best} كلمة</p>}
        <Button className="mt-5" onClick={start}>⚡ ابدأ السباق</Button>
      </Card>
    );
  }

  if (phase === 'done') {
    return (
      <Card className="text-center">
        <p className="text-6xl" aria-hidden>{summary.isNewBest ? '🏆' : '⚡'}</p>
        <h2 className="mt-2 text-3xl font-black text-teal-700">انتهى الوقت!</h2>
        <p className="mt-2 text-2xl font-bold">طابقت بنجاح: {score} كلمة</p>
        {summary.isNewBest && score > 0 && <p className="mt-1 text-lg font-black text-amber-600">🎉 رقم قياسي شخصي جديد!</p>}
        <p className="mt-2 text-2xl font-black text-amber-600">+{xp + summary.bonusGems} 💎</p>
        {summary.bonusGems > 0 && <p className="mt-1 text-sm font-bold text-green-800">🎁 يشمل +{summary.bonusGems} جواهر مكافأة مهمة يومية!</p>}
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Button onClick={start}>⚡ العب مجدداً</Button>
        </div>
      </Card>
    );
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-white px-4 py-2 font-black shadow-sm">
        <span className={left <= 10 ? 'text-xl text-rose-700' : 'text-xl text-teal-800'} role="timer" aria-live="off">⏱️ {left}ث</span>
        <span className="text-lg">✅ {score}</span>
        <span className="text-amber-700">💎 +{xp}</span>
        {combo >= 3 && <span className="rounded-full bg-amber-100 px-3 py-0.5 text-sm text-amber-800">🔥 نقاط مضاعفة x2</span>}
      </div>
      <Card>
        <p className="mb-2 text-center text-gray-600">اختر المعنى الصحيح بأسرع ما يمكن:</p>
        <div className="my-3 flex flex-col items-center justify-center gap-1">
          {deal.target.emoji && <Pic emoji={deal.target.emoji} text="" className="text-6xl" />}
          <button type="button" onClick={() => speak(deal.target, progress.sound)}
            className="en min-h-12 rounded-xl px-3 text-4xl font-black text-teal-800 hover:bg-amber-50">
            <span data-testid="speed-word">{deal.target.en}</span> <span aria-hidden className="text-lg">🔊</span>
          </button>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {deal.options.map(o => (
            <ChoiceButton key={o.en} label={o.ar} onClick={() => pick(o)}
              state={wrongAr.includes(o.ar) ? 'wrong' : wrongAr.length > 0 && o.en === deal.target.en ? 'reveal' : 'idle'}>
              <span>{o.ar}</span>
            </ChoiceButton>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default function SpeedChallenge() {
  const { gradeId = 'grade5' } = useParams();
  const { progress } = useProgress();
  const [words, setWords] = useState<Word[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    loadGradeIndex(gradeId).then(async g => {
      const all = (await loadGradeLessons(g)).flatMap(u => u.lessons).flatMap(l => l.words);
      const unique = [...new Map(all.map(w => [w.en, w])).values()];
      const learned = unique.filter(w => progress.learned.includes(w.en));
      setWords(learned.length >= 8 ? learned : unique);
    }).catch(() => setError(true));
  }, [gradeId, progress.learned]);

  return (
    <main className="mx-auto max-w-3xl p-4">
      <div className="mb-3 flex items-center justify-between">
        <Link to={`/grade/${gradeId}`} className="flex min-h-12 items-center rounded-xl px-3 font-bold text-teal-800 hover:bg-teal-50">→ رجوع</Link>
        <h1 className="text-xl font-bold">⚡ تحدّي البرق</h1>
      </div>
      {error && <Card role="alert" className="text-center text-xl">تعذّر تحميل المفردات.</Card>}
      {!words && !error && <p className="text-center text-xl">جارٍ التحميل…</p>}
      {words && words.length >= 4 && <SpeedRun words={words} />}
    </main>
  );
}
