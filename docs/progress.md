# Hello Libya — سجل التقدّم
plan: docs/plan.md (الاسم في الخطة "English Quest / مغامرة الإنجليزي" استُبدل بـ "Hello Libya" بطلب المستخدم؛ المستودع hello-libya)

- Ruling: تتبّع التقدّم في هذا الملف بدل `.superpowers/sdd` — طلب المستخدم صراحة docs/progress.md — لا كلفة.
- Ruling: العمل مباشرة على فرع main بلا worktree — النشر على Pages يتمّ من main والمستخدم طلب push لكل مرحلة — لا كلفة.
- Ruling: مفتاح التخزين يبقى `eq.progress.v1` كما في Global Constraints حرفياً رغم تغيير الاسم.

- Stage 1: complete — هيكل Vite + React 18 + TS strict + Tailwind 4 + HashRouter + Vitest؛ `src/types.ts`؛ `validateLesson` والمحمّلات مع 7 اختبارات؛ `grades.json` و`grade4/index.json` (17 درساً، الوحدة 4 تحدٍّ كبير، 5–8 قريباً)؛ الدرس `u1/l1.json` كاملاً؛ صفحة رئيسية مؤقتة؛ مسار نشر GitHub Actions إلى Pages.
