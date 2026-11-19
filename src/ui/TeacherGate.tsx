import { useState } from 'react';
import { builtInHash, checkTeacherCode, type TeacherHash } from '../state/teacherCode';
import { Button } from './Button';

/** Asks for the teacher code; calls onUnlock only when it is correct. */
export function TeacherGate({ onUnlock, onCancel, config = builtInHash }: {
  onUnlock: () => void; onCancel?: () => void; config?: TeacherHash | null;
}) {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (!config) {
    return (
      <div role="alert" className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-3 font-bold text-amber-900">
        لم يُضبط كود المعلّم لهذا التطبيق بعد، لذلك لا يمكن تفعيل وضع المعلّم.
        {onCancel && <div className="mt-2"><Button variant="soft" onClick={onCancel}>حسناً</Button></div>}
      </div>
    );
  }

  const submit = async () => {
    if (!code.trim() || busy) return;
    setBusy(true);
    const r = await checkTeacherCode(code, config);
    setBusy(false);
    if (r.ok) { setCode(''); setError(''); onUnlock(); return; }
    setCode('');
    if (r.reason === 'locked') setError(`محاولات كثيرة. حاول بعد ${Math.ceil((r.waitMs ?? 0) / 60000)} دقائق.`);
    else setError(`الكود غير صحيح. بقيت ${r.triesLeft} محاولات.`);
  };

  return (
    <form className="space-y-3 rounded-2xl border-2 border-teal-200 bg-teal-50 p-4"
      onSubmit={e => { e.preventDefault(); void submit(); }}>
      <label htmlFor="teacher-code" className="block text-lg font-bold">🔒 أدخل كود المعلّم</label>
      <input id="teacher-code" type="password" inputMode="numeric" autoComplete="off" value={code}
        onChange={e => setCode(e.target.value)} dir="ltr"
        className="min-h-12 w-full rounded-2xl border-2 border-teal-300 bg-white px-4 text-center text-2xl tracking-widest" />
      {error && <p role="alert" className="font-bold text-rose-800">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={!code.trim() || busy}>{busy ? '...' : 'تفعيل'}</Button>
        {onCancel && <Button type="button" variant="soft" onClick={onCancel}>إلغاء</Button>}
      </div>
    </form>
  );
}
