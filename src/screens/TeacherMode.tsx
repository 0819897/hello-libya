import { useState } from 'react';
import type { Progress } from '../types';
import { validateLesson } from '../content/loader';
import { useProgress } from '../state/ProgressContext';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Shell } from '../ui/Shell';

/** Parse and validate a lesson file; on success the lesson is added (or replaces one with the same id). */
export function importLessonText(p: Progress, text: string): { ok: true; progress: Progress; title: string } | { ok: false; errorAr: string } {
  let data: unknown;
  try { data = JSON.parse(text); } catch { return { ok: false, errorAr: 'الملف ليس بصيغة JSON صحيحة' }; }
  const r = validateLesson(data);
  if (!r.ok) return r;
  return { ok: true, title: r.lesson.title,
    progress: { ...p, imported: [...p.imported.filter(l => l.id !== r.lesson.id), r.lesson] } };
}

export default function TeacherMode() {
  const { progress, update } = useProgress();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    let text = '';
    try { text = await f.text(); } catch { return setMsg({ ok: false, text: 'تعذّرت قراءة الملف' }); }
    const r = importLessonText(progress, text);
    if (!r.ok) return setMsg({ ok: false, text: r.errorAr });
    update(p => { const again = importLessonText(p, text); return again.ok ? again.progress : p; });
    setMsg({ ok: true, text: `تمت إضافة الدرس: ${r.title}` });
  };

  return (
    <Shell title="وضع المعلّم">
      <h1 className="mb-4 text-2xl font-black">👩‍🏫 وضع المعلّم</h1>
      <Card className="mb-4">
        <button type="button" role="switch" aria-checked={progress.teacherMode}
          onClick={() => update(p => ({ ...p, teacherMode: !p.teacherMode }))}
          className="flex min-h-14 w-full items-center justify-between rounded-2xl bg-amber-50 px-4 text-lg font-bold">
          افتح كل الدروس
          <span className={`flex h-8 w-14 items-center rounded-full p-1 ${progress.teacherMode ? 'justify-end bg-teal-500' : 'justify-start bg-gray-300'}`}>
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs" aria-hidden>{progress.teacherMode ? '✓' : '✗'}</span>
          </span>
        </button>
      </Card>
      <Card className="mb-4">
        <h2 className="mb-2 text-lg font-bold">إضافة درس جديد</h2>
        <p className="mb-3">اختر ملف درس بصيغة JSON. يظهر الدرس في المسار تحت "دروس إضافية".</p>
        <label className="inline-flex min-h-12 cursor-pointer items-center rounded-2xl bg-teal-600 px-5 text-lg font-bold text-white focus-within:outline focus-within:outline-4 focus-within:outline-amber-400">
          📂 اختر ملف درس
          <input type="file" accept=".json,application/json" className="sr-only"
            onChange={e => { onFile(e.target.files?.[0]); e.target.value = ''; }} />
        </label>
        <a href="./content/sample-new-lesson.json" download="sample-new-lesson.json"
          className="mt-3 flex min-h-12 items-center font-bold text-teal-800 underline">⬇️ نزّل ملف درس نموذجي (الألوان)</a>
        {msg && (
          <p role={msg.ok ? 'status' : 'alert'}
            className={`mt-3 rounded-2xl border-2 p-3 text-lg font-bold ${msg.ok ? 'border-green-500 bg-green-50 text-green-900' : 'border-rose-400 bg-rose-50 text-rose-900'}`}>
            <span aria-hidden>{msg.ok ? '✓ ' : '✗ '}</span>{msg.text}
          </p>
        )}
      </Card>
      <Card>
        <h2 className="mb-2 text-lg font-bold">الدروس الإضافية ({progress.imported.length})</h2>
        {progress.imported.length === 0 ? <p>لا توجد دروس إضافية بعد.</p> : (
          <ul className="space-y-2">
            {progress.imported.map(l => (
              <li key={l.id} className="flex items-center justify-between gap-2 rounded-2xl bg-amber-50 p-2">
                <span><span className="font-bold">{l.titleAr}</span> · <span className="en">{l.title}</span> <span className="text-sm">({l.words.length} كلمات)</span></span>
                <Button variant="danger" aria-label={`احذف ${l.title}`}
                  onClick={() => update(p => ({ ...p, imported: p.imported.filter(x => x.id !== l.id) }))}>حذف</Button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </Shell>
  );
}
