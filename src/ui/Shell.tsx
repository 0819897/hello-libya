import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { getLastGrade } from '../state/progress';
import { useProgress } from '../state/ProgressContext';

/** Page frame: header with points and streak, content, bottom tabs. */
export function Shell({ title, gradeId, children }: { title?: ReactNode; gradeId?: string; children: ReactNode }) {
  const { progress } = useProgress();
  const activeGrade = gradeId ?? getLastGrade(progress);
  const tabs = [
    { to: `/grade/${activeGrade}`, label: 'المسار', icon: '🗺️' },
    { to: '/dictionary', label: 'قاموسي', icon: '📖' },
    { to: '/profile', label: 'ملفّي', icon: '👤' },
  ];
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b-2 border-amber-100 bg-[#fdf8ef]/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-4 py-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className="text-3xl" aria-hidden>{progress.avatar || '🙂'}</span>
            <div className="min-w-0">
              <p className="truncate font-bold">{progress.name}</p>
              {title && <p className="truncate text-sm text-teal-800">{title}</p>}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3 text-lg font-bold">
            <span title="النقاط" aria-label={`النقاط ${progress.points}`}>💎 {progress.points}</span>
            <span title="أيام متتالية" aria-label={`أيام متتالية ${progress.streak.count}`}>🔥 {progress.streak.count}</span>
            <NavLink to="/settings" aria-label="الإعدادات" className="flex min-h-12 min-w-12 items-center justify-center rounded-xl hover:bg-amber-100">⚙️</NavLink>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-28 pt-4">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-10 border-t-2 border-amber-100 bg-white" aria-label="التنقّل الرئيسي">
        <ul className="mx-auto flex max-w-3xl justify-around">
          {tabs.map(t => (
            <li key={t.to}>
              <NavLink to={t.to} className={({ isActive }) =>
                `flex min-h-14 min-w-20 flex-col items-center justify-center px-3 text-sm font-bold ${isActive ? 'text-teal-700' : 'text-gray-500'}`}>
                <span className="text-2xl" aria-hidden>{t.icon}</span>{t.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
