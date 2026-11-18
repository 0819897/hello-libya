import { Link } from 'react-router-dom';
import { Card } from '../ui/Card';

// Placeholder list: the team replaces these with their real names.
const STUDENTS = ['اسم الطالب 1', 'اسم الطالب 2', 'اسم الطالب 3'];

export default function About() {
  return (
    <main className="mx-auto max-w-xl p-4">
      <Link to="/profile" className="mb-3 flex min-h-12 items-center font-bold text-teal-800">→ رجوع</Link>
      <Card className="text-center">
        <h1 className="en text-4xl font-black text-teal-700">Hello Libya</h1>
        <p className="mt-3 text-xl font-bold">مدرسة المعرفة مصراتة</p>
        <p className="mt-4">المحتوى مبني على منهجَي الصف الرابع (English for Libya) والصف الخامس (English World)</p>
        <p className="mt-2">تطبيق مجاني غير ربحي</p>
        <p className="mt-2 text-sm text-gray-600">لا إعلانات، لا حسابات، ولا تخرج أي بيانات من جهازك.</p>
        <h2 className="mt-6 text-lg font-bold">فريق العمل</h2>
        <ul className="mt-2 space-y-1">{STUDENTS.map(s => <li key={s}>{s}</li>)}</ul>
      </Card>
    </main>
  );
}
