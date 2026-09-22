import React from 'react';
import { Course } from '../types';
import { getAllCourses } from '../data/courses';
import { isCourseUnlocked } from '../utils/studentProgressStorage';
import { 
  BookOpen, GraduationCap, Table, HelpCircle, Bookmark, Printer, Book, 
  ShieldAlert, Award, Layers, UserCheck, Lock, Users, ShieldCheck, Moon, 
  Sun, Trophy, Grid, ChevronDown, Briefcase, PlusCircle, Type, BookMarked,
  Search, Share2, LogOut, User
} from 'lucide-react';
import { WhatsAppSupport } from './WhatsAppSupport';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activeCourse: Course;
  onSelectCourse: (courseId: string) => void;
  onReturnToHome: () => void;
  isExamActive?: boolean;
  isTeacherMode: boolean;
  setIsTeacherMode: (val: boolean) => void;
  onUnlockTeacherModal: () => void;
  onOpenTeacherDashboard: () => void;
  onOpenCertificateEditor?: () => void;
  onOpenBagManagement?: () => void;
  onOpenFontModal?: () => void;
  onOpenSearch?: () => void;
  onOpenShareModal?: () => void;
  onLogoutStudent?: () => void;
  studentName?: string;
  isNightMode: boolean;
  setIsNightMode: (val: boolean) => void;
  onOpenProgressModal: () => void;
  progressPercentage: number;
  completedUnitsCount?: number;
}

