import React, { useState, useEffect } from 'react';
import { Course, GroupThemeConfig } from '../types';
import { BookOpen, UserCheck, GraduationCap, Printer, Layers, Award, ShieldAlert, CheckCircle2, Bookmark, Lock, Unlock, MessageCircle, Sparkles, Building } from 'lucide-react';
import { getCourseLockDetails } from '../utils/studentProgressStorage';
import { getStudentProfile, subscribeStudentProfile } from '../utils/studentStorage';
import { WhatsAppUnlockRequestButton } from './WhatsAppSupport';
import { getActiveThemeForStudent, getEffectiveThemeStyle, subscribeGroupThemes } from '../utils/groupThemeStorage';
import { InstituteLogo } from './InstituteLogo';

interface CoverViewProps {
  course?: Course;
  onStartStudy: () => void;
  isTeacherMode: boolean;
  setIsTeacherMode: (val: boolean) => void;
  onPrint: () => void;
}

export const CoverView: React.FC<CoverViewProps> = ({
  course,
  onStartStudy,
  isTeacherMode,
  setIsTeacherMode,
  onPrint,
}) => {
  const title = course ? course.title : 'التقاء الساكنين في التجويد';
  const subtitle = course ? course.subtitle : 'منهج تعليمي تطبيقي متدرج لمعلمي القرآن الكريم والقراءات';
  const author = course ? course.author : 'أحمد إبراهيم';
  const unitsCount = course ? course.units.length : 5;
  const defaultBadge = course ? course.badge : 'الكتاب التدريبي المنهاجي المتكامل';

  const [studentProfile, setStudentProfile] = useState(() => getStudentProfile());
  const [activeTheme, setActiveTheme] = useState<GroupThemeConfig | null>(() => {
    return getActiveThemeForStudent(studentProfile?.group);
  });

  useEffect(() => {
    const unsubProf = subscribeStudentProfile((p) => {
      setStudentProfile(p);
      setActiveTheme(getActiveThemeForStudent(p?.group));
    });

    const unsubThemes = subscribeGroupThemes(() => {
      const p = getStudentProfile();
      setActiveTheme(getActiveThemeForStudent(p?.group));
    });

    return () => {
      unsubProf();
      unsubThemes();
    };
  }, []);

  const isIdgham = course?.id === 'idgham';
  const lockDetails = getCourseLockDetails(course?.id || 'sakinan', isTeacherMode, course);
  const isUnlocked = lockDetails.isUnlocked;

  // Compute theme styling
  const effectiveStyle = getEffectiveThemeStyle(activeTheme);
  const badgeText = activeTheme?.customBadgeText || defaultBadge;

  // Determine cover background classes / inline styles
  let coverBgClasses = 'bg-gradient-to-b from-emerald-950 via-slate-900 to-emerald-950 border-amber-400/80 shadow-2xl';
  if (effectiveStyle.customCardStyle) {
    coverBgClasses = 'border-4 shadow-2xl';
  } else if (activeTheme) {
    coverBgClasses = `bg-gradient-to-b ${effectiveStyle.bannerGradient} ${effectiveStyle.cardBorder} shadow-2xl`;
  } else if (isIdgham) {
    coverBgClasses = 'bg-gradient-to-b from-indigo-950 via-purple-950 to-slate-950 border-purple-400/80 shadow-purple-950/50';
  }

  return (
    <div className="space-y-8 font-tajawal dir-rtl">
      
      {/* Institute Custom Welcome Notification Bar if Theme is Active */}
      {activeTheme && (
        <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border-2 border-amber-400/50 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-right">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center p-2 shrink-0 shadow-inner">
              <InstituteLogo theme={activeTheme} className="w-8 h-8" iconClassName="w-7 h-7 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold font-quran text-amber-300">
                  {activeTheme.instituteName}
                </span>
                <span className="text-[10px] bg-amber-400/20 text-amber-200 border border-amber-400/30 px-2 py-0.5 rounded-full font-bold">
                  {activeTheme.groupName}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {activeTheme.welcomeMessage || activeTheme.instituteSubtitle || 'نسخة منهاجية مخصصة ومعتمدة لطلاب المعهد.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-300/90 bg-amber-400/10 px-3 py-1.5 rounded-xl border border-amber-400/30">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>تجربة مخصصة للمعهد 🏛️</span>
          </div>
        </div>
      )}

      {/* Official Book Cover Card */}
      <div 
        className={`relative overflow-hidden text-white rounded-3xl p-8 sm:p-14 text-center space-y-8 transition-all duration-300 ${coverBgClasses}`}
        style={effectiveStyle.customCardStyle}
      >
        
        {/* Islamic Ornament Background Glows */}
        <div 
          className="absolute -top-24 -left-24 w-72 h-72 rounded-full blur-3xl pointer-events-none opacity-20"
          style={{ backgroundColor: effectiveStyle.accentColor }}
        ></div>
        <div 
          className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full blur-3xl pointer-events-none opacity-20"
          style={{ backgroundColor: effectiveStyle.primaryColor }}
        ></div>

        {/* Decorative Top Border Frame with Institute Logo & Name */}
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="flex items-center justify-center gap-3 w-full">
            <div className="h-0.5 flex-1 max-w-[120px] bg-gradient-to-r from-transparent via-amber-400 to-transparent"></div>
            <div className="flex items-center gap-2">
              {activeTheme && (
                <InstituteLogo theme={activeTheme} className="w-6 h-6" iconClassName="w-5 h-5 text-amber-300" />
              )}
              <span className="text-amber-300 text-xs sm:text-sm font-bold font-quran tracking-widest uppercase">
                {activeTheme ? `حقيبة معتمدة لدى: ${activeTheme.instituteName}` : 'حقيبة تدريبية للأكاديميات والمعاهد القرآنية'}
              </span>
            </div>
            <div className="h-0.5 flex-1 max-w-[120px] bg-gradient-to-r from-transparent via-amber-400 to-transparent"></div>
          </div>

          {activeTheme?.instituteSubtitle && (
            <span className="text-xs text-amber-200/80 font-tajawal">
              {activeTheme.instituteSubtitle}
            </span>
          )}
        </div>

        {/* Bismillah Header */}
        <div className="pt-2 font-quran text-2xl sm:text-3xl text-amber-300 font-bold tracking-wide">
          بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
        </div>

        {/* Header Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          <div 
            className="inline-flex items-center gap-2 px-5 py-1.5 rounded-full font-quran text-xs sm:text-sm font-extrabold shadow-lg border"
            style={effectiveStyle.customBadgeStyle || {
              backgroundColor: '#d97706',
              color: '#020617',
              borderColor: '#fbbf24',
            }}
          >
            {activeTheme ? (
              <InstituteLogo theme={activeTheme} className="w-4 h-4" iconClassName="w-4 h-4" />
            ) : (
              <Award className="w-4 h-4 text-slate-950" />
            )}
            <span>{badgeText}</span>
          </div>

          {/* Visual Lock/Open Status Indicator Badge */}
          <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full font-quran text-xs sm:text-sm font-black border shadow-lg transition-all ${
            isUnlocked 
              ? 'bg-emerald-950/90 text-emerald-300 border-emerald-400 ring-2 ring-emerald-500/30' 
              : 'bg-rose-950/90 text-rose-300 border-rose-500 ring-2 ring-rose-500/30 animate-pulse'
          }`}>
            {isUnlocked ? (
              <>
                <Unlock className="w-4 h-4 text-emerald-400" />
                <span>{lockDetails.badgeText}</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 text-rose-400" />
                <span>{lockDetails.badgeText}</span>
              </>
            )}
          </div>
        </div>

        {/* Locked Alert Box & WhatsApp Request Button if Locked */}
        {!isUnlocked && (
          <div className="bg-rose-950/70 border-2 border-rose-500/80 rounded-3xl p-5 max-w-xl mx-auto space-y-3.5 shadow-2xl backdrop-blur-sm animate-fadeIn">
            <div className="flex items-center justify-center gap-2 text-rose-300 font-bold font-quran text-sm sm:text-base">
              <ShieldAlert className="w-5 h-5 text-rose-400" />
              <span>هذه الحقيبة مقفلة وتحتاج تصريحاً من المعلم</span>
            </div>
            <p className="text-xs text-rose-200/90 font-tajawal leading-relaxed">
              {lockDetails.explanation} يمكنك إرسال طلب مباشر للمعلم عبر واتساب لفتح الحقيبة لحسابك فوراً.
            </p>
            <div className="pt-1 flex items-center justify-center">
              <WhatsAppUnlockRequestButton
                courseTitle={title}
                studentName={studentProfile?.name}
                size="md"
              />
            </div>
          </div>
        )}

        {/* Main Book Title */}
        <div className="space-y-4 max-w-4xl mx-auto">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black font-quran text-amber-200 leading-tight drop-shadow-md">
            {title}
          </h1>
          
          {/* Subtitle */}
          <p className="text-base sm:text-xl font-tajawal max-w-2xl mx-auto leading-relaxed border-y border-white/20 py-3 text-slate-100">
            {subtitle}
          </p>
        </div>

        {/* Author / Editor Block */}
        <div className="pt-4 pb-2">
          <div className="inline-block border-2 rounded-2xl px-8 py-4 shadow-xl text-center bg-black/40 backdrop-blur-md border-amber-400/60">
            <span className="block text-xs font-bold text-amber-300/90 font-quran mb-1">
              تأليف وتنسيق المنهج
            </span>
            <div className="text-xl sm:text-2xl font-black font-quran text-amber-100 flex items-center justify-center gap-2">
              <UserCheck className="w-6 h-6 text-amber-400" />
              <span>جمع وإعداد: {author}</span>
            </div>
          </div>
        </div>

        {/* Highlights / Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-right pt-4 max-w-5xl mx-auto">
          <div className="bg-white/5 border border-amber-400/20 rounded-2xl p-4 space-y-1.5 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-amber-300 font-bold font-quran text-sm">
              <Layers className="w-4 h-4 text-amber-400" />
              <span>{unitsCount} أبواب منهاجية</span>
            </div>
            <p className="text-xs text-slate-200/80 font-tajawal">
              تغطي كافة القواعد والتأصيل العلمي المعتمد بالتدرج.
            </p>
          </div>

          <div className="bg-white/5 border border-amber-400/20 rounded-2xl p-4 space-y-1.5 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-amber-300 font-bold font-quran text-sm">
              <Bookmark className="w-4 h-4 text-amber-400" />
              <span>خرائط تشجير مفاهيمية</span>
            </div>
            <p className="text-xs text-slate-200/80 font-tajawal">
              تشجير مرئي مباشر لكل درس لتيسير الفهم والحفظ السريع.
            </p>
          </div>

          <div className="bg-white/5 border border-amber-400/20 rounded-2xl p-4 space-y-1.5 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-amber-300 font-bold font-quran text-sm">
              <UserCheck className="w-4 h-4 text-amber-400" />
              <span>المنهج والتدريبات</span>
            </div>
            <p className="text-xs text-slate-200/80 font-tajawal">
              يتضمن نماذج التطبيقات وأمثلة التوجيه التلاوي القرآني.
            </p>
          </div>

          <div className="bg-white/5 border border-amber-400/20 rounded-2xl p-4 space-y-1.5 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-amber-300 font-bold font-quran text-sm">
              <Award className="w-4 h-4 text-amber-400" />
              <span>مختبر واختبار شامل</span>
            </div>
            <p className="text-xs text-slate-200/80 font-tajawal">
              أمثلة تحليلياً واختباراً نهائياً تفاعلياً للحصول على الشهادة.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="pt-6 flex flex-wrap items-center justify-center gap-4">
          {isUnlocked ? (
            <button
              onClick={onStartStudy}
              className="flex items-center gap-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black font-quran text-base sm:text-lg px-8 py-3.5 rounded-2xl shadow-xl transition-all hover:scale-105 cursor-pointer"
            >
              <BookOpen className="w-5 h-5 text-slate-950" />
              <span>تصفح أبواب المنهج التدريبي</span>
            </button>
          ) : (
            <div className="flex flex-wrap items-center justify-center gap-3">
              <WhatsAppUnlockRequestButton
                courseTitle={title}
                studentName={studentProfile?.name}
                size="lg"
              />
              <button
                onClick={onStartStudy}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold font-quran text-sm px-6 py-3 rounded-2xl border border-slate-700 cursor-pointer transition-all"
                title="معاينة محتوى الحقيبة"
              >
                <Lock className="w-4 h-4 text-slate-400" />
                <span>معاينة تفاصيل الحقيبة المقفلة</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

