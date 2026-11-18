import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { buzz, chime, speak } from '../audio/speak';
import { ChoiceButton } from '../games/common';
import { todayStr } from '../state/progress';
import { loadDuo, recordActivity, saveDuo } from '../state/quests';
import { useProgress } from '../state/ProgressContext';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Shell } from '../ui/Shell';

export type StoryStep =
  | { kind: 'line'; speaker: string; avatar: string; en: string; ar: string }
  | { kind: 'quiz'; promptAr: string; options: string[]; answer: string };

export type Story = {
  id: string;
  unitAr: string;
  title: string;
  titleAr: string;
  emoji: string;
  steps: StoryStep[];
};

const STORY_XP = 25;

export function StoryRun({ story, gradeId = 'grade5' }: { story: Story; gradeId?: string }) {
  const { progress, update } = useProgress();
  const [idx, setIdx] = useState(0);
  const [wrongOpts, setWrongOpts] = useState<string[]>([]);
  const [quizSolved, setQuizSolved] = useState(false);
  const [done, setDone] = useState(false);
  const [bonusGems, setBonusGems] = useState(0);

  const visible = story.steps.slice(0, idx + 1);
  const current = story.steps[idx];

  useEffect(() => {
    if (current?.kind === 'line') speak({ en: current.en }, progress.sound);
  }, [idx]); // eslint-disable-line react-hooks/exhaustive-deps

  const advance = () => {
    setWrongOpts([]);
    setQuizSolved(false);
    if (idx + 1 < story.steps.length) {
      setIdx(idx + 1);
      return;
    }
    const today = todayStr();
    const d0 = loadDuo(today);
    const storiesDone = d0.storiesDone.includes(story.id) ? d0.storiesDone : [...d0.storiesDone, story.id];
    const act = recordActivity({ ...d0, storiesDone }, { xp: STORY_XP, today });
    saveDuo(act.duo);
    const gain = STORY_XP + act.bonusGems;
    update(p => ({ ...p, points: p.points + gain }));
    setBonusGems(act.bonusGems);
    setDone(true);
  };

  const chooseQuiz = (opt: string, answer: string) => {
    if (quizSolved) return;
    if (opt === answer) {
      chime(progress.sound);
      setQuizSolved(true);
      return;
    }
    buzz(progress.sound);
    setWrongOpts(w => [...w, opt]);
  };

  if (done) {
    return (
      <Card className="text-center">
        <p className="text-6xl" aria-hidden>📖🎉</p>
        <h2 className="mt-2 text-3xl font-black text-teal-700">أكملت القصة بنجاح!</h2>
        <p className="mt-1 text-xl font-bold">{story.titleAr} · <span className="en">{story.title}</span></p>
        <p className="mt-2 text-2xl font-black text-amber-600">+{STORY_XP + bonusGems} 💎</p>
        {bonusGems > 0 && <p className="mt-1 font-bold text-green-800">🎁 يشمل +{bonusGems} جواهر من المهام اليومية!</p>}
        <div className="mt-5 flex justify-center">
          <Link to={`/stories/${gradeId}`} className="flex min-h-12 items-center rounded-2xl bg-teal-600 px-6 text-lg font-bold text-white">
            العودة إلى القصص
          </Link>
        </div>
      </Card>
    );
  }

  const canAdvance = current.kind === 'line' || quizSolved;
  const isLast = idx + 1 === story.steps.length;

  return (
    <div className="space-y-3">
      {visible.map((st, i) => (
        st.kind === 'line' ? (
          <Card key={i} className="flex items-start gap-3">
            <span className="text-4xl" aria-hidden>{st.avatar}</span>
            <div className="flex-1">
              <p className="text-sm font-bold text-teal-800">{st.speaker}</p>
              <button type="button" onClick={() => speak({ en: st.en }, progress.sound)}
                className="en mt-1 text-start text-xl font-bold text-gray-900 hover:text-teal-700">
                {st.en} <span aria-hidden className="text-sm">🔊</span>
              </button>
              <p className="mt-1 text-gray-600">{st.ar}</p>
            </div>
          </Card>
        ) : (
          <Card key={i} className="border-amber-300 bg-amber-50/70">
            <p className="mb-3 text-lg font-black text-amber-900">🤔 سؤال الفهم: {st.promptAr}</p>
            <div className="grid gap-2">
              {st.options.map(opt => {
                const activeStep = i === idx;
                const state = !activeStep || (quizSolved && opt === st.answer)
                  ? (opt === st.answer ? 'reveal' : 'idle')
                  : wrongOpts.includes(opt) ? 'wrong' : 'idle';
                return (
                  <ChoiceButton key={opt} label={opt} state={state}
                    onClick={() => activeStep && chooseQuiz(opt, st.answer)}>
                    <span>{opt}</span>
                  </ChoiceButton>
                );
              })}
            </div>
          </Card>
        )
      ))}
      {canAdvance && (
        <div className="flex justify-center pt-2">
          <Button onClick={advance}>{isLast ? 'أنهِ القصة' : 'تابع'}</Button>
        </div>
      )}
    </div>
  );
}

