import React, { useState, useEffect } from 'react';
import { Course } from '../types';
import { 
  Sparkles, Lock, ArrowRight, CheckCircle2, Clock, 
  GraduationCap, BookOpen, Layers, Award, Star, 
  MessageCircle, ExternalLink, ShieldCheck, Bookmark, ChevronLeft
} from 'lucide-react';
import { WhatsAppSupport } from './WhatsAppSupport';
import { isStudentInWaitlist, joinCourseWaitlist } from '../utils/waitlistStorage';

interface LockedCoursePreviewProps {
  course: Course;
  onReturnToActiveCourse: (courseId?: string) => void;
  onReturnToHome: () => void;
  isTeacherMode?: boolean;
}

export const LockedCoursePreview: React.FC<LockedCoursePreviewProps> = ({
  course,
  onReturnToActiveCourse,
  onReturnToHome,
  isTeacherMode = false,
}) => {
  const [inWaitlist, setInWaitlist] = useState<boolean>(() => isStudentInWaitlist(course.id));
  const [showSuccessBanner, setShowSuccessBanner] = useState<boolean>(false);
  const [phoneNumber, setPhoneNumber] = useState<string>('');

  useEffect(() => {
    setInWaitlist(isStudentInWaitlist(course.id));
    setShowSuccessBanner(false);
  }, [course.id]);

  const handleJoinWaitlist = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    joinCourseWaitlist(course.id, course.title, phoneNumber);
    setInWaitlist(true);
    setShowSuccessBanner(true);
  };

  const isComingSoon = course.status === 'coming_soon';
  const pricingText = course.pricing?.priceText || (isComingSoon ? 'قريباً - محتوى تدريبي مدفوع ومعتمد' : 'محتوى تخصصي مغلق');

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn font-tajawal dir-rtl">
      
      {/* Return & Breadcrumb Bar */}
      <div className="flex items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm no-print">
        <button
          onClick={() => onReturnToActiveCourse('sakinan')}
          className="inline-flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-400 hover:text-emerald-950 dark:hover:text-emerald-300 font-quran transition-colors cursor-pointer"
        >
          <ArrowRight className="w-4 h-4" />
          <span>العودة للحقيبة المتاحة حالياً (التقاء الساكنين)</span>
        </button>

        <button
          onClick={onReturnToHome}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-quran transition-colors cursor-pointer"
        >
          <span>شاشة الحقائب الرئيسية</span>
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Main Locked / Coming Soon Card Container */}
      <div className="bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-10 border-2 border-amber-400/50 shadow-2xl relative overflow-hidden">
        {/* Glow & Top Accent */}
        <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-amber-400 via-purple-500 to-amber-400"></div>
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 space-y-8">
          
          {/* Header Badges */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-amber-400 text-slate-950 text-xs font-black px-3.5 py-1 rounded-full font-quran shadow-sm flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                <span>معاينة الحقيبة (مغلقة حالياً)</span>
              </span>
              
              <span className="bg-purple-900/90 text-purple-200 border border-purple-400/40 text-xs font-bold px-3 py-1 rounded-full font-quran">
                {course.badge}
              </span>

              {course.levelText && (
                <span className="bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 text-xs font-bold px-3 py-1 rounded-full font-quran">
                  {course.levelText}
                </span>
              )}
            </div>

            <div className="bg-amber-500/20 text-amber-300 border border-amber-400/40 px-3.5 py-1 rounded-full text-xs font-bold font-quran flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>{pricingText}</span>
            </div>
          </div>

          {/* Title & Description */}
          <div className="space-y-3">
            <h1 className="text-2xl sm:text-4xl font-black font-quran text-amber-100 leading-tight">
              {course.title}
            </h1>
            <p className="text-sm sm:text-base text-slate-200 leading-relaxed max-w-3xl font-medium">
              {course.description}
            </p>
            <div className="flex items-center gap-2 text-xs text-amber-300 font-quran pt-1">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>إعداد وتأصيل: {course.author}</span>
              {course.expectedDuration && (
                <>
                  <span className="text-slate-500">•</span>
                  <span>المدة المقررة: {course.expectedDuration}</span>
                </>
              )}
            </div>
          </div>

          {/* Pricing & Subscription Notice Box */}
          <div className="bg-slate-900/90 border-2 border-amber-400/40 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-amber-300 font-black font-quran text-sm">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>حالة المحتوى وحجز المقاعد:</span>
            </div>
            
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              هذه الحقيبة حالياً قيد التطوير الميداني التخصصي وتندرج ضمن المسار الأكاديمي المدفوع للمنصة. يمكنك تسجيل رغبتك الآن للانضمام إلى <strong>قائمة الانتظار</strong> للحصول على إشعار فوري عند الإطلاق وأولوية الحجز مع خصم خاص للمجتازين.
            </p>

            {course.pricing?.note && (
              <div className="text-xs text-emerald-300 font-bold bg-emerald-950/60 p-2.5 rounded-xl border border-emerald-700/60 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{course.pricing.note}</span>
              </div>
            )}
          </div>

          {/* Preview Highlights / Expected Units */}
          {course.previewHighlights && course.previewHighlights.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-amber-300 font-bold font-quran text-sm">
                <Layers className="w-4 h-4 text-amber-400" />
                <span>أبرز محاور وأبواب هذه الحقيبة:</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {course.previewHighlights.map((hl, i) => (
                  <div key={i} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-2 hover:border-amber-400/50 transition-colors">
                    {hl.badge && (
                      <span className="inline-block bg-purple-900/80 text-purple-200 text-[10px] font-bold px-2 py-0.5 rounded-md font-quran">
                        {hl.badge}
                      </span>
                    )}
                    <h4 className="text-xs font-black font-quran text-slate-100 leading-snug">
                      {hl.title}
                    </h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {hl.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Academic Features */}
          {course.features && course.features.length > 0 && (
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 space-y-2.5">
              <div className="text-xs font-bold text-slate-300 font-quran">
                المميزات المضمنة في هذه الحقيبة:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300 font-quran">
                {course.features.map((feat, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Waitlist & Call To Action Form */}
          <div className="pt-4 border-t border-slate-800 space-y-4">
            {showSuccessBanner && (
              <div className="bg-emerald-900/90 text-emerald-100 border border-emerald-400 p-4 rounded-2xl flex items-center gap-3 animate-fadeIn">
                <CheckCircle2 className="w-6 h-6 text-emerald-300 shrink-0" />
                <div className="text-xs space-y-0.5">
                  <div className="font-black font-quran text-sm">تم تسجيلك بنجاح في قائمة الانتظار!</div>
                  <div>سيتم إرسال إشعار لك فور إتاحة الحقيبة واعتماد التسجيل.</div>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {inWaitlist ? (
                <div className="flex items-center gap-2 bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 px-4 py-2.5 rounded-2xl text-xs font-bold font-quran">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>أنت مسجل بالفعل في قائمة انتظار هذه الحقيبة</span>
                </div>
              ) : (
                <button
                  onClick={handleJoinWaitlist}
                  className="w-full sm:w-auto bg-amber-400 hover:bg-amber-300 text-slate-950 font-black font-quran text-xs px-6 py-3 rounded-2xl shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Bookmark className="w-4 h-4 text-slate-950 fill-slate-950" />
                  <span>الانضمام لقائمة الانتظار وحجز المقعد</span>
                </button>
              )}

              <div className="flex items-center gap-3 flex-wrap justify-center w-full sm:w-auto">
                {/* WhatsApp Support Direct Contact */}
                <WhatsAppSupport variant="button" customText="تواصل معنا للاستفسار والحجز" />

                {/* Return Button */}
                <button
                  onClick={() => onReturnToActiveCourse('sakinan')}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-4 py-2.5 rounded-2xl border border-slate-700 font-quran transition-all cursor-pointer"
                >
                  العودة للحقيبة الأولى المتاحة
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
