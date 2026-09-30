import React, { useState, useEffect } from 'react';
import { 
  X, Award, CheckCircle2, Circle, RefreshCw, Sparkles, BookOpen, 
  Trophy, Check, Share2, ExternalLink, Lock, Compass, Clock, ArrowRight,
  Target, Layers
} from 'lucide-react';
import { 
  getStudentProgress, 
  loadMultiProgress,
  subscribeStudentProgress, 
  markUnitCompleted, 
  calculateProgressPercentage, 
  resetProgress,
  getStudentStudiedCourses,
  getCourseLockDetails,
  getCourseLessonsTimeline,
  CourseTimelineItem,
  SingleCourseProgress
} from '../utils/studentProgressStorage';
import { getStudentProfile } from '../utils/studentStorage';
import { getCourseBadges } from '../utils/badgeSystem';
import { ShareAchievementModal } from './ShareAchievementModal';
import { getCourseById } from '../data/courses';
import { Course } from '../types';

interface StudentProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tabId: string, unitIndex?: number, lessonIndex?: number) => void;
  activeCourseId?: string;
  onSelectCourse?: (courseId: string) => void;
  isTeacherMode?: boolean;
}

export const StudentProgressModal: React.FC<StudentProgressModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  activeCourseId = 'foundational_rules',
  onSelectCourse,
  isTeacherMode = false
}) => {
  const [selectedCourseId, setSelectedCourseId] = useState<string>(activeCourseId);
  const [multiData, setMultiData] = useState(() => loadMultiProgress());
  const [isResetting, setIsResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);
  const [lockWarningMessage, setLockWarningMessage] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [activeViewMode, setActiveViewMode] = useState<'units' | 'timeline'>('units');

  // Strictly filter only courses the student has ACTUALLY studied
  const studiedCourses: Course[] = getStudentStudiedCourses(activeCourseId);

  useEffect(() => {
    if (activeCourseId) {
      setSelectedCourseId(activeCourseId);
    } else if (studiedCourses.length > 0) {
      setSelectedCourseId(studiedCourses[0].id);
    }
  }, [activeCourseId]);

  useEffect(() => {
    const refresh = () => {
      setMultiData({ ...loadMultiProgress() });
    };
    refresh();
    const unsubscribe = subscribeStudentProgress(refresh);
    return () => unsubscribe();
  }, []);

  if (!isOpen) return null;

  const currentCourseObj = getCourseById(selectedCourseId) || studiedCourses[0];
  const currentProg: SingleCourseProgress = multiData.courses[selectedCourseId] || getStudentProgress(selectedCourseId);
  const totalUnits = currentCourseObj?.units ? currentCourseObj.units.length : 4;
  const percentage = calculateProgressPercentage(currentProg, totalUnits);
  const courseBadges = getCourseBadges(currentProg, selectedCourseId);
  const unlockedBadges = courseBadges.filter(b => b.isUnlocked);
  const completedUnitsCount = (currentProg.completedUnitNumbers || []).length;
  const isExamPassed = currentProg.examCompleted && (currentProg.examBestScore || 0) >= 90;

  // Strict Lock Evaluation: check if course is locked in the system
  const courseLock = getCourseLockDetails(selectedCourseId, isTeacherMode, currentCourseObj);
  const isCourseCurrentlyUnlocked = courseLock.isUnlocked;

  // Generate learning journey timeline items
  const timelineItems: CourseTimelineItem[] = getCourseLessonsTimeline(
    currentCourseObj, 
    currentProg, 
    isCourseCurrentlyUnlocked
  );
  const completedLessonsCount = timelineItems.filter(i => i.isCompleted).length;

  const handleToggleUnit = async (unitNum: number, currentCompleted: boolean) => {
    await markUnitCompleted(unitNum, !currentCompleted, selectedCourseId);
  };

  const handleResetCourse = async () => {
    setIsResetting(true);
    await resetProgress(selectedCourseId);
    setMultiData({ ...loadMultiProgress() });
    setIsResetting(false);
    setShowResetConfirm(false);
    setResetSuccessMessage(`تمت إعادة ضبط تقدم "${currentCourseObj?.title}" بنجاح`);
    setTimeout(() => setResetSuccessMessage(null), 3000);
  };

  const handleResetAllCourses = async () => {
    setIsResetting(true);
    await resetProgress(); // reset all
    setMultiData({ ...loadMultiProgress() });
    setSelectedCourseId(activeCourseId);
    setIsResetting(false);
    setShowResetConfirm(false);
    setResetSuccessMessage('تم تصفير جميع الإحصائيات لكافة الحقائب بنجاح');
    setTimeout(() => setResetSuccessMessage(null), 3000);
  };

  // Safe navigation handler that strictly enforces lock state
  const handleSafeNavigate = (tabId: string, unitIndex?: number, lessonIndex?: number) => {
    if (!isCourseCurrentlyUnlocked) {
      setLockWarningMessage(`عذراً، حقيبة "${currentCourseObj?.title}" مقفلة حالياً في النظام من قِبل المعلم، ولا يمكن الانتقال لمحتواها.`);
      setTimeout(() => setLockWarningMessage(null), 4000);
      return;
    }
    if (onSelectCourse) onSelectCourse(selectedCourseId);
    onClose();
    onNavigateTab(tabId, unitIndex, lessonIndex);
  };

  // Sections summary
  const keySections = [
    { id: 'exceptions', label: 'المستثنيات' },
    { id: 'examples', label: 'المختبر القرآني' },
    { id: 'errors', label: 'أخطاء القراء' },
    { id: 'summary', label: 'جدول المقارنة' },
    { id: 'rules', label: 'المتون والقواعد' },
    { id: 'books', label: 'المراجع العلمية' },
  ];

  // Mini Circular Chart Parameters
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 no-print font-tajawal dir-rtl animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-2xl w-full text-slate-100 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header: Compact & Calm */}
        <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-400 flex items-center justify-center shrink-0">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold font-quran text-slate-100 leading-tight">
                لوحة التقدم والإحصائيات
              </h2>
              <p className="text-[11px] text-slate-400">
                متابعة مدمجة ومسار التعلم للحقائب التجويدية المقررة
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            title="إغلاق النافذة"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Opened / Studied Courses Tabs (Only the bags the student has actually studied) */}
        {studiedCourses.length > 1 && (
          <div className="bg-slate-950/70 px-3.5 py-2 border-b border-slate-800 flex items-center gap-1.5 overflow-x-auto scrollbar-thin shrink-0">
            {studiedCourses.map((crs) => {
              const crsProg = multiData.courses[crs.id] || getStudentProgress(crs.id);
              const crsTotal = crs.units ? crs.units.length : 4;
              const crsPct = calculateProgressPercentage(crsProg, crsTotal);
              const isSelected = crs.id === selectedCourseId;
              const isDone = crsProg.examCompleted && (crsProg.examBestScore || 0) >= 90;
              const crsLock = getCourseLockDetails(crs.id, isTeacherMode, crs);

              return (
                <button
                  key={crs.id}
                  onClick={() => {
                    setSelectedCourseId(crs.id);
                    if (onSelectCourse) onSelectCourse(crs.id);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold font-quran transition-all shrink-0 cursor-pointer flex items-center gap-1.5 border ${
                    isSelected
                      ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-xs'
                      : 'bg-slate-800/80 text-slate-300 border-slate-700/60 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {!crsLock.isUnlocked && <Lock className="w-3 h-3 text-rose-400 shrink-0" />}
                  <span>{crs.shortTitle || crs.title}</span>
                  <span className={`text-[10px] font-sans px-1 rounded-sm ${
                    isSelected 
                      ? 'bg-slate-950/20 text-slate-950 font-black' 
                      : isDone
                      ? 'text-emerald-400 font-bold'
                      : crsPct > 0 
                      ? 'text-amber-400' 
                      : 'text-slate-500'
                  }`}>
                    {isDone ? '✓' : `${crsPct}%`}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Lock Warning Alert Banner if System Lock is Active */}
        {!isCourseCurrentlyUnlocked && (
          <div className="bg-rose-950/70 border-b border-rose-800 px-4 py-2 flex items-center justify-between text-xs text-rose-200 shrink-0">
            <div className="flex items-center gap-2">
              <span className="bg-rose-900/80 border border-rose-600 text-rose-200 text-[10px] px-2 py-0.5 rounded-full font-bold">
                {courseLock.badgeText}
              </span>
              <span className="text-[11px] leading-tight">
                الحقيبة مغلقة بقرار المعلم ولا يمكن للدارس الانتقال لدروسها.
              </span>
            </div>
            <Lock className="w-4 h-4 text-rose-400 shrink-0" />
          </div>
        )}

        {/* Toast Warning when user attempts to access locked course */}
        {lockWarningMessage && (
          <div className="bg-rose-950 border-b border-rose-500 px-4 py-2 text-xs text-rose-300 font-bold flex items-center justify-center gap-2 shrink-0 animate-fadeIn">
            <Lock className="w-4 h-4 text-rose-400" />
            <span>{lockWarningMessage}</span>
          </div>
        )}

        {/* Sub-Header Mode Switcher: (1) الأبواب والإحصائيات vs (2) مسار التعلم الزمني */}
        <div className="bg-slate-950/40 px-3.5 py-1.5 border-b border-slate-800/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveViewMode('units')}
              className={`px-3 py-1 rounded-lg text-xs font-bold font-quran transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeViewMode === 'units'
                  ? 'bg-amber-400 text-slate-950 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>أبواب المنهج والإحصائيات</span>
            </button>

            <button
              onClick={() => setActiveViewMode('timeline')}
              className={`px-3 py-1 rounded-lg text-xs font-bold font-quran transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeViewMode === 'timeline'
                  ? 'bg-amber-400 text-slate-950 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>مسار التعلم الزمني ({completedLessonsCount}/{timelineItems.length})</span>
            </button>
          </div>

          <span className="text-[10px] text-slate-400 hidden sm:inline">
            {currentCourseObj?.title}
          </span>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-3.5 sm:p-4 space-y-3 flex-1 overflow-y-auto custom-scrollbar">

          {/* VIEW 1: OVERVIEW & COMPACT UNITS GRID */}
          {activeViewMode === 'units' && (
            <>
              {/* KPI Statistics Compact Grid (4 Cards in a neat row) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                
                {/* KPI 1: Circular Mini Progress */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 flex items-center gap-2.5">
                  <div className="relative w-10 h-10 shrink-0 flex items-center justify-center">
                    <svg className="w-10 h-10 -rotate-90" viewBox="0 0 44 44">
                      <circle
                        cx="22"
                        cy="22"
                        r={radius}
                        className="stroke-slate-800"
                        strokeWidth="4"
                        fill="none"
                      />
                      <circle
                        cx="22"
                        cy="22"
                        r={radius}
                        className="stroke-amber-400 transition-all duration-500"
                        strokeWidth="4"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        fill="none"
                      />
                    </svg>
                    <span className="absolute text-[11px] font-mono font-bold text-amber-300">
                      {percentage}%
                    </span>
                  </div>
                  <div className="truncate">
                    <div className="text-[10px] text-slate-400">نسبة الإنجاز</div>
                    <div className="text-xs font-bold font-quran text-slate-200 truncate">
                      {percentage >= 100 ? 'مكتمل بالكامل' : percentage > 0 ? 'قيد الدراسة' : 'جديد'}
                    </div>
                  </div>
                </div>

                {/* KPI 2: Completed Units */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>الأبواب</span>
                    <span className="font-mono text-emerald-400 font-bold">{completedUnitsCount}/{totalUnits}</span>
                  </div>
                  <div className="flex items-center gap-1 my-1">
                    {Array.from({ length: totalUnits }).map((_, i) => (
                      <div 
                        key={i} 
                        className={`h-1.5 flex-1 rounded-full ${
                          i < completedUnitsCount ? 'bg-emerald-400' : 'bg-slate-800'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {completedUnitsCount === totalUnits ? 'أتممت جميع الأبواب ✓' : `متبقي ${totalUnits - completedUnitsCount} أبواب`}
                  </div>
                </div>

                {/* KPI 3: Exam & Certificate */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>الاختبار</span>
                    <span className="font-mono text-amber-400 font-bold">
                      {currentProg.examCompleted ? `${currentProg.examBestScore}%` : 'لم يُجرَ'}
                    </span>
                  </div>
                  <div className="text-xs font-bold mt-0.5 truncate">
                    {isExamPassed ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>الشهادة مستحقة</span>
                      </span>
                    ) : (
                      <span className="text-slate-300">الحد الأدنى 90%</span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {currentProg.examCompleted ? 'تم إنجاز الاختبار' : 'جاهز للتقديم'}
                  </div>
                </div>

                {/* KPI 4: Badges */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>الأوسمة</span>
                    <span className="font-mono text-amber-300 font-bold">{unlockedBadges.length}/{courseBadges.length}</span>
                  </div>
                  <div className="flex items-center gap-1 my-0.5">
                    {unlockedBadges.length > 0 ? (
                      unlockedBadges.slice(0, 3).map((b) => (
                        <span key={b.id} className="text-xs" title={b.title}>{b.icon}</span>
                      ))
                    ) : (
                      <span className="text-[10px] text-slate-500">أوسمة الإتقان</span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {unlockedBadges.length > 0 ? `${unlockedBadges.length} أوسمة مكتسبة` : 'قيد التحصيل'}
                  </div>
                </div>

              </div>

              {/* Compact Units Grid (2 columns on mobile/tablet) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs px-0.5">
                  <span className="font-bold font-quran text-slate-200">
                    أبواب الحقيبة: {currentCourseObj?.title}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    انقر على الدائرة لتعليم الإنجاز
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {currentCourseObj?.units?.map((unit, idx) => {
                    const isCompleted = (currentProg.completedUnitNumbers || []).includes(unit.unitNumber);
                    return (
                      <div
                        key={unit.id}
                        className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2 ${
                          isCompleted
                            ? 'bg-emerald-950/20 border-emerald-800/60'
                            : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <button
                            onClick={() => handleToggleUnit(unit.unitNumber, isCompleted)}
                            className={`p-0.5 rounded-md transition-colors cursor-pointer shrink-0 ${
                              isCompleted ? 'text-emerald-400' : 'text-slate-600 hover:text-slate-400'
                            }`}
                            title={isCompleted ? 'تعليم كغير مكتمل' : 'تعليم كمكتمل'}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <Circle className="w-4 h-4" />
                            )}
                          </button>

                          <div className="truncate">
                            <div className="text-xs font-bold font-quran text-slate-100 truncate">
                              {unit.title}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">
                              {unit.subtitle || `الباب ${unit.unitNumber}`}
                            </div>
                          </div>
                        </div>

                        {isCourseCurrentlyUnlocked ? (
                          <button
                            onClick={() => handleSafeNavigate('units', idx)}
                            className="text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white px-2.5 py-1 rounded-lg font-quran transition-colors cursor-pointer border border-slate-700 shrink-0 flex items-center gap-1"
                          >
                            <span>دراسة</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleSafeNavigate('units', idx)}
                            className="text-[11px] bg-rose-950/40 text-rose-300 px-2 py-1 rounded-lg font-quran border border-rose-800/60 shrink-0 flex items-center gap-1 cursor-not-allowed"
                            title="الحقيبة مقفلة من المعلم"
                          >
                            <Lock className="w-3 h-3" />
                            <span>مقفلة</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quick Laboratory & Sections Micro Strip */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-2.5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] text-slate-400 shrink-0">الأقسام التكميلية:</span>
                  {keySections.map((sec) => {
                    const isRead = (currentProg.readSections || []).includes(sec.id);
                    return (
                      <button
                        key={sec.id}
                        onClick={() => handleSafeNavigate(sec.id)}
                        className={`text-[10px] px-2 py-0.5 rounded-md border transition-colors cursor-pointer flex items-center gap-1 ${
                          isRead
                            ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <span>{sec.label}</span>
                        {isRead && <Check className="w-2.5 h-2.5 text-emerald-400" />}
                      </button>
                    );
                  })}
                </div>

                {isCourseCurrentlyUnlocked ? (
                  <button
                    onClick={() => handleSafeNavigate('exam')}
                    className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold font-quran text-[11px] px-3 py-1 rounded-lg transition-colors cursor-pointer shrink-0 flex items-center gap-1"
                  >
                    <span>{currentProg.examCompleted ? 'استعراض الاختبار' : 'بدء الاختبار الشامل'}</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                ) : (
                  <button
                    onClick={() => handleSafeNavigate('exam')}
                    className="bg-slate-800 text-slate-500 font-bold font-quran text-[11px] px-3 py-1 rounded-lg cursor-not-allowed shrink-0 flex items-center gap-1 border border-slate-700"
                  >
                    <Lock className="w-3 h-3 text-rose-400" />
                    <span>مقفلة 🔒</span>
                  </button>
                )}
              </div>
            </>
          )}

          {/* VIEW 2: INTERACTIVE LEARNING JOURNEY TIMELINE (مسار التعلم) */}
          {activeViewMode === 'timeline' && (
            <div className="space-y-3 animate-fadeIn">
              
              {/* Timeline Header Info */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-400/10 border border-amber-400/20 text-amber-400 flex items-center justify-center shrink-0">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="font-bold font-quran text-slate-100 text-xs">
                      المسار الزمني لإنجاز الدروس
                    </h3>
                    <p className="text-[10px] text-slate-400">
                      انقر على أي درس للانتقال المباشر إليه ومراجعته فوراً
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="text-emerald-400 font-bold bg-emerald-950/40 px-2 py-0.5 rounded-lg border border-emerald-800/60">
                    {completedLessonsCount}/{timelineItems.length} درس
                  </span>
                </div>
              </div>

              {/* Connected Vertical Timeline */}
              <div className="relative pr-6 pl-2 space-y-2.5 before:absolute before:right-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800">
                {timelineItems.map((item, idx) => {
                  return (
                    <div 
                      key={item.id} 
                      className={`relative flex items-center justify-between gap-3 p-2.5 rounded-xl border transition-all ${
                        item.isCompleted
                          ? 'bg-emerald-950/20 border-emerald-800/60 shadow-xs'
                          : item.isCurrentNext
                          ? 'bg-amber-950/20 border-amber-500/60 shadow-xs'
                          : 'bg-slate-950/50 border-slate-800'
                      }`}
                    >
                      {/* Timeline Node Icon (positioned right on vertical line) */}
                      <div className={`absolute -right-[21px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 z-10 ${
                        item.isCompleted
                          ? 'bg-emerald-500 border-slate-900 text-slate-950 ring-2 ring-emerald-500/30'
                          : item.isCurrentNext
                          ? 'bg-amber-400 border-slate-900 text-slate-950 animate-pulse ring-2 ring-amber-400/40'
                          : 'bg-slate-800 border-slate-700'
                      }`}>
                        {item.isCompleted && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        {item.isCurrentNext && <span className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                      </div>

                      {/* Lesson Details */}
                      <div className="truncate">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[10px] text-amber-400/90 font-bold bg-slate-900 px-1.5 py-0.2 rounded border border-slate-800">
                            {item.unitNumber}.{item.lessonNumber}
                          </span>
                          <span className="text-xs font-bold font-quran text-slate-100 truncate">
                            {item.lessonTitle}
                          </span>
                        </div>

                        <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5 truncate">
                          <span>{item.unitTitle}</span>
                          <span aria-hidden="true" className="text-slate-700">·</span>
                          <span className={item.isCompleted ? 'text-emerald-400 font-bold' : item.isCurrentNext ? 'text-amber-400 font-bold' : 'text-slate-500'}>
                            {item.isCompleted ? 'مكتمل تاريخياً ✓' : item.isCurrentNext ? 'الدرس الحالي 🎯' : 'قادم ⏳'}
                          </span>
                        </div>
                      </div>

                      {/* Direct Click to Jump Button */}
                      {isCourseCurrentlyUnlocked ? (
                        <button
                          onClick={() => handleSafeNavigate('units', item.unitIndex, item.lessonIndex)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-quran transition-colors cursor-pointer shrink-0 flex items-center gap-1 border ${
                            item.isCompleted
                              ? 'bg-slate-800 hover:bg-slate-700 text-emerald-300 border-emerald-900/60'
                              : item.isCurrentNext
                              ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold border-amber-300 shadow-xs'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                          }`}
                        >
                          <span>انتقال للدرس</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSafeNavigate('units', item.unitIndex, item.lessonIndex)}
                          className="px-2 py-1 rounded-lg text-[10px] font-quran bg-slate-900 text-rose-400 border border-rose-900/50 cursor-not-allowed shrink-0 flex items-center gap-1"
                        >
                          <Lock className="w-3 h-3" />
                          <span>مقفلة</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

            </div>
          )}

        </div>

        {/* Reset Feedback Notification */}
        {resetSuccessMessage && (
          <div className="bg-emerald-950/90 border-t border-emerald-500/50 px-4 py-2 text-xs text-emerald-300 font-bold text-center flex items-center justify-center gap-1.5 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{resetSuccessMessage}</span>
          </div>
        )}

        {/* Reset Confirmation Drawer / Modal */}
        {showResetConfirm && (
          <div className="bg-slate-950/95 border-t border-slate-800 p-3.5 space-y-2.5 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 font-quran">
                اختر نوع إعادة الضبط والتصفير:
              </span>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                onClick={handleResetCourse}
                disabled={isResetting}
                className="bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-amber-400/50 text-slate-200 hover:text-amber-300 p-2.5 rounded-xl text-right transition-colors cursor-pointer text-xs space-y-0.5"
              >
                <div className="font-bold font-quran">إعادة ضبط هذه الحقيبة فقط</div>
                <div className="text-[10px] text-slate-400">تصفير تقدم ({currentCourseObj?.title})</div>
              </button>

              <button
                onClick={handleResetAllCourses}
                disabled={isResetting}
                className="bg-rose-950/30 hover:bg-rose-950/50 border border-rose-900/60 hover:border-rose-500 text-rose-300 p-2.5 rounded-xl text-right transition-colors cursor-pointer text-xs space-y-0.5"
              >
                <div className="font-bold font-quran">تصفير شامل لكافة الحقائب</div>
                <div className="text-[10px] text-rose-400/80">مسح كافة الأبواب والأوسمة والاختبارات</div>
              </button>
            </div>
          </div>
        )}

        {/* Footer: Compact & Calm */}
        <div className="bg-slate-950 px-4 py-2.5 border-t border-slate-800 flex items-center justify-between text-xs shrink-0">
          <button
            onClick={() => setShowResetConfirm(prev => !prev)}
            disabled={isResetting}
            className="text-slate-500 hover:text-rose-400 flex items-center gap-1.5 transition-colors cursor-pointer text-[11px]"
            title="إعادة ضبط التقدم"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
            <span>إعادة الضبط والتصفير</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold font-quran px-3 py-1.5 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 text-xs shadow-xs"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>مشاركة الإنجاز</span>
            </button>

            <button
              onClick={onClose}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold font-quran px-3 py-1.5 rounded-xl transition-colors cursor-pointer text-xs border border-slate-700"
            >
              إغلاق
            </button>
          </div>
        </div>

      </div>

      {/* Embedded Share Achievement Modal */}
      <ShareAchievementModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        activeCourseId={selectedCourseId}
        studentProfile={getStudentProfile()}
        progress={currentProg}
        badges={courseBadges}
        percentage={percentage}
      />
    </div>
  );
};
