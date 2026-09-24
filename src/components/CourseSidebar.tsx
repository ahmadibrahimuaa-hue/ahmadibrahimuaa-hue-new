import React, { useState, useEffect } from 'react';
import { Course, StudentProfile } from '../types';
import { getAllCourses } from '../data/courses';
import { isCourseUnlocked } from '../utils/studentProgressStorage';
import { 
  BookOpen, Book, GraduationCap, Table, Bookmark, ShieldAlert, Award, 
  BookMarked, ChevronDown, ChevronRight, X, Lock, CheckCircle2, 
  Search, Heart, FileText, Calendar, Trophy, Grid, Layers, UserCheck
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
}) => {
  const [coursesDropdownOpen, setCoursesDropdownOpen] = useState(false);
  const [unitsExpanded, setUnitsExpanded] = useState(true);

  // Close sidebar on Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const allCourses = getAllCourses();

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

        {/* Current Course Selector Box */}
        <div className="p-3 border-b border-slate-800/80 bg-slate-950/20 shrink-0">
          <div className="relative">
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
              <div className="absolute top-full right-0 left-0 mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1.5 z-50 text-right space-y-0.5 animate-fadeIn max-h-56 overflow-y-auto">
                {allCourses.map((c) => {
                  const unlocked = isCourseUnlocked(c.id, isTeacherMode, c);
                  const isSelected = c.id === activeCourseId;
                  return (
                    <button
                      key={c.id}
                      onClick={() => {
                        onSelectCourse(c.id);
                        setCoursesDropdownOpen(false);
                      }}
                      className={`w-full text-right px-2.5 py-2 rounded-lg text-xs transition-colors flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-amber-400/10 text-amber-300 font-bold border border-amber-400/20'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span className="truncate flex items-center gap-1.5">
                        {!unlocked && !isTeacherMode && <Lock className="w-3 h-3 text-slate-500 shrink-0" />}
                        <span className="truncate">{c.shortTitle || c.title}</span>
                      </span>
                      {isSelected && <span className="text-[10px] text-amber-400">مختارة</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Scrollable Navigation List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4 scrollbar-thin">
          
          {/* Section 1: Main Curriculum */}
          <div className="space-y-1">
            <div className="text-[11px] font-bold text-slate-400 px-2 py-1 flex items-center justify-between">
              <span>المسار التعليمي والدروس</span>
            </div>

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
    </>
  );
};
