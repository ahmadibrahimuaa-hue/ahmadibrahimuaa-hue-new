import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, XCircle, Volume2, ShieldAlert, Sparkles, HelpCircle } from 'lucide-react';
import { Course } from '../types';

interface ErrorCorrectionViewProps {
  course?: Course;
}

export const ErrorCorrectionView: React.FC<ErrorCorrectionViewProps> = ({ course }) => {
  const [activeTab, setActiveTab] = useState<number>(0);

  const defaultSakinanErrors = [
    {
      id: 1,
      title: "كسر ميم الجمع وواو الجماعة اللينة دون مسوغ",
      wrongText: "عَلَيْكِمِ الْقِتَالُ / وَعَصَوِ الرَّسُولَ",
      rightText: "عَلَيْكُمُ الْقِتَالُ / وَعَصَوُا الرَّسُولَ",
      cause: "تطبيق الأصل الموحد للكسر دون مراعاة الاستثناءات الخاصة بميم الجمع وواو اللين.",
      effect: "مخالفة الرواية المتواترة وثقل الأداء الصوتي.",
      correction: "ضم ميم الجمع وواو الجماعة اللينة دائماً عند التقائهما بساكن بعدهما.",
      surahRef: "البقرة: 216 / الحاقة: 10"
    },
    {
      id: 2,
      title: "تمطيط الحركة العارضة حتى يتولد منها حرف مد زاد",
      wrongText: "قُلِي ادْعُوا / مِنَا النَّاسِ",
      rightText: "قُلِ ادْعُوا / مِنَ النَّاسِ",
      cause: "المبالغة الفائضة في بيان حركة التخلص العارضة للبقاء عليها زماناً طويلاً.",
      effect: "تولد ياء مدية أو ألف مدية غير موجودة في رسم المصحف الشريف (لحن جلي).",
      correction: "إعطاء الحركة العارضة حقها الخاطف الصرفي دون مط أو زيادة زمنية."
    },
    {
      id: 3,
      title: "إثبات حرف المد وصلاً عند التقائه بساكن (إبقاء الساكن الأول)",
      wrongText: "وَقَالُوا ... الْحَمْدُ (بمد الواو وصلاً)",
      rightText: "وَقَالُلْ حَمْدُ (إسقاط الواو لفظاً وصلاً)",
      cause: "الاعتماد على رسم المصحف الخطي دون اتباع أصول اللفظ الصوتي المتواتر.",
      effect: "اجتماع ساكنين ممتنعين وصلاً وإثقال اللسان بالمد وصلاً.",
      correction: "إسقاط الألف والواو والياء المدية لفظاً وصلاً فوراً والانتقال للحرف التالي."
    },
    {
      id: 4,
      title: "قلقلة الساكن الأول بدلاً من تحريكه بحركته العارضة",
      wrongText: "قُلْ (مقلقلة) ادْعُوا / أَنْ (مقلقلة) اعْبُدُوا",
      rightText: "قُلِ ادْعُوا / أَنِ اعْبُدُوا",
      cause: "الارتباك والنطق الشديد بدلاً من تحريك الساكن بالكسرة العارضة.",
      effect: "قلقلة حروف لا تقلقل كاللام والنون والتسبب في نبر نشاز.",
      correction: "إعطاء الساكن حركة الكسر العارضة بسلاسة ويقين دون اهتزاز الحرف."
    },
    {
      id: 5,
      title: "ترك نون التنوين ساكنة والسكت بين الكلمتين",
      wrongText: "أَحَدٌ ... اللَّهُ (وقتاً مع سكت مبتور)",
      rightText: "أَحَدُنِ اللَّهُ (بكسر نون التنوين وصلاً)",
      cause: "توهم أن التنوين لا يحرك، أو الخوف من التقاء الساكنين.",
      effect: "قطع سياق الآية المباركة وإلغاء الوصل المطلق.",
      correction: "كسر نون التنوين الملفوظة كسرًا خالصاً خفيفاً في درجة الوصل."
    }
  ];

  const defaultIdghamErrors = [
    {
      id: 1,
      title: "قلقلة الحرف الأول وإظهاره في نحو (اركب معنا) و (يلهث ذلك)",
      wrongText: "ارْكَبْ مَعَنَا (مع القلقلة) / يَلْهَثْ ذٰلِكَ",
      rightText: "ارْكَمَّعَنَا / يَلْهَذَّلِكَ",
      cause: "عدم الانتباه لاندماج الذات والصفة بالكامل في الميم والذال ووجوب الإدغام الكامل عند حفص.",
      effect: "إظهار الحرفين ومنع الإدغام الواجب رواية وإثقال اللسان.",
      correction: "الانتقال المباشر للشفتين أو مخرج الذال لإخراج الحرف الثاني مشدداً دون قلقلة الأول.",
      surahRef: "هود: 42 / الأعراف: 176"
    },
    {
      id: 2,
      title: "التضحية بصفة الإطباق والاستعلاء في الإدغام الناقص (بسطت - فرطتم)",
      wrongText: "بَسَتَّ / فَرَّتُّمْ (تشديد التاء وإلغاء تفخيم الطاء)",
      rightText: "بَسَطْتَ / فَرَّطْتُمْ (إطباق الطاء دون قلقلة ثم نطق التاء)",
      cause: "توهم أن الإدغام هنا كامل كباقي المواضع، أو القلقلة الخاطئة للطاء.",
      effect: "طمس صفة الاستعلاء والإطباق للطاء المستعلية القوية (لحن جلي).",
      correction: "طبق المخرج على الطاء بقوة مع التفخيم دون قلقلة، ثم الانفكاك إلى التاء المرققة.",
      surahRef: "المائدة: 28 / الزمر: 56"
    },
    {
      id: 3,
      title: "إدغام نون (يس والقرآن) أو (ن والقلم) وصلاً لحفص",
      wrongText: "يَسِي وَالْقُرْآنِ / نُو وَالْقَلَمِ (بالإدغام بغنة)",
      rightText: "يس وَالْقُرْآنِ / ن وَالْقَلَمِ (بالإظهار المطلق وصلاً)",
      cause: "قياس النون الساكنة في الفواتح على النون الساكنة مع الواو في وسط الآيات.",
      effect: "مخالفة طريق الشاطبية لرواية حفص التي تنص على الإظهار الجزم فيهما.",
      correction: "التزام الإظهار المطلق للنون وإخراجها من مخرجها ناصعة وصلاً.",
      surahRef: "يس: 1-2 / القلم: 1"
    },
    {
      id: 4,
      title: "ترك السكت اللطيف على هاء (ماليه هلك) وصلاً",
      wrongText: "مَالِيَهَّلَكَ (بالإدغام المباشر دون معرفة وجه السكت)",
      rightText: "مَالِيَهْ | هَلَكَ (سكت لطيف بلا تنفس مع الإظهار وهو الوجه المقدم)",
      cause: "عدم معرفة الوجهين الجائزين لحفص وصلاً (السكت مع الإظهار وهو المقدم، أو الإدغام الكامل).",
      effect: "إسقاط وجه السكت المقدم أداءً ورواية عن أهل النشر.",
      correction: "الأداء بالسكت اللطيف على الهاء الأولى وإظهارها وهو الأرجح أداءً وشذوذاً.",
      surahRef: "الحاقة: 28-29"
    },
    {
      id: 5,
      title: "الخلط بين ضبط المصحف للإدغام الكامل والإدغام الناقص",
      wrongText: "وضع الشدة على التاء في (بسطت) أو تجريد الساكن في الإظهار",
      rightText: "تجريد الطاء من السكون وعدم تشديد التاء في الناقص",
      cause: "عدم معرفة قواعد ضبط المصحف الشريف للإدغام الكامل والناقص.",
      effect: "الارتباك أثناء التلاوة بالنظر وإعطاء الحرف تشديداً غير موجود.",
      correction: "مراعاة تعرية الساكن الأول وعدم تشديد الثاني في الناقص، وتشديد الثاني في الكامل.",
      surahRef: "ضبط المصحف الشريف"
    }
  ];

  const errorsList = (course && course.errors && course.errors.length > 0)
    ? course.errors
    : (course?.id === 'idgham' ? defaultIdghamErrors : defaultSakinanErrors);

  const topicName = course?.shortTitle || course?.title || 'التقاء الساكنين';

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-rose-950 via-rose-900 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-md border border-rose-800 space-y-3">
        <div className="flex items-center gap-2 text-rose-300 text-xs font-bold uppercase tracking-wider">
          <ShieldAlert className="w-4 h-4 text-rose-400" />
          <span>المختبر النقدى الميداني للتدريب والتصحيح</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold font-quran text-amber-100">
          أشهر الأخطاء العملية في {topicName} لدى القراء والمبتدئين وكيفية علاجها
        </h1>
        <p className="text-xs sm:text-sm text-rose-200/90 font-tajawal max-w-3xl leading-relaxed">
          جدول مقارنة تفاعلي معتمد على ملاحشات شيوخ المقارئ (الحصري والمرصفي) لرصد اللحن الجلي والخفي والتصحيح الترتيلي.
        </p>
      </div>

      {/* Grid of Error Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Navigation Sidebar */}
        <div className="space-y-2">
          {errorsList.map((err, idx) => (
            <button
              key={err.id}
              onClick={() => setActiveTab(idx)}
              className={`w-full text-right p-4 rounded-xl border transition-all flex items-start gap-3 ${
                activeTab === idx
                  ? 'bg-rose-900 text-white border-rose-700 shadow-md ring-2 ring-rose-800'
                  : 'bg-white text-slate-800 border-slate-200 hover:border-rose-300 hover:bg-rose-50/50'
              }`}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                activeTab === idx ? 'bg-amber-400 text-rose-950' : 'bg-slate-100 text-slate-600'
              }`}>
                0{idx + 1}
              </div>
              <div>
                <div className="font-bold font-quran text-sm">{err.title}</div>
                <div className={`text-[11px] mt-0.5 ${activeTab === idx ? 'text-rose-200' : 'text-slate-500'}`}>
                  {err.surahRef || 'تنبيه أداء ميداني'}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Selected Error Detail View */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            <h3 className="text-lg font-bold font-quran text-slate-900">
              تحليل وتصحيح: {errorsList[activeTab].title}
            </h3>
          </div>

          {/* Comparison Cards Side by Side */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Wrong Side */}
            <div className="bg-rose-50 border border-rose-200 p-5 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-rose-900 font-bold text-xs">
                <XCircle className="w-4 h-4 text-rose-600" />
                <span>الأداء الخاطئ (اللحن):</span>
              </div>
              <div className="text-lg font-bold font-quran text-rose-950 bg-white p-3 rounded-xl border border-rose-300">
                {errorsList[activeTab].wrongText}
              </div>
            </div>

            {/* Right Side */}
            <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>الأداء الصحيح المعتمد:</span>
              </div>
              <div className="text-lg font-bold font-quran text-emerald-950 bg-white p-3 rounded-xl border border-emerald-300">
                {errorsList[activeTab].rightText}
              </div>
            </div>
          </div>

          {/* Detailed Diagnosis */}
          <div className="space-y-3 text-xs font-tajawal">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
              <span className="font-bold text-slate-900 font-quran text-sm">سبب الوقوع في الخطأ:</span>
              <p className="text-slate-700 leading-relaxed">{errorsList[activeTab].cause}</p>
            </div>

            <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 space-y-1">
              <span className="font-bold text-amber-950 font-quran text-sm">الأثر السلبي المترتب تجويدياً:</span>
              <p className="text-amber-900 leading-relaxed">{errorsList[activeTab].effect}</p>
            </div>

            <div className="bg-emerald-950 text-emerald-200 p-4 rounded-xl border border-emerald-800 space-y-1">
              <span className="font-bold text-amber-300 font-quran text-sm">طريقة العلاج والتصحيح العملي:</span>
              <p className="leading-relaxed">{errorsList[activeTab].correction}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
