import { useState } from 'react';
import { Link } from 'react-router-dom';
import { leagueTable, loadDuo, saveDuo, switchOrAddLearner } from '../state/quests';
import { useProgress } from '../state/ProgressContext';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Shell } from '../ui/Shell';

const AVATARS = ['🦁', '🐪', '🦅', '🐬', '🦉', '🚀', '👧', '👦'];

export default function League() {
  const { progress, update } = useProgress();
  const [duo, setDuo] = useState(() => loadDuo());
  const [newName, setNewName] = useState('');
  const [avatar, setAvatar] = useState('🦉');

  const table = leagueTable(progress, duo);

  const onSwitch = (id: string) => {
    const res = switchOrAddLearner(progress, duo, { id });
    saveDuo(res.duo);
    setDuo(res.duo);
    update(() => res.progress);
  };

  const onAdd = () => {
    if (!newName.trim()) return;
    const res = switchOrAddLearner(progress, duo, { newName, avatar, mode: progress.mode });
    saveDuo(res.duo);
    setDuo(res.duo);
    update(() => res.progress);
    setNewName('');
  };

  return (
    <Shell title="دوري المتصدرين" gradeId="grade5">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-black">{table.tierIcon} {table.tierAr}</h1>
        <Link to="/grade/grade5" className="flex min-h-12 items-center rounded-xl px-3 font-bold text-teal-800 hover:bg-amber-100">→ المسار</Link>
      </div>
      <Card className="mb-4">
        <p className="mb-3 text-gray-700">
          اجمع نقاط الخبرة هذا الأسبوع لتتصدر القائمة! (100 نقطة للدوري الفضي 🥈، و250 نقطة للدوري الذهبي 🥇)
        </p>
        <ol className="space-y-2">
          {table.rows.map((r, i) => (
            <li key={`${r.learnerId ?? r.name}-${i}`}
              className={`flex items-center justify-between gap-2 rounded-2xl p-3 font-bold ${r.isMe ? 'border-2 border-teal-600 bg-teal-50 text-teal-950' : r.isPast ? 'border-2 border-dashed border-amber-300 bg-white text-gray-600' : 'bg-amber-50/70'}`}>
              <div className="flex min-w-0 items-center gap-3">
                <span className="w-7 text-center text-lg font-black">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}</span>
                <span className="text-3xl" aria-hidden>{r.avatar}</span>
                <span className="min-w-0 break-words">{r.name} {r.isMe && <span className="text-xs text-teal-700">(الحالي)</span>}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-black text-amber-700">{r.xp} XP</span>
                {!r.isMe && r.learnerId && (
                  <Button variant="soft" onClick={() => onSwitch(r.learnerId!)}>بدّل إليه</Button>
                )}
              </div>
            </li>
          ))}
        </ol>
        {table.alone && (
          <p className="mt-3 rounded-2xl bg-amber-50 p-3 text-sm text-gray-700">
            {duo.lastWeekXp > 0
              ? 'تنافس الآن مع نفسك في الأسبوع الماضي 🕰️ — حاول أن تتفوّق عليها! '
              : 'هذا الدوري يضمّ المتعلّمين الحقيقيين على هذا الجهاز فقط. '}
            أضف أخاً أو صديقاً بالأسفل لتتنافسا معاً.
          </p>
        )}
      </Card>
      <Card>
        <h2 className="mb-2 text-lg font-black">👥 أضف طالباً آخر على هذا الجهاز للمنافسة</h2>
        <p className="mb-3 text-sm text-gray-600">يمكن لأكثر من طالب أو أخ اللعب على نفس الجهاز والتنافس في الدوري الأسبوعي مع حفظ تقدّم كل طالب على حدة.</p>
        <div className="mb-3 flex flex-wrap gap-2">
          {AVATARS.map(a => (
            <button key={a} type="button" onClick={() => setAvatar(a)} aria-label={`رمز ${a}`}
              className={`flex h-12 w-12 items-center justify-center rounded-2xl border-2 text-2xl ${avatar === a ? 'border-teal-600 bg-teal-50' : 'border-amber-200 bg-white'}`}>
              {a}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <input value={newName} aria-label="اسم المتعلّم الجديد" maxLength={20} onChange={e => setNewName(e.target.value)}
            placeholder="اسم المتعلّم الجديد"
            className="min-h-12 min-w-0 flex-1 basis-40 rounded-2xl border-2 border-teal-200 px-4 text-lg" />
          <Button disabled={!newName.trim()} onClick={onAdd}>أضف وابدأ</Button>
        </div>
      </Card>
    </Shell>
  );
}