export const Header: React.FC<HeaderProps> = ({ 
  activeTab, 
  setActiveTab, 
  activeCourse,
  onSelectCourse,
  onReturnToHome,
  isExamActive = false,
  isTeacherMode, 
  setIsTeacherMode,
  onUnlockTeacherModal,
  onOpenTeacherDashboard,
  onOpenCertificateEditor,
  onOpenBagManagement,
  onOpenFontModal,
  onOpenSearch,
  onOpenShareModal,
  onLogoutStudent,
  studentName,
  isNightMode,
  setIsNightMode,
  onOpenProgressModal,
  progressPercentage,
  completedUnitsCount = 0,
}) => {
  const [showCourseDropdown, setShowCourseDropdown] = React.useState(false);

  const navItems = [
    { id: 'cover', label: 'غلاف الحقيبة', icon: Book, count: 'غلاف رسمي' },
    { id: 'units', label: 'الكتاب التدريبي (الأبواب الخمسة)', icon: BookOpen, count: `${activeCourse.units.length} أبواب` },
    { id: 'exceptions', label: 'الكلمات المستثناة', icon: BookMarked, count: 'حفص والقراء' },
    { id: 'examples', label: 'المختبر القرآني للأمثلة', icon: GraduationCap, count: `${activeCourse.quranExamples.length}+ مثالاً` },
    { id: 'errors', label: 'أخطاء القراء والتصحيح', icon: ShieldAlert, count: 'ميداني' },
    { id: 'summary', label: 'جدول المقارنة الشامل', icon: Table, count: 'جميع الطرق' },
    { id: 'exam', label: 'الاختبار النهائي الشامل', icon: Award, count: 'اختبار' },
    { id: 'rules', label: 'دليل الأحكام السريع (CheatSheet)', icon: Bookmark, count: 'بحث وتصفية' },
    { id: 'books', label: 'المراجع والمصادر العلمية', icon: Book, count: 'أمهات الكتب' },
  ];

  const isIdgham = activeCourse.id === 'idgham';

  return (
    <header className={`${isIdgham ? 'bg-indigo-950 border-b border-indigo-900/90' : 'bg-emerald-950 border-b border-emerald-800'} text-white shadow-xl sticky top-0 z-40 no-print transition-colors duration-300`}>
      {/* Top Banner Accent */}
      <div className={isIdgham ? 'bg-gradient-to-r from-amber-400 via-purple-500 to-indigo-500 h-1.5 w-full' : 'bg-gradient-to-r from-amber-500 via-emerald-500 to-amber-500 h-1.5 w-full'}></div>

      {/* Mode Switcher Banner */}
      <div className={`${isIdgham ? 'bg-slate-950 border-b border-indigo-900/80' : 'bg-slate-900 border-b border-emerald-800/80'} px-4 py-2 text-xs font-tajawal transition-colors duration-300`}>
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          
          {/* Active Mode Identifier & Home Switcher */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={onReturnToHome}
              className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black px-3 py-1 rounded-full text-xs font-quran transition-all flex items-center gap-1 shadow-sm cursor-pointer"
              title="العودة لشاشة الرئيسية واختيار الحقائب"
            >
              <Grid className="w-3.5 h-3.5 text-slate-950" />
              <span>المنصة الرئيسية للدورات</span>
            </button>

            {isTeacherMode ? (
              <div className="flex items-center gap-2 bg-amber-400/20 text-amber-300 border border-amber-400/40 px-3 py-1 rounded-full font-bold font-quran text-xs">
                <UserCheck className="w-4 h-4 text-amber-300" />
                <span>واجهة المعلم والمدرب مفعّلة</span>
              </div>
            ) : (
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full border font-bold font-quran text-xs ${
                isIdgham
                  ? 'bg-purple-900/80 text-purple-100 border-purple-700'
                  : 'bg-emerald-900/90 text-emerald-100 border-emerald-700'
              }`}>
                <Users className="w-4 h-4 text-amber-300" />
                <span>واجهة الطالب التفاعلية</span>
              </div>
            )}
          </div>

          {/* Switch Portal & Theme Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* WhatsApp Support Button */}
            <WhatsAppSupport variant="button" />

            {/* Academic Progress Button */}
            <button
              onClick={onOpenProgressModal}
              className={`text-xs font-bold px-3 py-1 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer font-quran border ${
                isIdgham
                  ? 'bg-purple-900/80 hover:bg-purple-800 text-amber-300 border-purple-700'
                  : 'bg-emerald-900/90 hover:bg-emerald-800 text-amber-300 border-emerald-700'
              }`}
              title="عرض سجل وإنجاز التقدم الدراسي"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>التقدم الدراسي ({progressPercentage}%)</span>
            </button>

            {/* Search Sakinan Course Button */}
            {onOpenSearch && (
              <button
                onClick={onOpenSearch}
                className={`text-xs font-bold px-3 py-1 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer font-quran border ${
                  isIdgham
                    ? 'bg-purple-900/80 hover:bg-purple-800 text-amber-200 border-purple-700'
                    : 'bg-emerald-900/90 hover:bg-emerald-800 text-amber-300 border-emerald-700'
                }`}
                title="البحث السريع في شواهد ودروس وأمثلة حقيبة التقاء الساكنين"
              >
                <Search className="w-3.5 h-3.5 text-amber-400" />
                <span>بحث الحقيبة 🔍</span>
              </button>
            )}

            {/* Share Achievement Button */}
            {onOpenShareModal && (
              <button
                onClick={onOpenShareModal}
                className="bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black px-3 py-1 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer font-quran shadow-sm"
                title="مشاركة إنجازك وتقدمك الدراسي على وسائل التواصل الاجتماعي"
              >
                <Share2 className="w-3.5 h-3.5 text-slate-950 fill-current" />
                <span>مشاركة</span>
              </button>
            )}

            {/* Student Logout Button */}
            {studentName && onLogoutStudent && !isTeacherMode && (
              <button
                onClick={onLogoutStudent}
                className="bg-red-950/80 hover:bg-red-900 text-red-200 border border-red-500/50 text-xs font-bold px-2.5 py-1 rounded-xl transition-all flex items-center gap-1 cursor-pointer font-quran"
                title="تسجيل الخروج من الحساب"
              >
                <LogOut className="w-3.5 h-3.5 text-red-400" />
                <span>خروج</span>
              </button>
            )}

            {/* Quran Font Customizer Button */}
            {onOpenFontModal && (
              <button
                onClick={onOpenFontModal}
                className="bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-bold px-3 py-1 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer font-quran"
                title="تخصيص وتبديل نوع خط المصحف الشريف"
              >
                <Type className="w-3.5 h-3.5 text-amber-400" />
                <span>خط المصحف</span>
              </button>
            )}

            {/* Night / Dark Reading Mode Toggle */}
            <button
              onClick={() => setIsNightMode(!isNightMode)}
              className={`text-xs font-bold px-3 py-1 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer font-quran border ${
                isNightMode
                  ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-sm'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
              title={isNightMode ? 'التحويل للوضع النهاري' : 'التحويل لوضع القراءة الليلي مريح العينين'}
            >
              {isNightMode ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-slate-950 fill-slate-950" />
                  <span>النهار</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-amber-300" />
                  <span>الليل</span>
                </>
              )}
            </button>

            {isTeacherMode ? (
              <>
                <button
                  onClick={onOpenTeacherDashboard}
                  className="bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold px-3 py-1 rounded-xl font-quran shadow-sm transition-all flex items-center gap-1 cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>لوحة المعلم</span>
                </button>

                <button
                  onClick={onOpenBagManagement}
                  className="bg-emerald-700 hover:bg-emerald-600 text-amber-200 border border-emerald-500/50 text-xs font-bold px-3 py-1 rounded-xl font-quran shadow-sm transition-all flex items-center gap-1 cursor-pointer"
                  title="إدارة الحقائب والدروس وضبط الحالات والأسعار"
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>🗂️ إدارة الحقائب</span>
                </button>

                <button
                  onClick={onOpenCertificateEditor}
                  className="bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 border border-amber-400/50 text-xs font-bold px-3 py-1 rounded-xl font-quran shadow-sm transition-all flex items-center gap-1 cursor-pointer"
                  title="تعديل وتصميم قالَب شهادة الاجتياز"
                >
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  <span>🎓 تعديل الشهادات</span>
                </button>

                <button
                  onClick={() => setIsTeacherMode(false)}
                  className={`text-xs font-bold px-3 py-1 rounded-xl transition-all flex items-center gap-1 cursor-pointer border ${
                    isIdgham
                      ? 'bg-purple-800 hover:bg-purple-700 text-white border-purple-600'
                      : 'bg-emerald-800 hover:bg-emerald-700 text-white border-emerald-600'
                  }`}
                  title="التحويل فوراً لواجهة الطالب النقية"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-300" />
                  <span>واجهة الطالب</span>
                </button>
              </>
            ) : (
              <button
                onClick={onUnlockTeacherModal}
                className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold px-3 py-1 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer font-quran"
                title="الدخول لبوابة المعلم والمدرب بالرمز السري"
              >
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>المعلم</span>
              </button>
            )}
          </div>

        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          
          {/* Logo & Title Header */}
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-2xl shadow-inner shrink-0 ${
              isIdgham
                ? 'bg-purple-900/90 border border-purple-600/60 text-amber-300'
                : 'bg-emerald-900/90 border border-emerald-700/60 text-amber-400'
            }`}>
              <BookOpen className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border font-quran ${
                  isIdgham
                    ? 'bg-purple-500/20 text-purple-200 border-purple-400/40'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                }`}>
                  {activeCourse.badge}
                </span>
                <span className="bg-amber-400 text-slate-950 text-xs font-bold px-2.5 py-0.5 rounded-full font-quran shadow-sm">
                  جمع وإعداد: {activeCourse.author}
                </span>

                {/* Course Quick Selector Dropdown */}
                <div className="relative inline-block text-right">
                  <button
                    onClick={() => setShowCourseDropdown(!showCourseDropdown)}
                    className={`text-xs font-bold px-3 py-0.5 rounded-full transition-all flex items-center gap-1 cursor-pointer font-quran border ${
                      isIdgham
                        ? 'bg-purple-900 hover:bg-purple-800 text-amber-300 border-purple-400/40'
                        : 'bg-emerald-900 hover:bg-emerald-800 text-amber-300 border-amber-400/40'
                    }`}
                  >
                    <span>تبديل الحقيبة</span>
                    <ChevronDown className="w-3 h-3" />
                  </button>

                  {showCourseDropdown && (
                    <div className="absolute top-full right-0 mt-2 w-72 bg-slate-900 border-2 border-amber-400 rounded-2xl shadow-2xl p-2.5 z-50 text-right space-y-1 animate-fadeIn">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 px-2 py-1 font-quran border-b border-slate-800">
                        <span>الحقائب التدريبية المتوفرة:</span>
                        <span className="text-amber-400 text-[10px] font-sans">({getAllCourses().length})</span>
                      </div>
                      
                      <div className="max-h-60 overflow-y-auto space-y-1 py-1">
                        {getAllCourses().map((c) => {
                          const unlocked = isCourseUnlocked(c.id, isTeacherMode, c);
                          const isComingSoon = c.status === 'coming_soon';
                          const isLocked = c.status === 'locked' || (!unlocked && !isTeacherMode);
                          const isPaid = c.pricing?.isPaid ?? false;

                          return (
                            <button
                              key={c.id}
                              onClick={() => {
                                onSelectCourse(c.id);
                                setShowCourseDropdown(false);
                              }}
                              className={`w-full text-right px-3 py-2 rounded-xl text-xs font-bold font-quran transition-all flex items-center justify-between cursor-pointer ${
                                c.id === activeCourse.id
                                  ? 'bg-amber-400 text-slate-950 font-extrabold shadow-sm'
                                  : isComingSoon
                                    ? 'text-slate-300 hover:bg-purple-950/60'
                                    : !unlocked
                                      ? 'text-slate-400 hover:bg-slate-800'
                                      : 'text-slate-200 hover:bg-emerald-900 hover:text-amber-300'
                              }`}
                            >
                              <span className="flex items-center gap-1.5 truncate">
                                {isComingSoon ? (
                                  <Lock className="w-3 h-3 text-purple-400 shrink-0" />
                                ) : !unlocked ? (
                                  <Lock className="w-3 h-3 text-amber-400 shrink-0" />
                                ) : null}
                                <span className="truncate">{c.shortTitle || c.title}</span>
                              </span>

                              <div className="flex items-center gap-1 shrink-0">
                                {c.id === activeCourse.id ? (
                                  <span className="text-[10px] bg-slate-950 text-amber-300 px-1.5 py-0.5 rounded">الحالية</span>
                                ) : isComingSoon ? (
                                  <span className="text-[9px] bg-purple-950 text-purple-300 border border-purple-500/40 px-1.5 py-0.5 rounded">قريباً</span>
                                ) : isPaid ? (
                                  <span className="text-[9px] bg-amber-900/60 text-amber-300 px-1.5 py-0.5 rounded">مدفوعة 🔒</span>
                                ) : !unlocked ? (
                                  <span className="text-[9px] bg-amber-950 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded">مغلقة</span>
                                ) : (
                                  <span className="text-[9px] bg-emerald-950 text-emerald-300 px-1.5 py-0.5 rounded">مفتوحة</span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {/* Manage Bags Quick Trigger */}
                      {onOpenBagManagement && (
                        <div className="pt-2 border-t border-slate-800">
                          <button
                            onClick={() => {
                              setShowCourseDropdown(false);
                              onOpenBagManagement();
                            }}
                            className="w-full bg-emerald-800/90 hover:bg-emerald-700 text-amber-200 font-bold text-xs p-2 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer font-quran transition-colors shadow-sm"
                          >
                            <Briefcase className="w-3.5 h-3.5" />
                            <span>إدارة الحقائب والدروس والأسعار ⚙️</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Sakinan Quick Search Trigger */}
                {onOpenSearch && (
                  <button
                    onClick={onOpenSearch}
                    className={`text-xs font-bold px-3 py-0.5 rounded-full transition-all flex items-center gap-1.5 cursor-pointer font-quran border ${
                      isIdgham
                        ? 'bg-purple-900 hover:bg-purple-800 text-amber-200 border-purple-500/40'
                        : 'bg-emerald-900 hover:bg-emerald-800 text-amber-300 border-emerald-600/60'
                    }`}
                    title="بحث فوري في شواهد وأمثلة ودروس حقيبة التقاء الساكنين"
                  >
                    <Search className="w-3 h-3 text-amber-400" />
                    <span>بحث في المحتوى 🔍</span>
                  </button>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold font-quran text-amber-100 tracking-wide mt-1">
                {activeCourse.title}
              </h1>
              <p className={`text-xs sm:text-sm mt-0.5 font-tajawal font-medium ${isIdgham ? 'text-purple-200/90' : 'text-emerald-200/80'}`}>
                {activeCourse.subtitle}
              </p>
            </div>
          </div>

        </div>

        {/* Navigation Tabs or Locked Course Notice */}
        {!isTeacherMode && !isCourseUnlocked(activeCourse.id, isTeacherMode, activeCourse) ? (
          <div className={`mt-5 pt-3.5 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-quran ${
            isIdgham ? 'border-indigo-900/90 text-purple-200' : 'border-emerald-900/80 text-amber-200'
          }`}>
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-amber-400/20 text-amber-300 border border-amber-400/40">
                <Lock className="w-3.5 h-3.5" />
              </span>
              <span className="font-bold">
                {activeCourse.status === 'coming_soon'
                  ? 'هذه الحقيبة قيد الإعداد والإطلاق قريباً - يمكنك حجز مقعدك والانضمام لقائمة الانتظار'
                  : activeCourse.pricing?.isPaid
                    ? 'هذه الحقيبة مدفوعة ومقفلة - تفتح للدارس فور موافقة المعلم أو اعتماد الوصول'
                    : 'هذه الحقيبة مغلقة حالياً - يلزم إتمام ودراسة الحقيبة السابقة واجتياز اختبارها بنجاح'}
              </span>
            </div>

            <button
              onClick={onReturnToHome}
              className="bg-amber-400 hover:bg-amber-300 text-slate-950 px-4 py-2 rounded-xl font-bold font-quran transition-all flex items-center gap-1.5 cursor-pointer shadow-sm text-xs shrink-0"
            >
              <span>العودة لشاشة الحقائب المتاحة</span>
              <ChevronDown className="w-3.5 h-3.5 rotate-90" />
            </button>
          </div>
        ) : (
          <nav className={`mt-5 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none pt-4 border-t ${
            isIdgham ? 'border-indigo-900/90' : 'border-emerald-900/80'
          }`}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const isExamActiveLock = isExamActive && item.id !== 'exam';
              const isUnitsIncompleteLock = item.id === 'exam' && !isTeacherMode && completedUnitsCount < activeCourse.units.length;

              const badgeCount = (item.id === 'exam' && isUnitsIncompleteLock)
                ? `${completedUnitsCount}/${activeCourse.units.length} أبواب`
                : item.count;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (isExamActiveLock) return;
                    setActiveTab(item.id);
                  }}
                  disabled={isExamActiveLock}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                    isExamActiveLock
                      ? isIdgham
                        ? 'opacity-40 bg-indigo-950/40 text-purple-400 cursor-not-allowed border border-indigo-900'
                        : 'opacity-40 bg-emerald-950/40 text-emerald-400 cursor-not-allowed border border-emerald-900'
                      : isUnitsIncompleteLock
                      ? isActive
                        ? 'bg-amber-500 text-slate-950 font-extrabold shadow-md border border-amber-400 cursor-pointer'
                        : 'bg-amber-950/40 text-amber-200 border border-amber-500/40 hover:bg-amber-900/60 cursor-pointer'
                      : isActive
                      ? 'bg-amber-400 text-slate-950 shadow-lg font-extrabold scale-[1.02] cursor-pointer'
                      : isIdgham
                      ? 'bg-purple-950/60 text-purple-200 hover:bg-purple-900/80 hover:text-white border border-purple-800/50 cursor-pointer'
                      : 'bg-emerald-900/50 text-emerald-200 hover:bg-emerald-800/80 hover:text-white border border-emerald-800/50 cursor-pointer'
                  }`}
                  title={
                    isExamActiveLock
                      ? 'الأيقونات مقفولة أثناء أداء الاختبار النهائي الشامل'
                      : isUnitsIncompleteLock
                      ? `الاختبار الشامل مقفل حتى إتمام دراسة جميع الأبواب (${completedUnitsCount}/${activeCourse.units.length})`
                      : undefined
                  }
                >
                  {isExamActiveLock || isUnitsIncompleteLock ? (
                    <Lock className={`w-3.5 h-3.5 shrink-0 ${isUnitsIncompleteLock ? 'text-amber-400' : 'text-amber-400/90'}`} />
                  ) : (
                    <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-amber-400'}`} />
                  )}
                  <span>{item.label}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-sans ${
                      isActive
                        ? 'bg-slate-950/20 text-slate-950 font-bold'
                        : isUnitsIncompleteLock
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                        : isIdgham
                        ? 'bg-indigo-950 text-purple-300'
                        : 'bg-emerald-950 text-emerald-300'
                    }`}
                  >
                    {badgeCount}
                  </span>
                </button>
              );
            })}
          </nav>
        )}
      </div>
    </header>
  );
};

