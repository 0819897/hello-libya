import { useState } from 'react';
import { Link } from 'react-router-dom';
import { chime } from '../audio/speak';
import {
  buyAvatar,
  buyFreeze,
  FREEZE_COST,
  loadDuo,
  MAX_FREEZES,
  saveDuo,
  SHOP_AVATARS,
} from '../state/quests';
import { useProgress } from '../state/ProgressContext';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Shell } from '../ui/Shell';

export default function Shop() {
  const { progress, update } = useProgress();
  const [duo, setDuo] = useState(() => loadDuo());
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const onBuyFreeze = () => {
    const r = buyFreeze(progress, duo);
    if (!r.ok) {
      setMsg({ ok: false, text: r.errorAr ?? '' });
      return;
    }
    saveDuo(r.duo);
    setDuo(r.duo);
    update(() => r.progress);
    chime(progress.sound);
    setMsg({ ok: true, text: 'تم شراء تجميد السلسلة بنجاح! 🧊' });
  };

  const onAvatar = (emoji: string) => {
    const r = buyAvatar(progress, duo, emoji);
    if (!r.ok) {
      setMsg({ ok: false, text: r.errorAr ?? '' });
      return;
    }
    saveDuo(r.duo);
    setDuo(r.duo);
    update(() => r.progress);
    chime(progress.sound);
    setMsg({ ok: true, text: `تم اختيار الشخصية ${emoji}` });
  };

  return (
    <Shell title="متجر الجواهر" gradeId="grade5">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-black">🛒 متجر الجواهر</h1>
        <Link to="/grade/grade5" className="flex min-h-12 items-center rounded-xl px-3 font-bold text-teal-800 hover:bg-amber-100">→ المسار</Link>
      </div>
      {msg && (
        <p role={msg.ok ? 'status' : 'alert'}
          className={`mb-4 rounded-2xl border-2 p-3 font-bold ${msg.ok ? 'border-green-500 bg-green-50 text-green-900' : 'border-rose-400 bg-rose-50 text-rose-900'}`}>
          {msg.text}
        </p>
      )}
      <Card className="mb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black">🧊 تجميد السلسلة (Streak Freeze)</h2>
            <p className="mt-1 text-gray-700">يحمي سلسلتك اليومية 🔥 تلقائياً إذا غبت يوماً واحداً عن التدريب.</p>
            <p className="mt-1 font-bold text-teal-800">لديك الآن: {duo.freezes} من {MAX_FREEZES}</p>
          </div>
          <Button disabled={duo.freezes >= MAX_FREEZES || progress.points < FREEZE_COST}
            onClick={onBuyFreeze} aria-label="اشترِ تجميد السلسلة">
            اشترِ ({FREEZE_COST} 💎)
          </Button>
        </div>
      </Card>
      <Card>
        <h2 className="mb-3 text-xl font-black">🦉 شخصيات الأبطال الخاصة</h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {SHOP_AVATARS.map(a => {
            const owned = duo.unlockedAvatars.includes(a.emoji);
            const active = progress.avatar === a.emoji;
            return (
              <li key={a.emoji} className="flex items-center justify-between gap-2 rounded-2xl bg-amber-50 p-3">
                <div className="flex items-center gap-3">
                  <span className="text-4xl" aria-hidden>{a.emoji}</span>
                  <div>
                    <p className="font-bold">{a.titleAr}</p>
                    <p className="text-sm text-gray-600">{owned ? 'مفتوحة ✓' : `${a.cost} 💎`}</p>
                  </div>
                </div>
                <Button variant={active ? 'soft' : 'primary'}
                  disabled={!owned && progress.points < a.cost}
                  onClick={() => onAvatar(a.emoji)}>
                  {active ? 'مُختارة ✓' : owned ? 'اختر' : `افتح (${a.cost} 💎)`}
                </Button>
              </li>
            );
          })}
        </ul>
      </Card>
    </Shell>
  );
}
