import React, { useState, useEffect } from 'react';
import { 
  X, Share2, Copy, Check, Trophy, MessageCircle, Send, CheckCircle2, ShieldCheck, Sparkles
} from 'lucide-react';
import { 
  SingleCourseProgress, 
  getStudentProgress, 
  calculateProgressPercentage,
  getStudentStudiedCourses,
  isCourseStudied
} from '../utils/studentProgressStorage';
import { StudentBadge, getCourseBadges } from '../utils/badgeSystem';
import { StudentProfile, Course } from '../types';
import { getCourseById } from '../data/courses';

interface ShareAchievementModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeCourseId?: string;
  studentProfile?: StudentProfile | null;
  progress?: SingleCourseProgress;
  badges?: StudentBadge[];
  percentage?: number;
}

export const ShareAchievementModal: React.FC<ShareAchievementModalProps> = ({
  isOpen,
  onClose,
  activeCourseId = 'foundational_rules',
  studentProfile,
  progress,
  badges: initialBadges,
  percentage: initialPercentage,
}) => {
  const [copied, setCopied] = useState(false);
  const [selectedBagId, setSelectedBagId] = useState<string>(activeCourseId || 'foundational_rules');

  // Filter only courses the student has opened or studied
  const studiedCourses: Course[] = getStudentStudiedCourses(activeCourseId);

  useEffect(() => {
    if (activeCourseId) {
      setSelectedBagId(activeCourseId);
    } else if (studiedCourses.length > 0) {
      setSelectedBagId(studiedCourses[0].id);
    }
  }, [activeCourseId]);

  if (!isOpen) return null;

  const hasMultipleCourses = studiedCourses.length > 1;
  const isOverall = selectedBagId === 'all';
  const currentCourse = isOverall ? null : (getCourseById(selectedBagId) || studiedCourses[0]);

  // Compute statistics strictly based on studied courses
  let effectivePercentage = initialPercentage ?? 0;
  let effectiveProgress = progress;
  let effectiveBadges = initialBadges || [];

  if (isOverall) {
    let totalPct = 0;
    let combinedBadges: StudentBadge[] = [];
    studiedCourses.forEach((c) => {
      const p = getStudentProgress(c.id);
      totalPct += calculateProgressPercentage(p, c.units?.length || 4);
      combinedBadges = [...combinedBadges, ...getCourseBadges(p, c.id)];
    });
    effectivePercentage = Math.round(totalPct / Math.max(1, studiedCourses.length));
    effectiveBadges = Array.from(new Map(combinedBadges.map((b) => [b.id, b])).values());
  } else if (selectedBagId !== activeCourseId || !progress) {
    const p = getStudentProgress(selectedBagId);
    effectiveProgress = p;
    effectivePercentage = calculateProgressPercentage(p, currentCourse?.units?.length || 4);
    effectiveBadges = getCourseBadges(p, selectedBagId);
  }

  const studentName = studentProfile?.name || 'طالب علم التجويد';
  const unlockedBadges = effectiveBadges.filter((b) => b.isUnlocked);
  const examScore = effectiveProgress?.examBestScore ?? (effectiveProgress?.examCompleted ? 100 : null);

  let gradeText = 'متميز';
  if (examScore !== null) {
    if (examScore >= 95) gradeText = 'امتياز مع مرتبة الشرف';
    else if (examScore >= 90) gradeText = 'ممتاز مرتفع';
    else if (examScore >= 80) gradeText = 'جيد جداً';
    else gradeText = 'ناجح ومثابر';
  }

  const courseTitle = isOverall 
    ? 'الحقائب التجويدية المقررة' 
    : currentCourse?.title || 'حقيبة تجويدية';
  const courseShortTitle = isOverall 
    ? 'المسار التجويدي' 
    : currentCourse?.shortTitle || currentCourse?.title || 'الحقيبة المقررة';

  // Formatted share text
  const shareText = `🌟 بفضل الله وتوفيقه، حققت إنجازاً طيباً في: "${courseTitle}" عبر منصة دروس التجويد!
🎖️ نسبة الإنجاز: ${effectivePercentage}%
${examScore !== null ? `🏆 درجة الاختبار: ${examScore}% (${gradeText})\n` : ''}🏅 الأوسمة المكتسبة: ${unlockedBadges.length} أوسمة إتقان
👤 الدارس: ${studentName}
${studentProfile?.trainerName ? `👨‍🏫 إشراف: ${studentProfile.trainerName}\n` : ''}📖 منصة دروس التجويد: ${typeof window !== 'undefined' ? window.location.origin : ''}`;

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      const el = document.createElement('textarea');
      el.value = shareText;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `إنجاز تجويدي: ${studentName} - ${courseShortTitle}`,
          text: shareText,
          url: window.location.origin,
        });
      } catch (err) {
        console.error('Share cancelled:', err);
      }
    } else {
      handleCopyText();
    }
  };

  const handleWhatsAppShare = () => {
    const encoded = encodeURIComponent(shareText);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  const handleTelegramShare = () => {
    const encoded = encodeURIComponent(shareText);
    window.open(`https://t.me/share/url?url=${encodeURIComponent(window.location.origin)}&text=${encoded}`, '_blank');
  };

  const handleTwitterShare = () => {
    const tweetText = encodeURIComponent(
      `🌟 بفضل الله أتممت دراسة "${courseShortTitle}" بنسبة إنجاز ${effectivePercentage}%! 📖 #دروس_التجويد`
    );
    window.open(`https://twitter.com/intent/tweet?text=${tweetText}&url=${encodeURIComponent(window.location.origin)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 no-print font-tajawal dir-rtl animate-fadeIn">
      <div className="bg-slate-900 border border-amber-400/25 rounded-3xl max-w-lg w-full text-slate-100 shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header: Compact & Calm */}
        <div className="bg-slate-950/90 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-400 flex items-center justify-center shrink-0">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold font-quran text-slate-100 leading-tight">
                بطاقة مشاركة الإنجاز
              </h2>
              <p className="text-[11px] text-slate-400">
                مشاركة بطاقة الإنجاز المعتمدة للحقائب المدروسة
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            title="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Strip: Only opened / studied bags */}
        {hasMultipleCourses && (
          <div className="bg-slate-950/60 px-4 py-2 border-b border-slate-800 flex items-center gap-1.5 overflow-x-auto scrollbar-thin">
            <button
              onClick={() => setSelectedBagId('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold font-quran transition-all shrink-0 cursor-pointer border ${
                selectedBagId === 'all'
                  ? 'bg-amber-400 text-slate-950 border-amber-300'
                  : 'bg-slate-800/80 text-slate-300 border-slate-700/60 hover:bg-slate-800'
              }`}
            >
              <span>إجمالي المدروس ({studiedCourses.length})</span>
            </button>
            {studiedCourses.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedBagId(c.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold font-quran transition-all shrink-0 cursor-pointer border ${
                  selectedBagId === c.id
                    ? 'bg-amber-400 text-slate-950 border-amber-300'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700/60 hover:bg-slate-800'
                }`}
              >
                <span>{c.shortTitle || c.title}</span>
              </button>
            ))}
          </div>
        )}

        {/* Main Content: Single Clear Certificate Card */}
        <div className="p-4 sm:p-5">
          <div className="bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border border-amber-400/30 rounded-2xl p-4 sm:p-5 text-center relative shadow-lg space-y-3.5">
            
            {/* Top Bismillah */}
            <div className="font-quran text-amber-300/80 text-[11px] font-semibold tracking-wide">
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </div>

            {/* Compact Medallion Icon */}
            <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/25 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
              <Trophy className="w-5 h-5" />
            </div>

            {/* Student & Course Details */}
            <div className="space-y-1">
              <span className="text-[10px] text-amber-400/90 font-bold uppercase tracking-wider block font-tajawal">
                شهادة إنجاز وتميز تجويدي
              </span>
              <h3 className="text-lg sm:text-xl font-bold font-quran text-amber-100">
                {studentName}
              </h3>
              <p className="text-xs text-slate-300 font-tajawal max-w-xs mx-auto leading-relaxed">
                أتم بنجاح متطلبات دراسة: <strong className="text-amber-300 font-quran">{courseTitle}</strong>
              </p>
            </div>

            {/* 3 Metrics in a Compact Clean Row */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80">
              <div className="bg-slate-900/80 rounded-xl p-2 border border-slate-800">
                <div className="text-[10px] text-slate-400">نسبة الإنجاز</div>
                <div className="text-sm font-bold font-mono text-amber-400 mt-0.5">{effectivePercentage}%</div>
              </div>

              <div className="bg-slate-900/80 rounded-xl p-2 border border-slate-800">
                <div className="text-[10px] text-slate-400">درجة الاختبار</div>
                <div className="text-sm font-bold font-mono text-emerald-400 mt-0.5">
                  {examScore !== null ? `${examScore}%` : 'مستمر'}
                </div>
              </div>

              <div className="bg-slate-900/80 rounded-xl p-2 border border-slate-800">
                <div className="text-[10px] text-slate-400">الأوسمة</div>
                <div className="text-sm font-bold font-mono text-amber-300 mt-0.5">{unlockedBadges.length}</div>
              </div>
            </div>

            {/* Badges preview: Compact micro tags */}
            {unlockedBadges.length > 0 && (
              <div className="flex items-center justify-center gap-1.5 flex-wrap pt-0.5">
                {unlockedBadges.slice(0, 3).map((b) => (
                  <span
                    key={b.id}
                    className="inline-flex items-center gap-1 bg-slate-900/90 text-slate-300 text-[10px] px-2 py-0.5 rounded-md border border-slate-800"
                  >
                    <span className="text-xs">{b.icon}</span>
                    <span>{b.title}</span>
                  </span>
                ))}
              </div>
            )}

            {/* Certificate Footer Stamp */}
            <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 flex items-center justify-between">
              <div className="flex items-center gap-1 text-emerald-400 font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>منصة دروس التجويد</span>
              </div>
              {studentProfile?.trainerName ? (
                <span className="truncate max-w-[150px]">إشراف: {studentProfile.trainerName}</span>
              ) : (
                <span className="text-slate-500">مسار الإتقان المعتمد</span>
              )}
            </div>

          </div>

          {/* Clean Action Buttons: Compact & Direct */}
          <div className="mt-4 space-y-2.5">
            <div className="grid grid-cols-4 gap-2">
              {/* WhatsApp */}
              <button
                onClick={handleWhatsAppShare}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-1 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-xs"
                title="مشاركة عبر واتساب"
              >
                <MessageCircle className="w-3.5 h-3.5 fill-current shrink-0" />
                <span>واتساب</span>
              </button>

              {/* Telegram */}
              <button
                onClick={handleTelegramShare}
                className="bg-sky-600 hover:bg-sky-500 text-white font-bold py-2 px-1 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-xs"
                title="مشاركة عبر تيليجرام"
              >
                <Send className="w-3.5 h-3.5 shrink-0" />
                <span>تيليجرام</span>
              </button>

              {/* X */}
              <button
                onClick={handleTwitterShare}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold py-2 px-1 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-700 text-xs"
                title="مشاركة عبر منصة إكس"
              >
                <span className="font-bold text-xs">𝕏</span>
                <span>إكس</span>
              </button>

              {/* Native / Other */}
              <button
                onClick={handleNativeShare}
                className="bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold py-2 px-1 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-700 text-xs"
                title="مشاركة عبر تطبيقات أخرى"
              >
                <Share2 className="w-3.5 h-3.5 shrink-0" />
                <span>المزيد</span>
              </button>
            </div>

            {/* Copy Button & Feedback */}
            <button
              onClick={handleCopyText}
              className={`w-full py-2 px-3 rounded-xl border text-xs font-bold font-quran transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                copied
                  ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
                  : 'bg-slate-800/80 hover:bg-slate-800 text-slate-200 border-slate-700 hover:text-white'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>تم نسخ نص الإنجاز بنجاح! جاهز للصق</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>نسخ نص الإنجاز للحافظة</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-950/80 px-4 py-2.5 border-t border-slate-800 flex items-center justify-between text-xs">
          <div className="text-slate-400 text-[11px] flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>إنجاز مبارك نسأل الله لك التوفيق والسداد</span>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};
