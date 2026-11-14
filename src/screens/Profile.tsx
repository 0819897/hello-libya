import { Link } from 'react-router-dom';
import { BADGES } from '../state/progress';
import { useProgress } from '../state/ProgressContext';
import { Card } from '../ui/Card';
import { Shell } from '../ui/Shell';

export default function Profile() {
  const { progress: p } = useProgress();
  const done = Object.values(p.lessons).filter(l => l.stars > 0).length;
  const stars = Object.values(p.lessons).reduce((s, l) => s + l.stars, 0);
  const stats = [['💎', 'النقاط', p.points], ['🔥', 'أيام متتالية', p.streak.count], ['✅', 'دروس منجزة', done],
    ['⭐', 'النجوم', stars], ['📚', 'كلمات تعلّمتها', p.learned.length]] as const;
  return (
    <Shell title="ملفّي">
      <Card className="mb-4 text-center">
        <p className="text-7xl" aria-hidden>{p.avatar}</p>
        <h1 className="mt-2 text-3xl font-black">{p.name}</h1>
        <p className="text-gray-600">{p.mode === 'self' ? 'أتعلّم لنفسي' : 'طالب'}</p>
      </Card>
      <ul className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {stats.map(([icon, label, v]) => (
          <li key={label} className="rounded-2xl bg-white p-3 text-center shadow-sm">
            <span className="text-3xl" aria-hidden>{icon}</span>
            <p className="text-2xl font-black">{v}</p><p className="text-sm">{label}</p>
          </li>
        ))}
      </ul>
      <h2 className="mb-2 text-xl font-bold">الأوسمة</h2>
      <ul className="mb-6 grid grid-cols-3 gap-3">
        {BADGES.map(b => {
          const has = p.badges.includes(b.id);
          return (
            <li key={b.id} className={`rounded-2xl p-3 text-center ${has ? 'bg-amber-100' : 'bg-gray-100 text-gray-500'}`}>
              <span className={`text-4xl ${has ? '' : 'opacity-30 grayscale'}`} aria-hidden>{b.emoji}</span>
              <p className="text-sm font-bold">{b.titleAr}</p>
              <p className="text-xs">{has ? '✓ حصلت عليه' : '🔒 لم يُفتح بعد'}</p>
            </li>
          );
        })}
      </ul>
      <div className="flex flex-wrap gap-3">
        <Link to="/settings" className="flex min-h-12 items-center rounded-2xl bg-white px-4 font-bold shadow-sm">⚙️ الإعدادات</Link>
        <Link to="/about" className="flex min-h-12 items-center rounded-2xl bg-white px-4 font-bold shadow-sm">ℹ️ عن التطبيق</Link>
      </div>
    </Shell>
  );
}
