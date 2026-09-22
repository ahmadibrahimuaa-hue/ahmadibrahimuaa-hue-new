import React, { useState } from 'react';
import { Course, StudentProfile } from '../types';
import { getAllCourses } from '../data/courses';
import { getStudentProgress, calculateProgressPercentage, isCourseUnlocked, isCoursePassed, getCourseLockDetails } from '../utils/studentProgressStorage';
import { 
  Sparkles, BookOpen, GraduationCap, Award, CheckCircle2, ArrowLeft, 
  Trophy, ShieldCheck, Lock, Unlock, AlertTriangle, Layers, X, Briefcase, 
  DollarSign, Gift, Search, Share2, LogOut, User, FolderTree
} from 'lucide-react';
import { WhatsAppSupport, WhatsAppUnlockRequestButton } from './WhatsAppSupport';

interface PlatformHomeProps {
  onSelectCourse: (courseId: string) => void;
  onOpenTeacherDashboard: () => void;
  onOpenProgressModal: () => void;
  onOpenBagManagement?: () => void;
  onOpenSearch?: () => void;
  onOpenShareModal?: () => void;
  onLogout?: () => void;
  studentProfile?: StudentProfile | null;
  isTeacherMode?: boolean;
}

export const PlatformHome: React.FC<PlatformHomeProps> = ({
  onSelectCourse,
  onOpenTeacherDashboard,
  onOpenProgressModal,
  onOpenBagManagement,
  onOpenSearch,
  onOpenShareModal,
  onLogout,
  studentProfile,
  isTeacherMode = false,
}) => {
  const [lockedCourseModal, setLockedCourseModal] = useState<string | null>(null);

  const courses = getAllCourses();

  const handleCourseClick = (course: Course) => {
    const unlocked = isCourseUnlocked(course.id, isTeacherMode, course);
    if (!unlocked) {
      setLockedCourseModal(course.id);
    } else {
      onSelectCourse(course.id);
    }
  };

  const selectedLockedCourse = courses.find((c) => c.id === lockedCourseModal);
  const isSakinanDone = isCoursePassed('sakinan');

  return (
    <div className="space-y-8 animate-fadeIn font-tajawal dir-rtl">
      {/* Platform Banner Header */}
      <div className="bg-gradient-to-br from-emerald-950 via-emerald-900 to-slate-900 text-white rounded-3xl p-6 sm:p-10 border-2 border-amber-400/40 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-emerald-400 to-amber-400"></div>
        <div className="absolute -top-16 -left-16 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-4xl space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-amber-400 text-slate-950 text-xs font-black px-3 py-1 rounded-full font-quran shadow-sm flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              <span>المنصة التفاعلية الموحدة للحقائب التجويدية</span>
            </span>
            <span className="bg-emerald-900/80 text-emerald-200 border border-emerald-700 text-xs font-bold px-3 py-1 rounded-full font-quran">
              جمع وإعداد: أحمد إبراهيم
            </span>
            {isTeacherMode && (
              <span className="bg-amber-500/20 text-amber-300 border border-amber-400/40 text-xs font-bold px-3 py-1 rounded-full font-quran flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>وضع المعلم مفعل (كافة الحقائب متاحة)</span>
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-4xl font-black font-quran text-amber-100 leading-tight">
            المناهج التعليمية المقررة لمادة التجويد والقراءات
          </h1>

          <p className="text-xs sm:text-base text-emerald-100/90 leading-relaxed font-medium">
            مرحباً بك في المنصة المعتمدة. تبدأ الرحلة الدراسية بالحقيبة الأولى (التقاء الساكنين)، وعقب اجتياز اختبارها الشامل بنسبة 90% فأكثر، تفتح تلقائياً الحقيبة الثانية (أحكام الإدغام: المثلين والمتجانسين والمتقاربين).
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3 text-xs font-quran">
            <button
              onClick={onOpenProgressModal}
              className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Trophy className="w-4 h-4 text-slate-950" />
              <span>عرض لوحة تقدم الطالب في كافة الدورات</span>
            </button>

            {onOpenShareModal && (
              <button
                onClick={onOpenShareModal}
                className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                title="مشاركة إنجازك وتقدمك الدراسي على وسائل التواصل الاجتماعي"
              >
                <Share2 className="w-4 h-4 text-slate-950 fill-current" />
                <span>مشاركة الإنجاز والتقدم 🚀</span>
              </button>
            )}

            {onOpenSearch && (
              <button
                onClick={onOpenSearch}
                className="bg-emerald-800/90 hover:bg-emerald-700 text-amber-200 border border-emerald-600/80 font-bold px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                title="البحث السريع عن كلمات وشواهد ودروس داخل حقيبة التقاء الساكنين"
              >
                <Search className="w-4 h-4 text-amber-300" />
                <span>البحث في حقيبة التقاء الساكنين 🔍</span>
              </button>
            )}

            <button
              onClick={onOpenTeacherDashboard}
              className="bg-emerald-900/90 hover:bg-emerald-800 text-emerald-100 border border-emerald-700 font-bold px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-amber-300" />
              <span>لوحة المعلم وإدارة الشهادات</span>
            </button>

            {onOpenBagManagement && (
              <button
                onClick={onOpenBagManagement}
                className="bg-slate-900/90 hover:bg-slate-800 text-amber-300 border border-amber-400/50 font-bold px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Briefcase className="w-4 h-4 text-amber-400" />
                <span>إدارة الحقائب والدروس والأسعار ⚙️</span>
              </button>
            )}

            {studentProfile?.name && onLogout && (
              <button
                onClick={onLogout}
                className="bg-red-950/70 hover:bg-red-900 text-red-200 border border-red-500/40 font-bold px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer text-xs"
                title="تسجيل الخروج من حساب الطالب"
              >
                <LogOut className="w-4 h-4 text-red-400" />
                <span>تسجيل الخروج ({studentProfile.name})</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Courses Grid Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-emerald-800" />
            <h2 className="text-xl sm:text-2xl font-black font-quran text-slate-900">
              الدورات والحقائب التجويدية المتاحة
            </h2>
          </div>
          <span className="text-xs font-bold text-slate-500 font-quran">
            ({courses.length}) حقائب منهجية
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {courses.map((course) => {
            const prog = getStudentProgress(course.id);
            const totalUnits = course.units && course.units.length > 0 ? course.units.length : 3;
            const pct = calculateProgressPercentage(prog, totalUnits);
            const isCompleted = prog.examCompleted && (prog.examBestScore || 0) >= 90;
            const isIdgham = course.id === 'idgham';
            const isComingSoon = course.status === 'coming_soon';
            const isPaid = course.pricing?.isPaid ?? false;
            const lockDetails = getCourseLockDetails(course.id, isTeacherMode, course);
            const unlocked = lockDetails.isUnlocked;
            const parentCourse = course.parentCourseId ? courses.find(c => c.id === course.parentCourseId) : null;

            return (
              <div
                key={course.id}
                className={`rounded-3xl p-6 sm:p-7 border-2 shadow-md hover:shadow-2xl transition-all flex flex-col justify-between space-y-6 relative overflow-hidden group ${
                  isComingSoon
                    ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-slate-300 border-indigo-900/60 hover:border-amber-400/50'
                    : isPaid && !unlocked
                      ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-slate-300 border-amber-500/40 hover:border-amber-400'
                      : isIdgham
                        ? unlocked
                          ? 'bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 text-white border-purple-500/50 hover:border-amber-400'
                          : 'bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 text-slate-300 border-slate-700/60 opacity-95'
                        : 'bg-white text-slate-900 border-slate-200 hover:border-amber-400'
                }`}
              >
                {/* Visual Glow */}
                {(isIdgham || isComingSoon || (isPaid && !unlocked)) && (
                  <div className="absolute -top-20 -left-20 w-56 h-56 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>
                )}

                {/* Course Header & Badge */}
                <div className="space-y-4 relative z-10">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-xs font-extrabold px-3 py-1 rounded-full font-quran border ${
                        isComingSoon
                          ? 'bg-purple-950/80 text-purple-200 border-purple-500/40'
                          : isPaid && !unlocked
                            ? 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                            : isIdgham
                              ? unlocked
                                ? 'bg-purple-900/90 text-purple-100 border-purple-400/50'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                              : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                      }`}>
                        {course.badge}
                      </span>

                      {/* Parent Course Badge for Nested Structure */}
                      {parentCourse && (
                        <span className="bg-indigo-950/80 text-indigo-300 border border-indigo-500/40 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 font-quran">
                          <FolderTree className="w-3 h-3 text-indigo-400" />
                          <span>فرعية تابعة: {parentCourse.title}</span>
                        </span>
                      )}
                    </div>

                    {/* Official Dynamic Lock / Unlock Badge */}
                    <span className={`text-xs font-bold px-3 py-1 rounded-full font-quran flex items-center gap-1.5 shadow-xs border ${lockDetails.badgeClass}`}>
                      {unlocked ? (
                        <Unlock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : (
                        <Lock className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      )}
                      <span>{lockDetails.badgeText}</span>
                    </span>
                  </div>

                  <div>
                    <h3 className={`text-xl sm:text-2xl font-black font-quran transition-colors ${
                      isComingSoon
                        ? 'text-purple-200 group-hover:text-amber-200'
                        : isPaid && !unlocked
                          ? 'text-amber-200 group-hover:text-amber-300'
                          : isIdgham
                            ? unlocked ? 'text-amber-200 group-hover:text-amber-300' : 'text-slate-300'
                            : 'text-slate-900 group-hover:text-emerald-900'
                    }`}>
                      {isComingSoon || (isPaid && !unlocked) || !unlocked ? '🔒' : isIdgham ? '✨' : '📚'} {course.title}
                    </h3>
                    <p className={`text-xs sm:text-sm mt-1.5 leading-relaxed font-medium ${
                      isComingSoon
                        ? 'text-slate-400'
                        : isPaid && !unlocked
                          ? 'text-slate-300'
                          : isIdgham ? (unlocked ? 'text-purple-100/90' : 'text-slate-400') : 'text-slate-600'
                    }`}>
                      {course.description}
                    </p>
                  </div>

                  {/* Course Quick Highlights */}
                  <div className={`p-4 rounded-2xl border text-xs font-quran grid grid-cols-2 sm:grid-cols-3 gap-2 ${
                    isComingSoon || (isPaid && !unlocked)
                      ? 'bg-slate-900/80 border-indigo-950 text-slate-400'
                      : isIdgham
                        ? unlocked
                          ? 'bg-indigo-900/60 border-purple-800/60 text-purple-100'
                          : 'bg-slate-900/80 border-slate-800 text-slate-400'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}>
                    <div className="flex items-center gap-1.5 font-bold">
                      <Layers className={`w-4 h-4 ${isComingSoon ? 'text-purple-400' : isIdgham ? 'text-amber-300' : 'text-emerald-800'}`} />
                      <span>{course.units && course.units.length > 0 ? `${course.units.length} أبواب تعليمية` : 'أبواب تخصصية'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-bold">
                      <GraduationCap className={`w-4 h-4 ${isComingSoon ? 'text-purple-400' : isIdgham ? 'text-purple-300' : 'text-amber-600'}`} />
                      <span>{isComingSoon ? 'قائمة انتظار' : 'تدريبات ومختبر'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-bold">
                      <Award className={`w-4 h-4 ${isComingSoon ? 'text-amber-400' : isIdgham ? 'text-amber-400' : 'text-purple-700'}`} />
                      <span>شهادة معتمدة</span>
                    </div>
                  </div>
                </div>

                {/* Course Progress & Action */}
                <div className={`space-y-4 pt-2 border-t relative z-10 ${
                  isComingSoon || (isPaid && !unlocked) ? 'border-slate-800' : isIdgham ? (unlocked ? 'border-purple-900/60' : 'border-slate-800') : 'border-slate-100'
                }`}>
                  {!isComingSoon && (!isPaid || unlocked) && (
                    <div className="space-y-1.5">
                      <div className={`flex items-center justify-between text-xs font-bold font-quran flex-wrap gap-1 ${
                        isIdgham ? (unlocked ? 'text-purple-200' : 'text-slate-400') : 'text-slate-700'
                      }`}>
                        <div className="flex items-center gap-1.5">
                          <span>التقدم الدراسي:</span>
                          <span className={`font-sans font-bold ${isIdgham ? 'text-amber-300' : 'text-emerald-800'}`}>{pct}%</span>
                        </div>
                        
                        <div className="flex items-center gap-1.5">
                          {course.id === 'sakinan' && onOpenSearch && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenSearch();
                              }}
                              className={`px-2 py-0.5 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all border ${
                                isIdgham
                                  ? 'bg-purple-900/60 hover:bg-purple-800 text-purple-200 border-purple-700'
                                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                              }`}
                              title="بحث سريع في شواهد ودروس حقيبة التقاء الساكنين"
                            >
                              <Search className="w-3 h-3" />
                              <span>بحث الشواهد</span>
                            </button>
                          )}
                          {onOpenShareModal && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenShareModal();
                              }}
                              className={`px-2 py-0.5 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all border ${
                                isIdgham
                                  ? 'bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 border-amber-400/40'
                                  : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
                              }`}
                              title="مشاركة إنجاز وتقدم هذه الحقيبة على وسائل التواصل"
                            >
                              <Share2 className="w-3 h-3" />
                              <span>مشاركة الإنجاز</span>
                            </button>
                          )}
                        </div>
                      </div>
                      <div className={`w-full h-2.5 rounded-full overflow-hidden border ${
                        isIdgham ? 'bg-indigo-950 border-purple-900' : 'bg-slate-100 border-slate-200'
                      }`}>
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isIdgham
                              ? 'bg-gradient-to-r from-purple-500 via-amber-400 to-yellow-300'
                              : 'bg-gradient-to-r from-amber-500 to-emerald-700'
                          }`}
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      if (isComingSoon) {
                        onSelectCourse(course.id);
                      } else {
                        handleCourseClick(course);
                      }
                    }}
                    className={`w-full font-bold font-quran py-3.5 px-5 rounded-2xl text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer border ${
                      isComingSoon
                        ? 'bg-purple-900/80 hover:bg-purple-800 text-purple-200 border-purple-700'
                        : isPaid && !unlocked
                          ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-amber-500/50 shadow-none'
                          : !unlocked
                            ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700 shadow-none'
                            : isIdgham
                              ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 border-amber-300 shadow-purple-900/30'
                              : 'bg-emerald-900 hover:bg-emerald-950 text-amber-300 border-amber-400/30 group-hover:bg-amber-400 group-hover:text-slate-950 group-hover:border-amber-300'
                    }`}
                  >
                    {isComingSoon ? (
                      <>
                        <Lock className="w-4 h-4 text-purple-400" />
                        <span>معاينة الحقيبة وحجز المقعد (قريباً)</span>
                      </>
                    ) : isPaid && !unlocked ? (
                      <>
                        <Lock className="w-4 h-4 text-amber-400" />
                        <span>الحقيبة مدفوعة ومقفلة (عرض التفاصيل)</span>
                      </>
                    ) : !unlocked ? (
                      <>
                        <Lock className="w-4 h-4 text-amber-400" />
                        <span>الحقيبة مقفلة من المعلم (طلب الفتح)</span>
                      </>
                    ) : (
                      <>
                        <span>{pct > 0 ? 'متابعة دراسة الدورة' : 'دخول الدورة والبدء الآن'}</span>
                        <ArrowLeft className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  {/* Direct WhatsApp Unlock Request Button on Card if Locked */}
                  {!unlocked && (
                    <div className="pt-1">
                      <WhatsAppUnlockRequestButton
                        courseTitle={course.title}
                        studentName={studentProfile?.name}
                        size="sm"
                        className="w-full justify-center"
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* WhatsApp Support Section Card */}
      <WhatsAppSupport variant="card" />

      {/* Course Lock Alert Modal */}
      {lockedCourseModal && selectedLockedCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white text-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 border-2 border-amber-400 shadow-2xl space-y-6 text-right relative">
            <button
              onClick={() => setLockedCourseModal(null)}
              className="absolute top-4 left-4 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center shrink-0">
                <Lock className="w-6 h-6 text-amber-700" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-black font-quran text-slate-950">
                  {selectedLockedCourse.title} 🔒
                </h3>
                <p className="text-xs font-bold text-amber-800 font-quran">
                  {selectedLockedCourse.badge || 'حقيبة تدريبية تخصصية'}
                </p>
              </div>
            </div>

            <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 text-xs sm:text-sm text-slate-800 space-y-2.5 leading-relaxed font-tajawal">
              <p className="font-bold text-amber-950 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>حالة الوصول للحقيبة:</span>
              </p>

              {selectedLockedCourse.pricing?.isPaid ? (
                <div className="space-y-2">
                  <p>
                    هذه الحقيبة <strong>محتوى مدفوع ({selectedLockedCourse.pricing.priceText || 'اشتراك خاص'})</strong> ومقفلة حالياً.
                  </p>
                  <div className="p-3 bg-amber-100/80 rounded-xl border border-amber-300 text-xs text-amber-950 font-bold space-y-1">
                    <p>✨ لا تفتح الدروس والوحدات والاختبار إلا بعد موافقة المعلم واعتماد الوصول.</p>
                    <p className="text-slate-700 font-normal">يمكنك معاينة تفاصيل محاور الحقيبة، والتواصل مع المعلم للاشتراك.</p>
                  </div>
                </div>
              ) : selectedLockedCourse.id === 'idgham' ? (
                <div className="space-y-2">
                  <p>
                    عزيزي الطالب، طبقاً للمنهاج التعليمي المعتمد، تُفتح هذه الحقيبة تلقائياً بعد <strong>إتمام ودراسة الحقيبة الأولى (التقاء الساكنين)</strong> واجتياز اختبارها النهائي الشامل بنسبة <strong>90% فأكثر</strong>.
                  </p>
                  <div className="pt-2 border-t border-amber-200/80 flex items-center justify-between text-xs font-quran font-bold text-slate-700">
                    <span>حالة حقيبة التقاء الساكنين لديك:</span>
                    <span className={isSakinanDone ? 'text-emerald-700 font-black' : 'text-amber-800 font-black'}>
                      {isSakinanDone ? 'تم الاجتياز بنجاح ✓' : 'لم يتم اجتياز الاختبار بعد'}
                    </span>
                  </div>
                </div>
              ) : selectedLockedCourse.status === 'coming_soon' ? (
                <p>
                  هذه الحقيبة قيد الإعداد والإطلاق قريباً. يمكنك معاينة أهدافها والانضمام لقائمة الانتظار لحجز مقعدك أولاً بأول.
                </p>
              ) : (
                <p>
                  هذه الحقيبة مغلقة حالياً وتتطلب إذن المعلم أو تفعيلها من لوحة الإدارة.
                </p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <WhatsAppUnlockRequestButton
                courseTitle={selectedLockedCourse.title}
                studentName={studentProfile?.name}
                size="md"
                className="flex-1 justify-center"
              />
              <button
                onClick={() => {
                  setLockedCourseModal(null);
                  onSelectCourse(selectedLockedCourse.id);
                }}
                className="flex-1 bg-emerald-900 hover:bg-emerald-950 text-amber-300 font-bold font-quran py-3 px-4 rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer border border-amber-400/40"
              >
                <span>معاينة تفاصيل ومحاور الحقيبة</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setLockedCourseModal(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold font-quran py-3 px-4 rounded-xl text-sm transition-all cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
