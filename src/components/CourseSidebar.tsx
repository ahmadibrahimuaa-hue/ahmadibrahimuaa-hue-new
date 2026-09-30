import React, { useState, useEffect } from 'react';
import { Course, StudentProfile } from '../types';
import { getAllCourses } from '../data/courses';
import { isCourseUnlocked } from '../utils/studentProgressStorage';
import { 
  getCustomStoredCourses, 
  subscribeCourses, 
  moveCourseOrder, 
  reorderCourses, 
  resetCoursesToDefault 
} from '../utils/courseCustomStorage';
import { 
  BookOpen, Book, GraduationCap, Table, Bookmark, ShieldAlert, Award, 
  BookMarked, ChevronDown, ChevronRight, X, Lock, CheckCircle2, 
  Search, Heart, FileText, Calendar, Trophy, Grid, Layers, UserCheck,
  ArrowUpDown, ArrowUp, ArrowDown, Monitor, RotateCcw, SlidersHorizontal, Check
} from 'lucide-react';

interface CourseSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeCourse: Course;
  activeCourseId: string;
  onSelectCourse: (courseId: string) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedUnitIndex: number;
  onSelectUnit: (index: number) => void;
  completedUnitsCount: number;
  completedUnitNumbers?: number[];
  progressPercentage: number;
  isTeacherMode: boolean;
  onReturnToHome: () => void;
  studentProfile?: StudentProfile | null;
  isExamActive?: boolean;
  onOpenSearch?: () => void;
  onOpenProgressModal?: () => void;
  onOpenFavorites?: () => void;
  onOpenNotes?: () => void;
  onOpenBadges?: () => void;
  onOpenPlanner?: () => void;
  onOpenPresentationMode?: () => void;
}

