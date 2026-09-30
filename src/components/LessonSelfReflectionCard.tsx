import React, { useState, useEffect } from 'react';
import { 
  Star, MessageSquare, Check, Sparkles, AlertCircle, 
  HelpCircle, Send, CheckCircle2, UserCheck
} from 'lucide-react';
import { 
  saveLessonReflection, 
  getLessonReflection, 
  REFLECTION_RATINGS, 
  LessonSelfReflection 
} from '../utils/selfReflectionStorage';
import { getStudentProfile } from '../utils/studentStorage';

interface LessonSelfReflectionCardProps {
  courseId: string;
  unitNumber: number;
  unitTitle: string;
  lessonNumber: number;
  lessonTitle: string;
  isTeacherMode?: boolean;
}

export const LessonSelfReflectionCard: React.FC<LessonSelfReflectionCardProps> = ({
  courseId,
  unitNumber,
  unitTitle,
  lessonNumber,
  lessonTitle,
  isTeacherMode = false,
}) => {
  const profile = getStudentProfile();
  const studentName = profile?.name?.trim() || 'طالب المنصة';

  const [currentRating, setCurrentRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [studentNote, setStudentNote] = useState<string>('');
  const [showNoteInput, setShowNoteInput] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // Load existing rating for this student on this lesson
  useEffect(() => {
    const existing = getLessonReflection(studentName, courseId, unitNumber, lessonNumber);
    if (existing) {
      setCurrentRating(existing.rating);
      setStudentNote(existing.note || '');
      if (existing.note) setShowNoteInput(true);
      setIsSaved(true);
    } else {
      setCurrentRating(0);
      setStudentNote('');
      setShowNoteInput(false);
      setIsSaved(false);
    }
    setSaveSuccessMessage(null);
  }, [studentName, courseId, unitNumber, lessonNumber]);

  const handleSelectRating = async (ratingVal: number) => {
    setCurrentRating(ratingVal);
    const saved = await saveLessonReflection(
      courseId,
      unitNumber,
      unitTitle,
      lessonNumber,
      lessonTitle,
      ratingVal,
      studentNote,
      studentName
    );
    if (saved) {
      setIsSaved(true);
      const ratingInfo = REFLECTION_RATINGS.find((r) => r.value === ratingVal);
      setSaveSuccessMessage(`تم تسجيل تقييمك الذاتي: ${ratingInfo?.label} (${ratingVal}/5) ✓`);
      setTimeout(() => setSaveSuccessMessage(null), 3500);
    }
  };

  const handleSaveNote = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentRating) {
      setCurrentRating(3); // default to 3 if not yet selected
    }
    const targetRating = currentRating || 3;
    const saved = await saveLessonReflection(
      courseId,
      unitNumber,
      unitTitle,
      lessonNumber,
      lessonTitle,
      targetRating,
      studentNote,
      studentName
    );
    if (saved) {
      setIsSaved(true);
      setSaveSuccessMessage('تم حفظ ملاحظتك وتقييمك وتوثيقها للمعلم في لوحة التحكم بنجاح ✓');
      setTimeout(() => setSaveSuccessMessage(null), 3500);
    }
  };

  const activeRatingObj = REFLECTION_RATINGS.find((r) => r.value === (hoverRating || currentRating));

  return (
    <div className="bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border border-amber-400/30 rounded-2xl p-5 sm:p-6 text-slate-100 shadow-md space-y-4 no-print font-tajawal dir-rtl transition-all">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold font-quran text-sm sm:text-base text-amber-100 flex items-center gap-2">
              <span>التقييم الذاتي لمدى فهم واستيعاب الدرس</span>
              <span className="text-[10px] font-sans px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                Self-Reflection
              </span>
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              قيّم استيعابك من 1 إلى 5 لتوثيق مسارك التعليمي، وستظهر هذه التقييمات للمعلم في لوحة المتابعة
            </p>
          </div>
        </div>

        {isSaved && currentRating > 0 && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-bold font-quran shrink-0 self-start sm:self-center">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>تم التقييم: {currentRating}/5</span>
          </div>
        )}
      </div>

      {/* Success Notification Banner */}
      {saveSuccessMessage && (
        <div className="bg-emerald-950/90 border border-emerald-500/60 text-emerald-200 text-xs p-2.5 rounded-xl flex items-center justify-center gap-2 animate-fadeIn font-bold">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{saveSuccessMessage}</span>
        </div>
      )}

      {/* 5-Star Interactive Rating Selector */}
      <div className="flex flex-col items-center justify-center gap-3 py-2 bg-slate-950/60 rounded-xl border border-slate-800/80 p-4">
        <div className="flex items-center gap-2 sm:gap-3 flex-row-reverse">
          {[5, 4, 3, 2, 1].map((val) => {
            const isFilled = (hoverRating || currentRating) >= val;
            return (
              <button
                key={val}
                type="button"
                onMouseEnter={() => setHoverRating(val)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => handleSelectRating(val)}
                className={`p-1.5 sm:p-2 rounded-xl transition-all cursor-pointer transform hover:scale-115 active:scale-95 ${
                  isFilled ? 'text-amber-400' : 'text-slate-600 hover:text-slate-400'
                }`}
                title={`تقييم ${val} من 5`}
              >
                <Star className={`w-6 h-6 sm:w-8 sm:h-8 ${isFilled ? 'fill-amber-400' : 'stroke-slate-500'}`} />
                <span className="text-[10px] font-mono block text-center mt-1 text-slate-400">
                  {val}
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected Rating Description Badge */}
        {activeRatingObj && (
          <div className={`px-3.5 py-1.5 rounded-xl text-xs font-bold font-quran border transition-all animate-fadeIn ${activeRatingObj.bg} ${activeRatingObj.color}`}>
            <span>{activeRatingObj.fullLabel}</span>
          </div>
        )}
      </div>

      {/* Optional Student Note / Question for the Teacher */}
      <div className="space-y-2 pt-1">
        {!showNoteInput ? (
          <button
            type="button"
            onClick={() => setShowNoteInput(true)}
            className="text-xs text-amber-300 hover:text-amber-200 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
            <span>+ إضافة استفسار أو ملاحظة حول هذا الدرس للمعلم (اختياري)</span>
          </button>
        ) : (
          <div className="space-y-2 animate-fadeIn bg-slate-950/50 p-3.5 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="font-bold flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                <span>ملاحظتك أو استفسارك للمعلم حول هذا الدرس:</span>
              </span>
              <button
                type="button"
                onClick={() => setShowNoteInput(false)}
                className="text-[11px] text-slate-500 hover:text-slate-300"
              >
                إخفاء
              </button>
            </div>
            <textarea
              rows={2}
              value={studentNote}
              onChange={(e) => setStudentNote(e.target.value)}
              placeholder="اكتب هنا أي نقطة تجد صعوبة في نطقها أو تحتاج فيها مراجعة مع معلم الحلقة..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 resize-none font-tajawal"
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => handleSaveNote()}
                className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-colors font-quran"
              >
                <Send className="w-3 h-3" />
                <span>حفظ الملاحظة للمعلم</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Teacher Guide Notice if viewing in teacher mode */}
      {isTeacherMode && (
        <div className="bg-indigo-950/60 border border-indigo-500/40 rounded-xl p-2.5 text-[11px] text-indigo-300 flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>أنت في وضع المعلم: هذه البطاقة تفاعلية ويمكنك استعراض كافة تقييمات الطلاب المجمعة من «لوحة تحكم المعلم».</span>
        </div>
      )}
    </div>
  );
};
