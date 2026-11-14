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
- Stage 3: complete — `speak()` (mp3 ثم speechSynthesis، لا يرفض أبداً) ونغمات صح/خطأ مولّدة بـ WebAudio (تعمل دون إنترنت)؛ 7 ألعاب عامة + `registry`؛ مكوّنات `ui/`؛ `ProgressContext`؛ `LessonPlayer` بمراحله الثلاث (تعلّم/العب/تحدَّ) و`Result`؛ مسار `#/lesson/:gradeId/:lessonId`. فحص يدوي: الدرس g4-u1-l1 لُعب كاملاً على عرض 360px دون تمرير أفقي.
  - Ruling: دقة التحدّي (النجوم) تحسب الإجابات الصحيحة من المحاولة الأولى فقط — وإلا حصل الجميع على 100٪ لأن الإجابة تُكشف بعد الخطأ — إن كان خطأ فالنجوم أصعب قليلاً.
  - Ruling: إعادة السؤال الخاطئ في نهاية الجولة تتم في مرحلة "العب" فقط ومرة واحدة لكل سؤال؛ التحدّي لا يعيد الأسئلة — لكي لا تتأثر الدقة.
  - Ruling: الكلمات "الفائتة" (تُضاف إلى mistakes) تأتي من أخطاء التحدّي فقط؛ النقاط تُحتسب في المرحلتين.
  - Ruling: ألعاب الترتيب/التهجئة تعرض الإجابة الصحيحة بعد الخطأ حتى في التحدّي (حيث يُحذف explainAr لإخفاء المعنى العربي).
