import React from 'react';
import { Course } from '../types';
import { BookOpen, UserCheck, GraduationCap, Printer, Layers, Award, ShieldAlert, CheckCircle2, Bookmark, Lock, Unlock, MessageCircle } from 'lucide-react';
import { getCourseLockDetails } from '../utils/studentProgressStorage';
import { getStudentProfile } from '../utils/studentStorage';
import { WhatsAppUnlockRequestButton } from './WhatsAppSupport';

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
  const badge = course ? course.badge : 'الكتاب التدريبي المنهاجي المتكامل';

  const isIdgham = course?.id === 'idgham';
  const studentProfile = getStudentProfile();
  const lockDetails = getCourseLockDetails(course?.id || 'sakinan', isTeacherMode, course);
  const isUnlocked = lockDetails.isUnlocked;

  return (
    <div className="space-y-8">
      {/* Official Book Cover Card */}
      <div className={`relative overflow-hidden text-white rounded-3xl p-8 sm:p-14 border-4 shadow-2xl text-center space-y-8 ${
        isIdgham
          ? 'bg-gradient-to-b from-indigo-950 via-purple-950 to-slate-950 border-purple-400/80 shadow-purple-950/50'
          : 'bg-gradient-to-b from-emerald-950 via-slate-900 to-emerald-950 border-amber-400/80 shadow-2xl'
      }`}>
        
        {/* Islamic Ornament Background Glows */}
        <div className={`absolute -top-24 -left-24 w-72 h-72 rounded-full blur-3xl pointer-events-none ${isIdgham ? 'bg-purple-500/15' : 'bg-amber-500/10'}`}></div>
        <div className={`absolute -bottom-24 -right-24 w-72 h-72 rounded-full blur-3xl pointer-events-none ${isIdgham ? 'bg-indigo-500/15' : 'bg-emerald-500/10'}`}></div>

        {/* Decorative Top Border Frame */}
        <div className="flex items-center justify-center gap-3">
          <div className="h-0.5 w-16 sm:w-28 bg-gradient-to-r from-transparent via-amber-400 to-transparent"></div>
          <span className="text-amber-400 text-xs sm:text-sm font-bold font-quran tracking-widest uppercase">
            حقيبة تدريبية للأكاديميات والمعاهد القرآنية
          </span>
          <div className="h-0.5 w-16 sm:w-28 bg-gradient-to-r from-transparent via-amber-400 to-transparent"></div>
        </div>

        {/* Bismillah Header */}
        <div className="pt-2 font-quran text-2xl sm:text-3xl text-amber-300 font-bold tracking-wide">
          بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
        </div>

        {/* Header Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-slate-950 px-5 py-1.5 rounded-full font-quran text-xs sm:text-sm font-extrabold shadow-lg">
            <Award className="w-4 h-4 text-slate-950" />
            <span>{badge}</span>
          </div>

          {/* Visual Lock/Open Status Indicator Badge (Requirement) */}
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
          <p className={`text-base sm:text-xl font-tajawal max-w-2xl mx-auto leading-relaxed border-y py-3 ${
            isIdgham
              ? 'text-purple-100 border-purple-800/80'
              : 'text-emerald-200 border-emerald-800/80'
          }`}>
            {subtitle}
          </p>
        </div>

        {/* Author / Editor Block */}
        <div className="pt-4 pb-2">
          <div className={`inline-block border-2 rounded-2xl px-8 py-4 shadow-xl text-center ${
            isIdgham
              ? 'bg-purple-950/90 border-amber-400/60'
              : 'bg-emerald-900/90 border-amber-400/60'
          }`}>
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
          <div className="bg-white/5 border border-amber-400/20 rounded-2xl p-4 space-y-1.5">
            <div className="flex items-center gap-2 text-amber-300 font-bold font-quran text-sm">
              <Layers className="w-4 h-4 text-amber-400" />
              <span>{unitsCount} أبواب منهاجية</span>
            </div>
            <p className="text-xs text-emerald-200/80 font-tajawal">
              تغطي كافة القواعد والتأصيل العلمي المعتمد بالتدرج.
            </p>
          </div>

          <div className="bg-white/5 border border-amber-400/20 rounded-2xl p-4 space-y-1.5">
            <div className="flex items-center gap-2 text-amber-300 font-bold font-quran text-sm">
              <Bookmark className="w-4 h-4 text-amber-400" />
              <span>خرائط تشجير مفاهيمية</span>
            </div>
            <p className="text-xs text-emerald-200/80 font-tajawal">
              تشجير مرئي مباشر لكل درس لتيسير الفهم والحفظ السريع.
            </p>
          </div>

          <div className="bg-white/5 border border-amber-400/20 rounded-2xl p-4 space-y-1.5">
            <div className="flex items-center gap-2 text-amber-300 font-bold font-quran text-sm">
              <UserCheck className="w-4 h-4 text-amber-400" />
              <span>المنهج والتدريبات</span>
            </div>
            <p className="text-xs text-emerald-200/80 font-tajawal">
              يتضمن نماذج التطبيقات وأمثلة التوجيه التلاوي القرآني.
            </p>
          </div>

          <div className="bg-white/5 border border-amber-400/20 rounded-2xl p-4 space-y-1.5">
            <div className="flex items-center gap-2 text-amber-300 font-bold font-quran text-sm">
              <Award className="w-4 h-4 text-amber-400" />
              <span>مختبر واختبار شامل</span>
            </div>
            <p className="text-xs text-emerald-200/80 font-tajawal">
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