export const CourseSidebar: React.FC<CourseSidebarProps> = ({
  isOpen,
  onClose,
  activeCourse,
  activeCourseId,
  onSelectCourse,
  activeTab,
  setActiveTab,
  selectedUnitIndex,
  onSelectUnit,
  completedUnitsCount,
  completedUnitNumbers = [],
  progressPercentage,
  isTeacherMode,
  onReturnToHome,
  studentProfile,
  isExamActive = false,
  onOpenSearch,
  onOpenProgressModal,
  onOpenFavorites,
  onOpenNotes,
  onOpenBadges,
  onOpenPlanner,
  onOpenPresentationMode,
}) => {
  const [coursesDropdownOpen, setCoursesDropdownOpen] = useState(false);
  const [unitsExpanded, setUnitsExpanded] = useState(true);
  const [coursesSectionExpanded, setCoursesSectionExpanded] = useState(true);
  const [showReorderModal, setShowReorderModal] = useState(false);
  const [reorderSuccessMsg, setReorderSuccessMsg] = useState<string | null>(null);

  const [coursesList, setCoursesList] = useState<Course[]>(() => getCustomStoredCourses());

  // Subscribe to real-time course updates and reordering
  useEffect(() => {
    const unsub = subscribeCourses((updated) => {
      setCoursesList(updated);
    });
    return () => unsub();
  }, []);

  // Close sidebar on Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (showReorderModal) {
          setShowReorderModal(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, showReorderModal, onClose]);

  const handleTabClick = (tabId: string) => {
    if (isExamActive && tabId !== 'exam') return;
    setActiveTab(tabId);
    // On small screens, close sidebar automatically after selecting
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  const handleUnitClick = (idx: number) => {
    if (isExamActive) return;
    setActiveTab('units');
    onSelectUnit(idx);
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  const handleMoveCourse = (cId: string, direction: 'up' | 'down', e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const success = moveCourseOrder(cId, direction);
    if (success) {
      const updated = getCustomStoredCourses();
      setCoursesList(updated);
      setReorderSuccessMsg('تم تحديث ترتيب الحقائب بنجاح');
      setTimeout(() => setReorderSuccessMsg(null), 2500);
    }
  };

  const handleSetPresetOrder = (preset: 'foundational_first' | 'makharij_progression' | 'default') => {
    let orderedIds: string[] = [];
    if (preset === 'foundational_first') {
      orderedIds = ['foundational_rules', 'sakinan', 'idgham', 'makharij', 'ijazah'];
    } else if (preset === 'makharij_progression') {
      orderedIds = ['foundational_rules', 'makharij', 'idgham', 'sakinan', 'ijazah'];
    } else {
      resetCoursesToDefault();
      const updated = getCustomStoredCourses();
      setCoursesList(updated);
      setReorderSuccessMsg('تمت استعادة الترتيب الافتراضي');
      setTimeout(() => setReorderSuccessMsg(null), 2500);
      return;
    }

    reorderCourses(orderedIds);
    const updated = getCustomStoredCourses();
    setCoursesList(updated);
    setReorderSuccessMsg('تم تطبيق الترتيب المختار بنجاح');
    setTimeout(() => setReorderSuccessMsg(null), 2500);
  };

  const isUnitsIncompleteForExam = !isTeacherMode && completedUnitsCount < (activeCourse.units?.length || 1);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 lg:hidden animate-fadeIn"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed top-0 bottom-0 right-0 z-40 w-72 sm:w-80 bg-slate-900 border-l border-slate-800 text-slate-200 flex flex-col transition-transform duration-200 ease-in-out font-tajawal dir-rtl ${
          isOpen ? 'translate-x-0 shadow-2xl' : 'translate-x-full'
        }`}
        aria-label="فهرس ومحتويات الحقيبة"
      >
        {/* Sidebar Header: Title & Close */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-2 bg-slate-950/50 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold font-quran text-slate-100">فهرس المحتوى</div>
              <div className="text-[11px] text-slate-400 font-normal">تصفح الحقيبة والدروس</div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            title="إخفاء القائمة الجانبية (Esc)"
            aria-label="إغلاق الفهرس"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Course Selector Box with Reorder Button */}
        <div className="p-3 border-b border-slate-800/80 bg-slate-950/20 shrink-0 space-y-2">
          <div className="flex items-center gap-1.5">
            <div className="relative flex-1">
              <button
                onClick={() => setCoursesDropdownOpen(!coursesDropdownOpen)}
                className="w-full text-right p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/80 transition-colors flex items-center justify-between gap-2 cursor-pointer"
              >
                <div className="truncate">
                  <div className="text-[10px] text-amber-400/90 font-bold font-quran">الحقيبة الحالية:</div>
                  <div className="text-xs font-bold font-quran text-slate-100 truncate mt-0.5">
                    {activeCourse.shortTitle || activeCourse.title}
                  </div>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${coursesDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {coursesDropdownOpen && (
                <div className="absolute top-full right-0 left-0 mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1.5 z-50 text-right space-y-0.5 animate-fadeIn max-h-60 overflow-y-auto">
                  <div className="px-2 py-1 text-[10px] font-bold text-slate-400 border-b border-slate-800 flex items-center justify-between">
                    <span>قائمة الحقائب (بالترتيب الحالي)</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCoursesDropdownOpen(false);
                        setShowReorderModal(true);
                      }}
                      className="text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer text-[10px]"
                    >
                      <ArrowUpDown className="w-3 h-3" />
                      <span>تعديل الترتيب</span>
                    </button>
                  </div>

                  {coursesList.map((c, idx) => {
                    const unlocked = isCourseUnlocked(c.id, isTeacherMode, c);
                    const isSelected = c.id === activeCourseId;
                    return (
                      <div
                        key={c.id}
                        className={`w-full px-2 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-between group ${
                          isSelected
                            ? 'bg-amber-400/10 text-amber-300 font-bold border border-amber-400/20'
                            : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <button
                          onClick={() => {
                            onSelectCourse(c.id);
                            setCoursesDropdownOpen(false);
                          }}
                          className="flex-1 text-right truncate flex items-center gap-1.5 cursor-pointer"
                        >
                          <span className="font-mono text-[10px] text-slate-500 w-4">{idx + 1}.</span>
                          {!unlocked && !isTeacherMode && <Lock className="w-3 h-3 text-slate-500 shrink-0" />}
                          <span className="truncate">{c.shortTitle || c.title}</span>
                        </button>

                        {/* Quick Up / Down Arrows inside Dropdown */}
                        <div className="flex items-center gap-0.5 shrink-0 opacity-80 group-hover:opacity-100">
                          <button
                            onClick={(e) => handleMoveCourse(c.id, 'up', e)}
                            disabled={idx === 0}
                            className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white disabled:opacity-20 cursor-pointer"
                            title="تحريك لأعلى"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => handleMoveCourse(c.id, 'down', e)}
                            disabled={idx === coursesList.length - 1}
                            className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white disabled:opacity-20 cursor-pointer"
                            title="تحريك لأسفل"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick Reorder Modal Button */}
            <button
              onClick={() => setShowReorderModal(true)}
              className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-amber-400 hover:text-amber-300 transition-colors cursor-pointer shrink-0"
              title="تخصيص ترتيب الحقائب في القائمة الجانبية والمنصة"
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Success Toast */}
          {reorderSuccessMsg && (
            <div className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2 py-1 rounded-lg text-center animate-fadeIn flex items-center justify-center gap-1">
              <Check className="w-3 h-3" />
              <span>{reorderSuccessMsg}</span>
            </div>
          )}
        </div>

        {/* Scrollable Navigation List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4 scrollbar-thin">
          
          {/* Section 0: Courses Navigation & Ordering Section */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 px-2 py-1">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span>الحقائب المقررة (الترتيب والانتقال)</span>
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowReorderModal(true)}
                  className="text-[10px] text-amber-400 hover:text-amber-300 cursor-pointer"
                  title="فتح نافذة إعادة الترتيب الشاملة"
                >
                  ترتيب
                </button>
                <button
                  onClick={() => setCoursesSectionExpanded(!coursesSectionExpanded)}
                  className="p-1 text-slate-400 hover:text-slate-200 rounded cursor-pointer"
                >
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${coursesSectionExpanded ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div>

            {coursesSectionExpanded && (
              <div className="space-y-1 my-1">
                {coursesList.map((c, idx) => {
                  const isSelected = c.id === activeCourseId;
                  const unlocked = isCourseUnlocked(c.id, isTeacherMode, c);

                  return (
                    <div
                      key={c.id}
                      className={`w-full px-2.5 py-1.5 rounded-xl text-xs transition-colors flex items-center justify-between gap-1 group ${
                        isSelected
                          ? 'bg-amber-400/10 text-amber-300 font-bold border border-amber-400/30'
                          : 'text-slate-300 hover:bg-slate-800/70 border border-transparent'
                      }`}
                    >
                      {/* Course Switch Button */}
                      <button
                        onClick={() => {
                          onSelectCourse(c.id);
                          if (window.innerWidth < 1024) onClose();
                        }}
                        className="flex-1 text-right truncate flex items-center gap-2 cursor-pointer"
                        title={c.title}
                      >
                        <span className="font-mono text-[10px] w-4 text-slate-400 shrink-0">{idx + 1}.</span>
                        {!unlocked && !isTeacherMode && (
                          <Lock className="w-3 h-3 text-slate-500 shrink-0" />
                        )}
                        <span className="truncate">{c.shortTitle || c.title}</span>
                      </button>

                      {/* Reorder Arrows (Move Up / Move Down) */}
                      <div className="flex items-center gap-0.5 shrink-0 opacity-70 group-hover:opacity-100">
                        <button
                          onClick={(e) => handleMoveCourse(c.id, 'up', e)}
                          disabled={idx === 0}
                          className="p-1 hover:bg-slate-700/80 rounded text-slate-400 hover:text-white disabled:opacity-20 cursor-pointer"
                          title="تقديم الحقيبة في الترتيب (لأعلى)"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => handleMoveCourse(c.id, 'down', e)}
                          disabled={idx === coursesList.length - 1}
                          className="p-1 hover:bg-slate-700/80 rounded text-slate-400 hover:text-white disabled:opacity-20 cursor-pointer"
                          title="تأخير الحقيبة في الترتيب (لأسفل)"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 1: Main Curriculum */}
          <div className="space-y-1 pt-2 border-t border-slate-800/60">
            <div className="text-[11px] font-bold text-slate-400 px-2 py-1 flex items-center justify-between">
              <span>المسار التعليمي والدروس</span>
            </div>

            {/* Presentation Mode Button */}
            {onOpenPresentationMode && (
              <button
                onClick={() => {
                  onClose();
                  onOpenPresentationMode();
                }}
                className="w-full text-right px-3 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2.5 cursor-pointer bg-gradient-to-r from-amber-500/20 to-emerald-500/20 hover:from-amber-500/30 hover:to-emerald-500/30 text-amber-300 border border-amber-500/40 shadow-xs mb-1"
                title="عرض محتوى الدرس كعرض تقديمي تفاعلي مع أدوات قلم للرسم على الشاشة"
              >
                <Monitor className="w-4 h-4 text-amber-400" />
                <span className="flex-1">وضع العرض التقديمي (بريزنتيشن)</span>
                <span className="text-[10px] bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded font-bold font-quran">شرح</span>
              </button>
            )}

            {/* Cover Tab */}
            <button
              onClick={() => handleTabClick('cover')}
              className={`w-full text-right px-3 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2.5 cursor-pointer ${
                activeTab === 'cover'
                  ? 'bg-slate-800 text-amber-300 font-bold border border-slate-700'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <Book className={`w-4 h-4 ${activeTab === 'cover' ? 'text-amber-400' : 'text-slate-400'}`} />
              <span>غلاف الحقيبة والتقديم</span>
            </button>

            {/* Units Master Tab */}
            <div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleTabClick('units')}
                  className={`flex-1 text-right px-3 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center justify-between gap-2 cursor-pointer ${
                    activeTab === 'units'
                      ? 'bg-slate-800 text-amber-300 font-bold border border-slate-700'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <BookOpen className={`w-4 h-4 ${activeTab === 'units' ? 'text-amber-400' : 'text-slate-400'}`} />
                    <span>الكتاب التدريبي (الأبواب)</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    ({activeCourse.units?.length || 0})
                  </span>
                </button>

                <button
                  onClick={() => setUnitsExpanded(!unitsExpanded)}
                  className="p-2 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 cursor-pointer"
                  title={unitsExpanded ? 'طي قائمة الأبواب' : 'عرض قائمة الأبواب'}
                >
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${unitsExpanded ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {/* Sub-list of Units */}
              {unitsExpanded && activeCourse.units && activeCourse.units.length > 0 && (
                <div className="mr-4 my-1 pr-2 border-r border-slate-800 space-y-0.5">
                  {activeCourse.units.map((unit, idx) => {
                    const isUnitSelected = activeTab === 'units' && selectedUnitIndex === idx;
                    const isCompleted = completedUnitNumbers.includes(unit.unitNumber);

                    return (
                      <button
                        key={unit.id}
                        onClick={() => handleUnitClick(idx)}
                        className={`w-full text-right px-2.5 py-1.5 rounded-lg text-[11px] transition-colors flex items-center justify-between gap-2 cursor-pointer ${
                          isUnitSelected
                            ? 'bg-amber-400/10 text-amber-300 font-bold'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                        }`}
                      >
                        <span className="truncate">
                          الباب 0{unit.unitNumber}: {unit.title.split(':')[1] || unit.title}
                        </span>
                        {isCompleted && (
                          <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Quranic Laboratory & Practice */}
          <div className="space-y-1 pt-2 border-t border-slate-800/60">
            <div className="text-[11px] font-bold text-slate-400 px-2 py-1">
              المختبر والتطبيقات القرآنية
            </div>

            <button
              onClick={() => handleTabClick('examples')}
              className={`w-full text-right px-3 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2.5 cursor-pointer ${
                activeTab === 'examples'
                  ? 'bg-slate-800 text-amber-300 font-bold border border-slate-700'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <GraduationCap className={`w-4 h-4 ${activeTab === 'examples' ? 'text-amber-400' : 'text-slate-400'}`} />
              <span>المختبر القرآني للأمثلة</span>
            </button>

            <button
              onClick={() => handleTabClick('exceptions')}
              className={`w-full text-right px-3 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2.5 cursor-pointer ${
                activeTab === 'exceptions'
                  ? 'bg-slate-800 text-amber-300 font-bold border border-slate-700'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <BookMarked className={`w-4 h-4 ${activeTab === 'exceptions' ? 'text-amber-400' : 'text-slate-400'}`} />
              <span>الكلمات المستثناة</span>
            </button>

            <button
              onClick={() => handleTabClick('errors')}
              className={`w-full text-right px-3 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2.5 cursor-pointer ${
                activeTab === 'errors'
                  ? 'bg-slate-800 text-amber-300 font-bold border border-slate-700'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <ShieldAlert className={`w-4 h-4 ${activeTab === 'errors' ? 'text-amber-400' : 'text-slate-400'}`} />
              <span>أخطاء القراء والتصحيح</span>
            </button>

            <button
              onClick={() => handleTabClick('summary')}
              className={`w-full text-right px-3 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2.5 cursor-pointer ${
                activeTab === 'summary'
                  ? 'bg-slate-800 text-amber-300 font-bold border border-slate-700'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <Table className={`w-4 h-4 ${activeTab === 'summary' ? 'text-amber-400' : 'text-slate-400'}`} />
              <span>جدول المقارنة الشامل</span>
            </button>
          </div>

          {/* Section 3: Assessment & Certification */}
          <div className="space-y-1 pt-2 border-t border-slate-800/60">
            <div className="text-[11px] font-bold text-slate-400 px-2 py-1">
              التقييم والاعتماد
            </div>

            <button
              onClick={() => handleTabClick('exam')}
              disabled={isUnitsIncompleteForExam}
              className={`w-full text-right px-3 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center justify-between cursor-pointer ${
                isUnitsIncompleteForExam
                  ? 'opacity-50 text-slate-500 cursor-not-allowed'
                  : activeTab === 'exam'
                  ? 'bg-slate-800 text-amber-300 font-bold border border-slate-700'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
              title={isUnitsIncompleteForExam ? `يلزم إتمام الأبواب أولاً (${completedUnitsCount}/${activeCourse.units?.length || 1})` : undefined}
            >
              <span className="flex items-center gap-2.5">
                <Award className={`w-4 h-4 ${activeTab === 'exam' ? 'text-amber-400' : 'text-slate-400'}`} />
                <span>الاختبار النهائي الشامل</span>
              </span>
              {isUnitsIncompleteForExam && <Lock className="w-3.5 h-3.5 text-slate-500" />}
            </button>
          </div>

          {/* Section 4: References & Student Tools */}
          <div className="space-y-1 pt-2 border-t border-slate-800/60">
            <div className="text-[11px] font-bold text-slate-400 px-2 py-1">
              الأدلة والمراجع
            </div>

            <button
              onClick={() => handleTabClick('rules')}
              className={`w-full text-right px-3 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2.5 cursor-pointer ${
                activeTab === 'rules'
                  ? 'bg-slate-800 text-amber-300 font-bold border border-slate-700'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${activeTab === 'rules' ? 'text-amber-400' : 'text-slate-400'}`} />
              <span>دليل الأحكام السريع</span>
            </button>

            <button
              onClick={() => handleTabClick('books')}
              className={`w-full text-right px-3 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2.5 cursor-pointer ${
                activeTab === 'books'
                  ? 'bg-slate-800 text-amber-300 font-bold border border-slate-700'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <Book className={`w-4 h-4 ${activeTab === 'books' ? 'text-amber-400' : 'text-slate-400'}`} />
              <span>المراجع والمصادر العلمية</span>
            </button>
          </div>

          {/* Section 5: Student Personal Utilities */}
          <div className="space-y-1 pt-2 border-t border-slate-800/60">
            <div className="text-[11px] font-bold text-slate-400 px-2 py-1">
              أدوات ومفكرة الدارس
            </div>

            {onOpenFavorites && (
              <button
                onClick={() => {
                  onClose();
                  onOpenFavorites();
                }}
                className="w-full text-right px-3 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors flex items-center gap-2.5 cursor-pointer"
              >
                <Heart className="w-4 h-4 text-rose-400" />
                <span>دروسي المفضلة</span>
              </button>
            )}

            {onOpenNotes && (
              <button
                onClick={() => {
                  onClose();
                  onOpenNotes();
                }}
                className="w-full text-right px-3 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors flex items-center gap-2.5 cursor-pointer"
              >
                <FileText className="w-4 h-4 text-amber-400" />
                <span>مفكرة التدوين والملاحظات</span>
              </button>
            )}

            {onOpenPlanner && (
              <button
                onClick={() => {
                  onClose();
                  onOpenPlanner();
                }}
                className="w-full text-right px-3 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors flex items-center gap-2.5 cursor-pointer"
              >
                <Calendar className="w-4 h-4 text-emerald-400" />
                <span>مخطط الدراسة اليومي</span>
              </button>
            )}

            {onOpenBadges && (
              <button
                onClick={() => {
                  onClose();
                  onOpenBadges();
                }}
                className="w-full text-right px-3 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors flex items-center gap-2.5 cursor-pointer"
              >
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>أوسمة التميز والإنجاز</span>
              </button>
            )}

            {onOpenSearch && (
              <button
                onClick={() => {
                  onClose();
                  onOpenSearch();
                }}
                className="w-full text-right px-3 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors flex items-center gap-2.5 cursor-pointer"
              >
                <Search className="w-4 h-4 text-sky-400" />
                <span>البحث الفوري في المحتوى</span>
              </button>
            )}
          </div>

        </div>

        {/* Sidebar Footer: Progress & Home */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60 shrink-0 space-y-2">
          {/* Progress Mini Bar */}
          <button
            onClick={() => {
              if (onOpenProgressModal) {
                onClose();
                onOpenProgressModal();
              }
            }}
            className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors text-right cursor-pointer"
          >
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
              <span>إنجاز الحقيبة:</span>
              <span className="font-mono text-amber-300 font-bold">{progressPercentage}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </button>

          {/* Return to Platform Home Link */}
          <button
            onClick={() => {
              onClose();
              onReturnToHome();
            }}
            className="w-full text-right px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Grid className="w-3.5 h-3.5" />
            <span>العودة للمنصة الرئيسية</span>
          </button>
        </div>

      </aside>

      {/* Course Reordering Modal Dialog */}
      {showReorderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn font-tajawal dir-rtl">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-lg w-full p-6 text-slate-100 shadow-2xl space-y-5 animate-scaleUp">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
                  <ArrowUpDown className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-quran text-amber-300">
                    التحكم في ترتيب الحقائب التعليمية
                  </h3>
                  <p className="text-xs text-slate-400 font-normal mt-0.5">
                    حدّد الترتيب المناسب لعرض الحقائب في القائمة الجانبية والمنصة
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowReorderModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Presets */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-bold text-slate-400">أنماط ترتيب سريعة موصى بها:</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  onClick={() => handleSetPresetOrder('foundational_first')}
                  className="px-3 py-2 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-700/60 text-emerald-300 text-xs font-bold text-right cursor-pointer flex items-center gap-2 transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate">أصول التلاوة والتأسيس أولاً</span>
                </button>

                <button
                  onClick={() => handleSetPresetOrder('makharij_progression')}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-xs font-bold text-right cursor-pointer flex items-center gap-2 transition-colors"
                >
                  <BookOpen className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="truncate">المخارج والصفات تالياً</span>
                </button>
              </div>
            </div>

            {/* Draggable / Reorderable List of Courses */}
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1 scrollbar-thin">
              <div className="text-[11px] font-bold text-slate-400">اسحب أو انقر على الأسهم لتغيير الترتيب:</div>

              {coursesList.map((c, idx) => {
                const isSelected = c.id === activeCourseId;
                const isFirst = idx === 0;
                const isLast = idx === coursesList.length - 1;

                return (
                  <div
                    key={c.id}
                    className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-amber-400/10 border-amber-400/40 shadow-sm'
                        : 'bg-slate-800/60 border-slate-700/70 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-6 h-6 rounded-full bg-slate-700/80 font-mono text-xs font-bold flex items-center justify-center text-amber-400 shrink-0">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-bold font-quran text-slate-100 truncate">
                          {c.title}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>{c.levelText || 'مقرر دراسي'}</span>
                          {isSelected && (
                            <span className="text-amber-400 font-bold">الحقيبة المفتوحة حالياً</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Up & Down Buttons */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => handleMoveCourse(c.id, 'up', e)}
                        disabled={isFirst}
                        className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer transition-colors"
                        title="تقديم لأعلى"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>

                      <button
                        onClick={(e) => handleMoveCourse(c.id, 'down', e)}
                        disabled={isLast}
                        className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer transition-colors"
                        title="تأخير لأسفل"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={() => handleSetPresetOrder('default')}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                <span>إعادة ضبط الترتيب</span>
              </button>

              <button
                onClick={() => setShowReorderModal(false)}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs cursor-pointer shadow-md transition-colors"
              >
                حفظ وإغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
