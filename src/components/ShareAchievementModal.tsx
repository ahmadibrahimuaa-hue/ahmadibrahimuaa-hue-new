import React, { useState } from 'react';
import { 
  X, Share2, Copy, Check, Award, Trophy, BookOpen, 
  Download, MessageCircle, Send, CheckCircle2, ShieldCheck, 
  Star, Flame, GraduationCap
} from 'lucide-react';
import { SingleCourseProgress } from '../utils/studentProgressStorage';
import { StudentBadge } from '../utils/badgeSystem';
import { StudentProfile } from '../types';
import { getAllCourses, getCourseById } from '../data/courses';
import { getStudentProgress, calculateProgressPercentage } from '../utils/studentProgressStorage';
import { getCourseBadges } from '../utils/badgeSystem';

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
  activeCourseId = 'sakinan',
  studentProfile,
  progress,
  badges: initialBadges,
  percentage: initialPercentage,
}) => {
  const [copied, setCopied] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [selectedBagId, setSelectedBagId] = useState<string>(activeCourseId || 'sakinan');

  // Synchronize when activeCourseId changes
  React.useEffect(() => {
    if (activeCourseId) {
      setSelectedBagId(activeCourseId);
    }
  }, [activeCourseId]);

  if (!isOpen) return null;

  const allCourses = getAllCourses();
  const isOverall = selectedBagId === 'all';
  const currentCourse = isOverall ? null : (getCourseById(selectedBagId) || allCourses[0]);

  // Compute stats based on selection
  let effectivePercentage = initialPercentage ?? 0;
  let effectiveProgress = progress;
  let effectiveBadges = initialBadges || [];

  if (isOverall) {
    let totalPct = 0;
    let combinedBadges: StudentBadge[] = [];
    allCourses.forEach((c) => {
      const p = getStudentProgress(c.id);
      totalPct += calculateProgressPercentage(p, c.units?.length || 5);
      combinedBadges = [...combinedBadges, ...getCourseBadges(p, c.id)];
    });
    effectivePercentage = Math.round(totalPct / Math.max(1, allCourses.length));
    // Unique badges
    effectiveBadges = Array.from(new Map(combinedBadges.map(b => [b.id, b])).values());
  } else if (selectedBagId !== activeCourseId || !progress) {
    const p = getStudentProgress(selectedBagId);
    effectiveProgress = p;
    effectivePercentage = calculateProgressPercentage(p, currentCourse?.units?.length || 5);
    effectiveBadges = getCourseBadges(p, selectedBagId);
  }

  const studentName = studentProfile?.name || 'طالب قرآن كريم';
  const unlockedBadges = effectiveBadges.filter((b) => b.isUnlocked);
  const examScore = effectiveProgress?.examBestScore ?? (isOverall ? 95 : 100);

  // Grade descriptor
  let gradeText = 'ممتاز مع مرتبة الشرف';
  if (examScore < 90 && examScore >= 80) gradeText = 'جيد جداً مرتفع';
  else if (examScore < 80) gradeText = 'جيد';

  const courseTitle = isOverall ? 'كافة الحقائب التجويدية المعتمدة' : currentCourse?.title || 'حقيبة تجويدية';

  // Pre-formatted share text
  const shareText = `🌟 بفضل الله وتوفيقه، حققت إنجازاً متميزاً في: "${courseTitle}" عبر منصة الحقائب التجويدية التفاعلية!
🎖️ نسبة الإنجاز والتقدم: ${effectivePercentage}%
🏆 درجة الاختبار: ${examScore}% (${gradeText})
🏅 الأوسمة المكتسبة: ${unlockedBadges.length} أوسمة إتقان
👤 الدارس: ${studentName}
${studentProfile?.trainerName ? `👨‍🏫 بإشراف المعلم: ${studentProfile.trainerName}` : ''}
📖 رابط المنصة التعليمية: ${window.location.origin}`;

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback copy
      const el = document.createElement('textarea');
      el.value = shareText;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `إنجاز تجويدي: ${studentName} - ${courseTitle}`,
          text: shareText,
          url: window.location.origin,
        });
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 3000);
      } catch (err) {
        console.error('Share dismissed or failed:', err);
      }
    } else {
      handleCopyText();
    }
  };

  const handleWhatsAppShare = () => {
    const encoded = encodeURIComponent(shareText);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  const handleTwitterShare = () => {
    const tweetText = encodeURIComponent(
      `🌟 بفضل الله أتممت دراسة "${courseTitle}" بنسبة ${effectivePercentage}% ودرجة ${examScore}% في الاختبار الشامل! 📖 #تجويد #القرآن_الكريم`
    );
    window.open(`https://twitter.com/intent/tweet?text=${tweetText}&url=${encodeURIComponent(window.location.origin)}`, '_blank');
  };

  const handleTelegramShare = () => {
    const encoded = encodeURIComponent(shareText);
    window.open(`https://t.me/share/url?url=${encodeURIComponent(window.location.origin)}&text=${encoded}`, '_blank');
  };

  const handleFacebookShare = () => {
    const url = encodeURIComponent(window.location.origin);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto font-tajawal dir-rtl no-print">
      <div className="bg-slate-900 border border-emerald-700/60 rounded-3xl max-w-xl w-full text-slate-100 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 my-8">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 p-5 border-b border-emerald-800/80 relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-amber-400 to-amber-500 rounded-xl text-slate-950 shadow-md">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black font-quran text-amber-200">
                مشاركة بطاقة الإنجاز والتميز
              </h2>
              <p className="text-xs text-slate-300">
                شارك نتائجك وأوسمتك المكتسبة في الحقائب التدريبية عبر تطبيقات التواصل الاجتماعي
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-all cursor-pointer"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto custom-scrollbar">

          {/* Bag Selector Tabs */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300 font-quran">
              اختر الحقيبة التدريبية المراد مشاركة إنجازها:
            </label>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs font-quran">
              <button
                onClick={() => setSelectedBagId('all')}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all font-bold cursor-pointer flex items-center gap-1 border ${
                  selectedBagId === 'all'
                    ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-sm font-extrabold'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                <span>🌟 التقدم الشامل (كافة الحقائب)</span>
              </button>
              {allCourses.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedBagId(c.id)}
                  className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all font-bold cursor-pointer border ${
                    selectedBagId === c.id
                      ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-sm font-extrabold'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  <span>{c.shortTitle || c.title}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Achievement Visual Card Preview */}
          <div className="bg-gradient-to-b from-emerald-950 via-slate-950 to-slate-900 border-2 border-amber-400/40 rounded-3xl p-6 shadow-xl relative overflow-hidden text-center space-y-4">
            
            {/* Corner Decorative Elements */}
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-amber-400/20 to-transparent rounded-bl-full pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-emerald-400/20 to-transparent rounded-tr-full pointer-events-none"></div>

            {/* Bismillah */}
            <div className="font-quran text-amber-300 text-sm font-bold">
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </div>

            {/* Main Badge Graphic */}
            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-amber-400/10 border border-amber-400/30 text-amber-400 shadow-inner">
              <Trophy className="w-10 h-10 animate-pulse" />
            </div>

            {/* Title & Student Name */}
            <div>
              <span className="text-[11px] text-amber-300 font-bold font-quran bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30 inline-block mb-1.5">
                بطاقة إنجاز دراسي معتمدة
              </span>
              <h3 className="text-xl font-extrabold font-quran text-amber-100">
                {studentName}
              </h3>
              <p className="text-xs text-emerald-200/90 font-quran mt-0.5">
                أتم بنجاح متطلبات: <strong className="text-amber-300">{courseTitle}</strong>
              </p>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-3 gap-2.5 pt-2">
              <div className="bg-slate-900/90 border border-emerald-700/50 rounded-2xl p-2.5">
                <span className="text-[10px] text-slate-400 block font-quran">نسبة الإنجاز</span>
                <span className="text-base font-black text-amber-400 font-sans">{effectivePercentage}%</span>
              </div>
              <div className="bg-slate-900/90 border border-emerald-700/50 rounded-2xl p-2.5">
                <span className="text-[10px] text-slate-400 block font-quran">درجة الاختبار</span>
                <span className="text-base font-black text-emerald-400 font-sans">{examScore}%</span>
              </div>
              <div className="bg-slate-900/90 border border-emerald-700/50 rounded-2xl p-2.5">
                <span className="text-[10px] text-slate-400 block font-quran">الأوسمة</span>
                <span className="text-base font-black text-amber-300 font-sans">{unlockedBadges.length}</span>
              </div>
            </div>

            {/* Badges Preview Icons */}
            {unlockedBadges.length > 0 && (
              <div className="flex items-center justify-center gap-2 flex-wrap pt-1">
                {unlockedBadges.slice(0, 5).map((b) => (
                  <span
                    key={b.id}
                    className="inline-flex items-center gap-1 bg-slate-900/80 border border-amber-500/30 text-[11px] px-2.5 py-1 rounded-xl text-amber-200 font-quran"
                    title={b.desc}
                  >
                    <span>{b.icon}</span>
                    <span className="text-[10px] font-bold">{b.title}</span>
                  </span>
                ))}
              </div>
            )}

            {/* Supervision & Footer Stamp */}
            <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between font-quran px-2">
              <div className="flex items-center gap-1.5 text-emerald-300">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>منصة الحقائب التجويدية المعتمدة</span>
              </div>
              {studentProfile?.trainerName && (
                <span>إشراف: {studentProfile.trainerName}</span>
              )}
            </div>
          </div>

          {/* Share Channels */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-300 font-quran">
              اختر وسيلة المشاركة عبر تطبيقات التواصل الاجتماعي:
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {/* WhatsApp */}
              <button
                onClick={handleWhatsAppShare}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold p-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md text-xs"
              >
                <MessageCircle className="w-5 h-5 fill-current" />
                <span>واتساب</span>
              </button>

              {/* Telegram */}
              <button
                onClick={handleTelegramShare}
                className="bg-sky-600 hover:bg-sky-500 text-white font-bold p-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md text-xs"
              >
                <Send className="w-5 h-5" />
                <span>تيليجرام</span>
              </button>

              {/* Twitter / X */}
              <button
                onClick={handleTwitterShare}
                className="bg-slate-800 hover:bg-slate-700 text-white font-bold p-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer border border-slate-700 text-xs"
              >
                <span className="font-sans text-base font-black">𝕏</span>
                <span>تويتر / إكس</span>
              </button>

              {/* Facebook */}
              <button
                onClick={handleFacebookShare}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold p-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md text-xs"
              >
                <span className="font-sans text-base font-black">f</span>
                <span>فيسبوك</span>
              </button>

              {/* Native Share Sheet */}
              <button
                onClick={handleNativeShare}
                className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold p-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md text-xs col-span-2 sm:col-span-1"
              >
                <Share2 className="w-5 h-5" />
                <span>مشاركة</span>
              </button>
            </div>
          </div>

          {/* Copy Text Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 font-quran">
                نص الرسالة المجهز للمشاركة:
              </label>
              <button
                onClick={handleCopyText}
                className="text-xs text-amber-300 hover:text-amber-200 flex items-center gap-1 font-quran font-bold cursor-pointer transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'تم النسخ بنجاح!' : 'نسخ النص'}</span>
              </button>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 text-xs text-slate-300 font-tajawal leading-relaxed whitespace-pre-wrap select-all">
              {shareText}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-950 p-4 border-t border-slate-800 flex items-center justify-between text-xs">
          <div className="text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>جاهز للمشاركة المباشرة عبر جميع التطبيقات</span>
          </div>

          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-white font-bold font-quran px-5 py-2 rounded-xl transition-all cursor-pointer border border-slate-700"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};