export default function Stories() {
  const { gradeId = 'grade5', storyId } = useParams();
  const [stories, setStories] = useState<Story[] | null>(null);
  const [error, setError] = useState(false);
  const doneIds = loadDuo().storiesDone;

  useEffect(() => {
    fetch(`./content/${gradeId}/stories.json`)
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then(setStories, () => setError(true));
  }, [gradeId]);

  if (storyId) {
    const active = stories?.find(s => s.id === storyId);
    return (
      <main className="mx-auto max-w-3xl p-4">
        <div className="mb-3 flex items-center justify-between">
          <Link to={`/stories/${gradeId}`} className="flex min-h-12 items-center rounded-xl px-3 font-bold text-teal-800 hover:bg-teal-50">→ القصص</Link>
          {active && <h1 className="text-xl font-bold">{active.emoji} {active.titleAr}</h1>}
        </div>
        {error && <Card role="alert" className="text-center text-xl">تعذّر تحميل القصة.</Card>}
        {!stories && !error && <p className="text-center text-xl">جارٍ التحميل…</p>}
        {active && <StoryRun key={active.id} story={active} gradeId={gradeId} />}
      </main>
    );
  }

  return (
    <Shell title="قصص المغامرة" gradeId={gradeId}>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-black">📖 قصص الصف الخامس الحوارية</h1>
        <Link to={`/grade/${gradeId}`} className="flex min-h-12 items-center rounded-xl px-3 font-bold text-teal-800 hover:bg-amber-100">→ المسار</Link>
      </div>
      <p className="mb-4 text-gray-700">اقرأ واستمع إلى محادثات قصيرة من وحدات الصف الخامس الأربع، وأجب عن أسئلة الفهم لتربح +25 💎 لكل قصة.</p>
      {error && <p role="alert">تعذّر تحميل القصص.</p>}
      {!stories && !error && <p>جارٍ التحميل…</p>}
      <ul className="grid gap-3 sm:grid-cols-2">
        {stories?.map(s => {
          const isDone = doneIds.includes(s.id);
          return (
            <li key={s.id}>
              <Link to={`/story/${gradeId}/${s.id}`}
                className="flex min-h-28 items-center gap-3 rounded-3xl border-b-8 border-teal-800 bg-white p-4 shadow-sm hover:scale-[1.01] transition">
                <span className="text-5xl" aria-hidden>{s.emoji}</span>
                <div className="flex-1">
                  <span className="text-xs font-bold text-teal-700">{s.unitAr}</span>
                  <p className="text-xl font-black">{s.titleAr}</p>
                  <p className="en text-sm text-gray-600">{s.title}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-sm font-bold ${isDone ? 'bg-amber-100 text-amber-800' : 'bg-teal-50 text-teal-800'}`}>
                  {isDone ? '✓ مكتملة' : '+25 💎'}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </Shell>
  );
}
