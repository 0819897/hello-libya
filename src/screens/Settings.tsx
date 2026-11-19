import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { defaultProgress } from '../state/progress';
import { clearDuo } from '../state/quests';
import { useProgress } from '../state/ProgressContext';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Shell } from '../ui/Shell';

function Toggle({ label, on, onChange }: { label: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={() => onChange(!on)}
      className="flex min-h-14 w-full items-center justify-between rounded-2xl bg-amber-50 px-4 text-lg font-bold">
      {label}
      <span className={`flex h-8 w-14 items-center rounded-full p-1 transition ${on ? 'justify-end bg-teal-500' : 'justify-start bg-gray-300'}`}>
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs" aria-hidden>{on ? '✓' : '✗'}</span>
      </span>
    </button>
  );
}

export default function Settings() {
  const { progress, update } = useProgress();
  const navigate = useNavigate();
  const [name, setName] = useState(progress.name);
  const [saved, setSaved] = useState(false);
  const [confirm, setConfirm] = useState(false);
  return (
    <Shell title="الإعدادات">
      <h1 className="mb-4 text-2xl font-black">الإعدادات</h1>
      <Card className="mb-4 space-y-3">
        <Toggle label="🔊 الصوت" on={progress.sound} onChange={v => update(p => ({ ...p, sound: v }))} />
        <Toggle label="👩‍🏫 وضع المعلّم (يفتح كل الدروس)" on={progress.teacherMode} onChange={v => update(p => ({ ...p, teacherMode: v }))} />
        <Link to="/teacher" className="flex min-h-12 items-center rounded-2xl px-4 font-bold text-teal-800 underline">إدارة الدروس الإضافية (للمعلّم)</Link>
      </Card>
      <Card className="mb-4">
        <label htmlFor="rename" className="mb-2 block text-lg font-bold">تغيير الاسم</label>
        <div className="flex flex-wrap gap-2">
          <input id="rename" value={name} maxLength={20} onChange={e => { setName(e.target.value); setSaved(false); }}
            className="min-h-12 flex-1 rounded-2xl border-2 border-teal-200 px-4 text-xl" />
          <Button disabled={!name.trim()} onClick={() => { update(p => ({ ...p, name: name.trim().slice(0, 20) })); setSaved(true); }}>حفظ</Button>
        </div>
        {saved && <p role="status" className="mt-2 font-bold text-green-800">✓ تم الحفظ</p>}
      </Card>
      <Card className="mb-4">
        <h2 className="mb-2 text-lg font-bold">مسح التقدّم</h2>
        <p className="mb-3">يمسح الاسم والنجوم والنقاط من هذا الجهاز.</p>
        {!confirm ? <Button variant="danger" onClick={() => setConfirm(true)}>مسح التقدّم</Button> : (
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold">هل أنت متأكد؟ لا يمكن التراجع.</span>
            <Button variant="danger" onClick={() => { clearDuo(); update(() => defaultProgress()); navigate('/'); }}>نعم، امسح</Button>
            <Button variant="soft" onClick={() => setConfirm(false)}>إلغاء</Button>
          </div>
        )}
      </Card>
      <Link to="/about" className="flex min-h-12 items-center font-bold text-teal-800 underline">ℹ️ عن التطبيق</Link>
      <p className="mt-2 text-sm text-gray-500">الإصدار: <span dir="ltr">{typeof __APP_BUILD__ === 'string' ? __APP_BUILD__ : 'dev'}</span></p>
    </Shell>
  );
}
