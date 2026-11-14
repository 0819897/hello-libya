# Hello Libya — سجل التقدّم
plan: docs/plan.md (الاسم في الخطة "English Quest / مغامرة الإنجليزي" استُبدل بـ "Hello Libya" بطلب المستخدم؛ المستودع hello-libya)

- Ruling: تتبّع التقدّم في هذا الملف بدل `.superpowers/sdd` — طلب المستخدم صراحة docs/progress.md — لا كلفة.
- Ruling: العمل مباشرة على فرع main بلا worktree — النشر على Pages يتمّ من main والمستخدم طلب push لكل مرحلة — لا كلفة.
- Ruling: مفتاح التخزين يبقى `eq.progress.v1` كما في Global Constraints حرفياً رغم تغيير الاسم.

- Stage 1: complete — هيكل Vite + React 18 + TS strict + Tailwind 4 + HashRouter + Vitest؛ `src/types.ts`؛ `validateLesson` والمحمّلات مع 7 اختبارات؛ `grades.json` و`grade4/index.json` (17 درساً، الوحدة 4 تحدٍّ كبير، 5–8 قريباً)؛ الدرس `u1/l1.json` كاملاً؛ صفحة رئيسية مؤقتة؛ مسار نشر GitHub Actions إلى Pages.
- Stage 2: complete — `rng.ts` (mulberry32 + shuffle)، `questions.ts` (7 ألعاب عامة + تمرير إعدادات الألعاب الخاصة)، `scoring.ts`، `progress.ts` (تحميل/حفظ مع حماية من JSON تالف أو تخزين غير متاح، السلسلة اليومية، completeLesson، isUnlocked)؛ 25 اختباراً جديداً.
  - Ruling: الألعاب الخاصة تحصل على `config` كما هو مع مفتاح إضافي `round` — Question لا يملك حقلاً للجولة — إن كان خطأ فالألعاب تتجاهل المفتاح.
  - Ruling: `match` تستعمل `count` كحجم المجموعة (4–5) وتنتج سؤالاً لكل مجموعة كاملة — الخطة لم تحدد معنى count هنا.
  - Ruling: `spell` تقبل كلمات من حروف إنجليزية فقط بطول 2–10 — كلمات مثل T-shirt وo'clock تُستثنى.
  - Ruling: `awardBadges` تُنفَّذ في المرحلة 4 مع اختباراتها كما تقول المرحلة 4.
