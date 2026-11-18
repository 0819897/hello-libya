import { Link, useParams } from 'react-router-dom';
import { bigBadgeFor, getLastGrade } from '../state/progress';
import { useProgress } from '../state/ProgressContext';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

export default function Certificate() {
  const { progress } = useProgress();
  const { gradeId } = useParams();
  const activeGrade = gradeId ?? getLastGrade(progress);
  const isG5 = activeGrade === 'grade5';
  const earned = progress.badges.includes(bigBadgeFor(activeGrade));
  const level = progress.mode === 'self' ? (isG5 ? 'المستوى 2' : 'المستوى 1') : (isG5 ? 'الصف الخامس' : 'الصف الرابع');
  const achievement = isG5 ? `أتمّ الوحدات الأربع الأولى من ${level}` : `أتمّ النصف الأول من ${level}`;
  const course = isG5 ? 'English World 5' : 'English for Libya';
  const date = new Date().toLocaleDateString('ar-LY', { year: 'numeric', month: 'long', day: 'numeric' });
  return (
    <main className="mx-auto max-w-4xl p-4">
      <div className="no-print mb-3 flex flex-wrap items-center justify-between gap-2">
        <Link to={`/grade/${activeGrade}`} className="flex min-h-12 items-center rounded-xl px-3 font-bold text-teal-800 hover:bg-teal-50">→ رجوع</Link>
        {earned && <Button onClick={() => window.print()}>🖨️ اطبع الشهادة</Button>}
      </div>
      {!earned ? (
        <Card className="text-center text-xl">أكمل التحدي الكبير بنجاح لتحصل على شهادتك. 🏆</Card>
      ) : (
        <section className="certificate mx-auto flex aspect-[297/210] w-full flex-col items-center justify-center rounded-3xl border-[10px] border-double border-amber-500 bg-white p-[4%] text-center shadow-lg">
          <p className="text-[clamp(1.5rem,5vw,3rem)]" aria-hidden>🏆</p>
          <h1 className="text-[clamp(1.25rem,4.5vw,2.75rem)] font-black text-teal-700">شهادة إنجاز</h1>
          <p className="mt-[1%] text-[clamp(0.9rem,2.4vw,1.4rem)]">تُمنح هذه الشهادة إلى</p>
          <p className="cert-name my-[1.5%] max-w-full text-[clamp(1.25rem,5vw,3rem)] font-black leading-tight text-amber-700 [overflow-wrap:anywhere]">{progress.name}</p>
          <p className="text-[clamp(1rem,2.8vw,1.6rem)] font-bold">{achievement}</p>
          <p className="en mt-[1%] text-[clamp(0.9rem,2.4vw,1.4rem)]">Hello Libya · {course}</p>
          <div className="mt-[3%] flex w-full items-end justify-between gap-4 text-[clamp(0.75rem,2vw,1.15rem)]">
            <span>التاريخ: {date}</span>
            <span className="font-bold">مدرسة المعرفة مصراتة</span>
          </div>
        </section>
      )}
    </main>
  );
}
