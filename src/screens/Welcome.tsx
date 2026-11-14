import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProgress } from '../state/ProgressContext';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

export const AVATARS = ['🦁', '🐪', '🦅', '🐢', '🦊', '🐬', '🌴', '🚀'];

export default function Welcome() {
  const { update } = useProgress();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [error, setError] = useState('');
  const start = (mode: 'student' | 'self') => {
    const n = name.trim();
    if (!n) return setError('اكتب اسمك أولاً');
    update(p => ({ ...p, name: n.slice(0, 20), avatar, mode }));
    navigate('/grades');
  };
  return (
    <main className="mx-auto max-w-xl p-4">
      <div className="my-6 text-center">
        <p className="text-6xl" aria-hidden>👋</p>
        <h1 className="en mt-2 text-5xl font-black text-teal-700">Hello Libya</h1>
        <p className="mt-2 text-xl">تعلّم الإنجليزية بالدروس القصيرة والألعاب</p>
      </div>
      <Card>
        <label htmlFor="name" className="mb-2 block text-lg font-bold">ما اسمك؟</label>
        <input id="name" value={name} maxLength={20} autoComplete="off" required
          onChange={e => { setName(e.target.value); setError(''); }}
          className="min-h-12 w-full rounded-2xl border-2 border-teal-200 px-4 text-xl focus:border-teal-500" />
        <p className="mt-1 text-sm text-gray-500">{name.length}/20</p>
        {error && <p role="alert" className="mt-1 font-bold text-rose-700"><span aria-hidden>⚠️ </span>{error}</p>}
        <p className="mb-2 mt-4 text-lg font-bold">اختر صورتك:</p>
        <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label="الصورة">
          {AVATARS.map(a => (
            <button key={a} type="button" role="radio" aria-checked={a === avatar} aria-label={a} onClick={() => setAvatar(a)}
              className={`min-h-16 rounded-2xl border-4 text-4xl ${a === avatar ? 'border-teal-500 bg-teal-50' : 'border-transparent bg-amber-50'}`}>{a}</button>
          ))}
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Button onClick={() => start('student')}>🎒 أنا طالب</Button>
          <Button variant="soft" onClick={() => start('self')}>🧑 أتعلّم لنفسي</Button>
        </div>
      </Card>
    </main>
  );
}
