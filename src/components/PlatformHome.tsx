import React, { useState, useEffect, useMemo } from 'react';
import { Course, StudentProfile, GroupThemeConfig, CourseLevel } from '../types';
import { getAllCourses, SAKINAN_COURSE, FOUNDATIONAL_RULES_COURSE } from '../data/courses';
import { 
  getStudentProgress, 
  calculateProgressPercentage, 
  isCourseUnlocked, 
  isCoursePassed, 
  getCourseLockDetails,
  SingleCourseProgress
} from '../utils/studentProgressStorage';
import { 
  BookOpen, Trophy, ShieldCheck, Lock, Unlock, AlertTriangle, Layers, X, Briefcase, 
  Search, Share2, LogOut, Heart, ArrowLeft, Edit3, Sparkles, Filter, CheckCircle2,
  GraduationCap, Megaphone, RotateCcw, Clock, Award, Check
} from 'lucide-react';
import { WhatsAppSupport, WhatsAppUnlockRequestButton } from './WhatsAppSupport';
import { FavoriteLessonsModal } from './FavoriteLessonsModal';
import { 
  getFavoriteLessons, 
  subscribeFavoriteLessons, 
  FavoriteLessonItem 
} from '../utils/favoriteLessonsStorage';
import { getActiveThemeForStudent, subscribeGroupThemes } from '../utils/groupThemeStorage';
import { InstituteLogo } from './InstituteLogo';
import { 
  HomeConfig, 
  getHomeConfig, 
  subscribeHomeConfig, 
  saveHomeConfig, 
  resetHomeConfig 
} from '../utils/homeConfigStorage';
import { HomeCustomizerModal } from './HomeCustomizerModal';
import { updateStudentEnrolledCourse } from '../utils/studentStorage';

interface PlatformHomeProps {
  onSelectCourse: (courseId: string) => void;
  isTeacherMode: boolean;
  onOpenTeacherDashboard: () => void;
  onOpenBagManagement?: () => void;
  onOpenProgressModal: () => void;
  studentProfile?: StudentProfile | null;
  onOpenSearch?: () => void;
  onOpenShareModal?: () => void;
  onLogout?: () => void;
  onNavigateToLesson?: (courseId: string, unitNumber: number, lessonNumber: number) => void;
}

type LevelFilter = 'all' | 'beginner' | 'intermediate' | 'advanced' | 'master';

const LEVEL_LABELS: Record<CourseLevel, { title: string; subtitle: string; color: string; badgeBg: string; textCol: string }> = {
  beginner: {
    title: 'المستوى الأول: مبتدئ (تأسيسي)',
    subtitle: 'أصول التلاوة والتأسيس التجويدي',
    color: 'emerald',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300',
    textCol: 'text-emerald-700 dark:text-emerald-400'
  },
  intermediate: {
    title: 'المستوى الثاني: متوسط',
    subtitle: 'أحكام الإدغام العام: المتماثلين والمتجانسين والمتقاربين',
    color: 'amber',
    badgeBg: 'bg-amber-50 dark:bg-amber-500/10 border-amber-300 dark:border-amber-500/30 text-amber-900 dark:text-amber-300',
    textCol: 'text-amber-700 dark:text-amber-400'
  },
  advanced: {
    title: 'المستوى الثالث: متقدم',
    subtitle: 'مخارج الحروف وصفاتها ودقائق التحريرات الصوتية',
    color: 'blue',
    badgeBg: 'bg-sky-50 dark:bg-sky-500/10 border-sky-300 dark:border-sky-500/30 text-sky-800 dark:text-sky-300',
    textCol: 'text-sky-700 dark:text-sky-400'
  },
  master: {
    title: 'المستوى الرابع: متميز (متقن / إجازة)',
    subtitle: 'منظومة الجزرية وطرق القراءات والإجازة بالسند المتصل',
    color: 'purple',
    badgeBg: 'bg-purple-50 dark:bg-purple-500/10 border-purple-300 dark:border-purple-500/30 text-purple-800 dark:text-purple-300',
    textCol: 'text-purple-700 dark:text-purple-400'
  }
};

export const PlatformHome: React.FC<PlatformHomeProps> = ({
  onSelectCourse,
  isTeacherMode,
  onOpenTeacherDashboard,
  onOpenBagManagement,
  onOpenProgressModal,
  studentProfile,
  onOpenSearch,
  onOpenShareModal,
  onLogout,
  onNavigateToLesson,
}) => {
  const [lockedCourseModal, setLockedCourseModal] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<FavoriteLessonItem[]>(() => getFavoriteLessons());
  const [isFavoritesModalOpen, setIsFavoritesModalOpen] = useState<boolean>(false);
  const [homeConfig, setHomeConfig] = useState<HomeConfig>(() => getHomeConfig());
  const [isCustomizerOpen, setIsCustomizerOpen] = useState<boolean>(false);
  const [selectedLevel, setSelectedLevel] = useState<LevelFilter>('all');
  const [viewStyle, setViewStyle] = useState<'grid' | 'grouped'>(() => {
    return getHomeConfig().defaultViewMode === 'by_level' ? 'grouped' : 'grid';
  });
  const [showBagSwitchModal, setShowBagSwitchModal] = useState<boolean>(false);

  const [activeTheme, setActiveTheme] = useState<GroupThemeConfig | null>(() => {
    return getActiveThemeForStudent(studentProfile?.group);
  });

  useEffect(() => {
    setActiveTheme(getActiveThemeForStudent(studentProfile?.group));
  }, [studentProfile?.group]);

  useEffect(() => {
    const unsubThemes = subscribeGroupThemes(() => {
      setActiveTheme(getActiveThemeForStudent(studentProfile?.group));
    });
    return () => unsubThemes();
  }, [studentProfile?.group]);

  useEffect(() => {
    const unsubFavs = subscribeFavoriteLessons((favs) => {
      setFavorites(favs);
    });
    const unsubHome = subscribeHomeConfig((cfg) => {
      setHomeConfig(cfg);
    });
    return () => {
      unsubFavs();
      unsubHome();
    };
  }, []);

  const allRawCourses = getAllCourses();

  // Merge courses with HomeConfig overrides and filter visibility
  const courses = useMemo(() => {
    return allRawCourses
      .map((c) => {
        const custom = homeConfig.curriculumConfigs[c.id];
        if (!custom) return c;
        return {
          ...c,
          title: custom.customTitle || c.title,
          badge: custom.customBadge || c.badge,
          description: custom.customDescription || c.description,
          level: custom.levelOverride || c.level || 'beginner',
          levelText: custom.levelText || c.levelText,
          order: custom.order !== undefined ? custom.order : (c.order || 99),
        };
      })
      .filter((c) => {
        // Teacher always sees all; students only see visible ones
        if (isTeacherMode) return true;
        const custom = homeConfig.curriculumConfigs[c.id];
        return custom?.isVisible !== false;
      })
      .sort((a, b) => (a.order || 99) - (b.order || 99));
  }, [allRawCourses, homeConfig, isTeacherMode]);

  // Determine the student's active enrolled / in-progress bag
  const currentActiveCourse = useMemo(() => {
    // 1. Explicitly enrolled course in student profile
    if (studentProfile?.enrolledCourseId) {
      const match = courses.find((c) => c.id === studentProfile.enrolledCourseId);
      if (match) return match;
    }

    // 2. Course with highest completed units or most recent activity
    let bestCourse: Course | null = null;
    let maxCompleted = -1;
    let latestActivity = 0;

    courses.forEach((c) => {
      const prog = getStudentProgress(c.id);
      const completedCount = prog.completedUnitNumbers?.length || 0;
      const lastUp = prog.lastUpdated || 0;

      if (completedCount > maxCompleted || (completedCount === maxCompleted && lastUp > latestActivity)) {
        if (completedCount > 0 || lastUp > 0) {
          maxCompleted = completedCount;
          latestActivity = lastUp;
          bestCourse = c;
        }
      }
    });

    if (bestCourse) return bestCourse;

    // 3. Fallback to featured course in HomeConfig, or Foundational Rules
    const featured = courses.find((c) => c.id === homeConfig.featuredCourseId);
    return featured || courses[0] || FOUNDATIONAL_RULES_COURSE;
  }, [courses, studentProfile?.enrolledCourseId, homeConfig.featuredCourseId]);

  const currentCourseProgress: SingleCourseProgress = getStudentProgress(currentActiveCourse.id);
  const currentCourseTotalUnits = currentActiveCourse.units?.length || 5;
  const currentCoursePct = calculateProgressPercentage(currentCourseProgress, currentCourseTotalUnits);
  const currentCourseCompletedUnitsCount = (currentCourseProgress.completedUnitNumbers || []).length;
  const currentCourseLockDetails = getCourseLockDetails(currentActiveCourse.id, isTeacherMode, currentActiveCourse);

  const handleCourseClick = (course: Course) => {
    const unlocked = isCourseUnlocked(course.id, isTeacherMode, course);
    if (!unlocked) {
      setLockedCourseModal(course.id);
    } else {
      onSelectCourse(course.id);
    }
  };

  const handleSwitchActiveCourse = async (courseId: string) => {
    await updateStudentEnrolledCourse(courseId);
    setShowBagSwitchModal(false);
  };

  const selectedLockedCourse = courses.find((c) => c.id === lockedCourseModal);
  const isSakinanDone = isCoursePassed('sakinan');

  // Filter courses by level if a specific level is selected
  const filteredCourses = useMemo(() => {
    if (selectedLevel === 'all') return courses;
    return courses.filter((c) => (c.level || 'beginner') === selectedLevel);
  }, [courses, selectedLevel]);

  // Partition filtered courses into Unlocked (First) and Locked / Upcoming (Second)
  const { unlockedCourses, lockedOrUpcomingCourses } = useMemo(() => {
    const unlocked: Course[] = [];
    const locked: Course[] = [];

    filteredCourses.forEach((c) => {
      const lockDetails = getCourseLockDetails(c.id, isTeacherMode, c);
      if (lockDetails.isUnlocked) {
        unlocked.push(c);
      } else {
        locked.push(c);
      }
    });

    return {
      unlockedCourses: unlocked,
      lockedOrUpcomingCourses: locked,
    };
  }, [filteredCourses, isTeacherMode]);

  const totalUnlockedCoursesCount = useMemo(() => {
    return courses.filter((c) => isCourseUnlocked(c.id, isTeacherMode, c)).length;
  }, [courses, isTeacherMode]);

  // Group courses by level for the structured level view
  const groupedCoursesByLevel = useMemo(() => {
    const levels: CourseLevel[] = ['beginner', 'intermediate', 'advanced', 'master'];
    return levels.map((lvl) => {
      const list = courses.filter((c) => (c.level || 'beginner') === lvl);
      // Sort unlocked first within each level group
      const sorted = [...list].sort((a, b) => {
        const unlA = isCourseUnlocked(a.id, isTeacherMode, a) ? 0 : 1;
        const unlB = isCourseUnlocked(b.id, isTeacherMode, b) ? 0 : 1;
        return unlA - unlB;
      });
      return {
        level: lvl,
        info: LEVEL_LABELS[lvl],
        coursesList: sorted,
      };
    });
  }, [courses, isTeacherMode]);

  // Overall student stats across all courses
  const totalCompletedUnitsAllCourses = useMemo(() => {
    return courses.reduce((acc, c) => {
      const p = getStudentProgress(c.id);
      return acc + (p.completedUnitNumbers?.length || 0);
    }, 0);
  }, [courses]);

  // Unified responsive card renderer for both light and dark mode
  const renderCourseCard = (course: Course, isUnlocked: boolean) => {
    const prog = getStudentProgress(course.id);
    const totalUnits = course.units && course.units.length > 0 ? course.units.length : 3;
    const pct = calculateProgressPercentage(prog, totalUnits);
    const isComingSoon = course.status === 'coming_soon';
    const isPaid = course.pricing?.isPaid ?? false;
    const lockDetails = getCourseLockDetails(course.id, isTeacherMode, course);
    const lvlInfo = LEVEL_LABELS[course.level || 'beginner'];
    const completedCount = prog.completedUnitNumbers?.length || 0;
    const isCurrentActive = course.id === currentActiveCourse.id;

    return (
      <div
        key={course.id}
        className={`border rounded-2xl p-5 sm:p-6 transition-all duration-200 flex flex-col justify-between space-y-5 ${
          isUnlocked
            ? 'bg-[#FFFDF8] dark:bg-slate-900 border-[#DFD6C0] dark:border-emerald-500/40 hover:border-emerald-600 dark:hover:border-emerald-400 shadow-xs hover:shadow-md'
            : 'bg-[#F4EFE2]/90 dark:bg-slate-900/60 border-[#E2D8C1] dark:border-slate-800 hover:border-[#D5CAAe] dark:hover:border-slate-700'
        }`}
      >
        {/* Card Header & Content */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2 text-xs flex-wrap">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-lg text-[11px] font-bold border ${lvlInfo.badgeBg}`}>
                {lvlInfo.title.split(':')[1] || lvlInfo.title}
              </span>

              <span className="text-slate-500 dark:text-slate-400 font-tajawal text-[11px]">
                {course.badge}
              </span>

              {isCurrentActive && (
                <span className="text-[10px] bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 px-1.5 py-0.5 rounded-md font-bold">
                  حقيبتك النشطة ✓
                </span>
              )}
            </div>

            <span className={`text-[11px] font-bold flex items-center gap-1.5 px-2.5 py-0.5 rounded-full ${
              isUnlocked 
                ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
            }`}>
              {isUnlocked ? (
                <>
                  <Unlock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>مفتوحة ومصرح بها 🟢</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
                  <span>{lockDetails.badgeText}</span>
                </>
              )}
            </span>
          </div>

          <div>
            <h3 className="text-lg sm:text-xl font-bold font-quran text-slate-900 dark:text-slate-100 leading-snug">
              {course.title}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed line-clamp-2">
              {course.description}
            </p>
          </div>

          {/* Quick metadata line */}
          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 pt-1 flex-wrap">
            <span className="flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{course.units ? `${course.units.length} أبواب مقررة` : 'أبواب تخصصية'}</span>
            </span>
            <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
            <span>اختبار تدريبي وشامل</span>
            <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
            <span>شهادة إتمام معتمدة</span>
          </div>

          {/* If locked, show explicit requirement explanation right on the card */}
          {!isUnlocked && (
            <div className="mt-2 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold block text-[11px]">متطلب الفتح:</span>
                <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-300">
                  {lockDetails.explanation}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Card Bottom Progress & Entry Button */}
        <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          {!isComingSoon && (!isPaid || isUnlocked) && (
            <div className="space-y-1 text-xs">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span>
                  {pct > 0 ? (
                    <>الأبواب المنجزة: <strong className="font-mono text-emerald-700 dark:text-emerald-400">{completedCount}</strong> من {totalUnits}</>
                  ) : (
                    <span>لم تبدأ بعد</span>
                  )}
                </span>
                <span className="font-mono text-amber-600 dark:text-amber-300 font-bold">{pct}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-l from-emerald-500 to-emerald-600 transition-all duration-300 rounded-full"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <button
              onClick={() => {
                if (isComingSoon) {
                  onSelectCourse(course.id);
                } else {
                  handleCourseClick(course);
                }
              }}
              className={`w-full font-bold font-tajawal py-2.5 px-4 rounded-xl text-xs sm:text-sm transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer ${
                isComingSoon
                  ? 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  : isPaid && !isUnlocked
                  ? 'bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/60 dark:hover:bg-amber-900 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700'
                  : !isUnlocked
                  ? 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  : 'bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white shadow-xs'
              }`}
            >
              {isComingSoon ? (
                <>
                  <Lock className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  <span>معاينة محاور الحقيبة (قريباً)</span>
                </>
              ) : isPaid && !isUnlocked ? (
                <>
                  <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>الحقيبة مدفوعة ومقفلة (عرض التفاصيل)</span>
                </>
              ) : !isUnlocked ? (
                <>
                  <Lock className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  <span>معاينة محاور الحقيبة والشروط</span>
                </>
              ) : (
                <>
                  <span>{pct > 0 ? 'متابعة دراسة الحقيبة' : 'دخول الحقيبة والبدء'}</span>
                  <ArrowLeft className="w-4 h-4" />
                </>
              )}
            </button>

            {!isUnlocked && (
              <WhatsAppUnlockRequestButton
                courseTitle={course.title}
                studentName={studentProfile?.name}
                size="sm"
                className="w-full justify-center"
              />
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-7 animate-fadeIn font-tajawal dir-rtl max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
      
      {/* Teacher Custom Announcement Banner (if enabled) */}
      {homeConfig.showAnnouncement && homeConfig.announcementText && (
        <div className={`p-4 rounded-2xl border text-xs sm:text-sm flex items-start justify-between gap-3 shadow-xs animate-fadeIn ${
          homeConfig.announcementType === 'emerald' ? 'bg-emerald-950/70 border-emerald-800 text-emerald-200' :
          homeConfig.announcementType === 'info' ? 'bg-sky-950/70 border-sky-800 text-sky-200' :
          homeConfig.announcementType === 'warning' ? 'bg-amber-950/70 border-amber-800 text-amber-200' :
          'bg-purple-950/70 border-purple-800 text-purple-200'
        }`}>
          <div className="flex items-start gap-3">
            <Megaphone className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold text-[11px] uppercase tracking-wider block opacity-90">
                إعلان وإرشاد أكاديمي
              </span>
              <p className="leading-relaxed font-normal">
                {homeConfig.announcementText}
              </p>
            </div>
          </div>
          {isTeacherMode && (
            <button
              onClick={() => setIsCustomizerOpen(true)}
              className="text-[11px] underline opacity-75 hover:opacity-100 shrink-0 cursor-pointer"
            >
              تعديل الإعلان
            </button>
          )}
        </div>
      )}

      {/* Main Calm Platform Header Banner */}
      <div className="bg-gradient-to-br from-[#122820] via-[#0f201a] to-[#173228] text-amber-50 rounded-2xl p-6 sm:p-8 border border-amber-600/30 shadow-md relative overflow-hidden">
        
        {/* Top subtle golden-emerald gradient indicator */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500/70 via-emerald-500/70 to-amber-500/70" />

        <div className="relative z-10 max-w-3xl space-y-4">
          
          {/* Metadata & Institute Branding */}
          <div className="flex items-center gap-2.5 text-xs text-amber-200/70 flex-wrap">
            <span className="text-amber-400 font-bold font-quran">
              {homeConfig.platformBadgeText || 'المنصة التفاعلية الموحدة'}
            </span>
            <span aria-hidden="true" className="text-emerald-700">·</span>
            <span className="text-stone-300">{homeConfig.authorText || 'جمع وإعداد: أحمد إبراهيم'}</span>
            
            {activeTheme && (
              <>
                <span aria-hidden="true" className="text-emerald-700">·</span>
                <span className="text-amber-100 flex items-center gap-1.5">
                  <InstituteLogo theme={activeTheme} className="w-3.5 h-3.5" iconClassName="w-3 h-3 text-amber-400" />
                  <span>{activeTheme.instituteName}</span>
                  <span className="text-emerald-300/60 font-mono">({activeTheme.groupName})</span>
                </span>
              </>
            )}

            {isTeacherMode && (
              <>
                <span aria-hidden="true" className="text-emerald-700">·</span>
                <span className="text-amber-400 font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>وضع المعلم مفعّل</span>
                </span>
              </>
            )}
          </div>

          <h1 className="text-xl sm:text-3xl font-bold font-quran text-amber-50 leading-tight">
            {homeConfig.mainTitle || 'المناهج التعليمية المقررة لمادة التجويد والقراءات'}
          </h1>

          <p className="text-xs sm:text-sm text-stone-200 leading-relaxed max-w-2xl font-normal">
            {homeConfig.introParagraph || 'منظومة مناهج متكاملة ومحققة في علم التجويد والقراءات؛ تبدأ بالحقيبة التأسيسية الأولى (أصول التلاوة)، وتتوالى الحقائب التالية تباعاً بالتمرير والاستيفاء المنهجي.'}
          </p>

          {/* Quick Actions & Navigation Bar */}
          <div className="pt-2 flex flex-wrap items-center gap-2.5 text-xs font-tajawal">
            
            <button
              onClick={onOpenProgressModal}
              className="bg-emerald-950/80 hover:bg-emerald-900 text-amber-300 border border-amber-500/30 font-bold px-4 py-2 rounded-xl transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>لوحة التقدم وإحصائياتي</span>
            </button>

            {/* Favorite Lessons */}
            {homeConfig.showFavoritesStrip && (
              <button
                onClick={() => setIsFavoritesModalOpen(true)}
                className="bg-emerald-950/60 hover:bg-emerald-900 text-amber-100 hover:text-white border border-emerald-800/80 px-3.5 py-2 rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
                title="عرض دروسي المفضلة"
              >
                <Heart className={`w-3.5 h-3.5 ${favorites.length > 0 ? 'fill-rose-400 text-rose-400' : 'text-stone-300'}`} />
                <span>دروسي المفضلة</span>
                {favorites.length > 0 && (
                  <span className="text-amber-300/80 font-mono text-[11px]">({favorites.length})</span>
                )}
              </button>
            )}

            {onOpenSearch && (
              <button
                onClick={onOpenSearch}
                className="bg-emerald-950/60 hover:bg-emerald-900 text-amber-100 hover:text-white border border-emerald-800/80 px-3.5 py-2 rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
                title="البحث السريع في شواهد وقواعد المنصة"
              >
                <Search className="w-3.5 h-3.5 text-amber-300" />
                <span>البحث في المحتوى</span>
              </button>
            )}

            {onOpenShareModal && (
              <button
                onClick={onOpenShareModal}
                className="text-stone-300 hover:text-white hover:bg-emerald-950/50 px-3 py-2 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer text-xs"
                title="مشاركة إنجازك الدراسي"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>مشاركة الإنجاز</span>
              </button>
            )}

            {/* Teacher Dashboard & Edit Home Controls */}
            {isTeacherMode && (
              <div className="flex items-center gap-2 mr-auto">
                <button
                  onClick={() => setIsCustomizerOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer text-xs shadow-xs"
                  title="تعديل نصوص الصفحة والمناهج وإعلانات الطلاب"
                >
                  <Edit3 className="w-3.5 h-3.5 text-emerald-200" />
                  <span>تعديل واجهة الهوم والمناهج</span>
                </button>

                <button
                  onClick={onOpenTeacherDashboard}
                  className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer text-xs"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>لوحة المعلم</span>
                </button>

                {onOpenBagManagement && (
                  <button
                    onClick={onOpenBagManagement}
                    className="text-slate-400 hover:text-slate-200 hover:bg-slate-800 px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer text-xs"
                  >
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>إدارة الحقائب</span>
                  </button>
                )}
              </div>
            )}

            {studentProfile?.name && onLogout && !isTeacherMode && (
              <button
                onClick={onLogout}
                className="text-slate-500 hover:text-rose-400 hover:bg-slate-800/80 px-2.5 py-2 rounded-xl transition-colors flex items-center gap-1 cursor-pointer text-xs mr-auto"
                title="تسجيل الخروج من الحساب"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>خروج ({studentProfile.name})</span>
              </button>
            )}

          </div>

        </div>
      </div>

      {/* LEVEL-BASED CONTROLS & CURRICULUM DISPLAY */}
      <div className="space-y-6 pt-1">
        
        {/* Controls Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800/80 pb-4">
          
          {/* Section Title & Highlights */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <BookOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <h2 className="text-lg sm:text-xl font-bold font-quran text-slate-900 dark:text-slate-100">
                الحقائب التجويدية المقررة كافة
              </h2>
              <span className="text-xs bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full font-bold">
                {totalUnlockedCoursesCount} مفتوحة للدراسة
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                (من أصل {courses.length} مساقات)
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              تبدأ المنظومة بالحقائب المتاحة لك مباشرة، وبالتمرير لأسفل تستعرض باقي الحقائب المقررة وقيد الفتح.
            </p>
          </div>

          {/* View Toggle: Sequential vs Grouped by Level */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1 flex items-center text-xs">
              <button
                onClick={() => setViewStyle('grid')}
                className={`px-3 py-1.5 rounded-lg transition-colors font-medium cursor-pointer ${
                  viewStyle === 'grid'
                    ? 'bg-white dark:bg-slate-800 text-emerald-800 dark:text-amber-300 font-bold shadow-xs border border-slate-200 dark:border-slate-700'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                عرض متسلسل (المفتوحة أولاً)
              </button>
              <button
                onClick={() => setViewStyle('grouped')}
                className={`px-3 py-1.5 rounded-lg transition-colors font-medium cursor-pointer ${
                  viewStyle === 'grouped'
                    ? 'bg-white dark:bg-slate-800 text-emerald-800 dark:text-amber-300 font-bold shadow-xs border border-slate-200 dark:border-slate-700'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                مجمعة حسب المستويات
              </button>
            </div>
          </div>

        </div>

        {/* Level Filter Tabs (Wrapped & Accessible) */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-700 dark:text-slate-400 flex items-center gap-1.5 ml-1 font-bold shrink-0">
            <Filter className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>تصفية المستوى:</span>
          </span>

          {[
            { id: 'all', label: 'الكل (جميع الحقائب)' },
            { id: 'beginner', label: '🟢 مبتدئ (تأسيسي)' },
            { id: 'intermediate', label: '🟡 متوسط' },
            { id: 'advanced', label: '🔵 متقدم' },
            { id: 'master', label: '🟣 متميز (متقن)' },
          ].map((tab) => {
            const isSelected = selectedLevel === tab.id;
            const count = tab.id === 'all' 
              ? courses.length 
              : courses.filter((c) => (c.level || 'beginner') === tab.id).length;

            return (
              <button
                key={tab.id}
                onClick={() => setSelectedLevel(tab.id as LevelFilter)}
                className={`px-3.5 py-1.5 rounded-xl font-medium transition-all cursor-pointer border flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-emerald-800 dark:bg-emerald-900/90 text-amber-200 dark:text-amber-300 border-emerald-700 dark:border-emerald-600/80 font-bold shadow-xs scale-[1.02]'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-emerald-800 dark:hover:text-white border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-slate-700'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md ${
                  isSelected 
                    ? 'bg-emerald-950/60 text-amber-200' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* VIEW 1: SEQUENTIAL DISPLAY (OPEN BAGS FIRST, THEN SCROLL TO LOCKED ONES) */}
        {viewStyle === 'grid' && (
          <div className="space-y-8 pt-2">
            
            {/* SECTION 1: ALL OPEN (UNLOCKED) BAGS FIRST */}
            <div className="space-y-4">
              <div className="bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Unlock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold font-quran text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <span>الحقائب المفتوحة والمتاحة للدراسة الآن</span>
                      <span className="text-xs bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 px-2.5 py-0.5 rounded-full font-bold">
                        {unlockedCourses.length} حقائب متاحة
                      </span>
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      حقائب مفتوحة ومصرح لك بدخولها فوراً دون قيود؛ اختر أياً منها للبدء ومتابعة الدراسة:
                    </p>
                  </div>
                </div>
              </div>

              {unlockedCourses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {unlockedCourses.map((c) => renderCourseCard(c, true))}
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500 text-xs">
                  لا توجد حقائب مفتوحة في هذا المستوى المختار.
                </div>
              )}
            </div>

            {/* SECTION 2: SEQUENTIAL / LOCKED / UPCOMING BAGS (ACCESSIBLE VIA SCROLLING) */}
            {lockedOrUpcomingCourses.length > 0 && (
              <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                <div className="bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 flex items-center justify-center shrink-0">
                      <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold font-quran text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <span>الحقائب المقررة التالية وقيد الفتح</span>
                        <span className="text-xs bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-0.5 rounded-full font-bold">
                          {lockedOrUpcomingCourses.length} حقائب
                        </span>
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        تفتح هذه الحقائب التخصصية تباعاً باجتياز متطلبات الحقائب السابقة أو بإذن المعلم:
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {lockedOrUpcomingCourses.map((c) => renderCourseCard(c, false))}
                </div>
              </div>
            )}

          </div>
        )}

        {/* VIEW 2: GROUPED BY LEVEL VIEW (عرض مجمع حسب المستويات) */}
        {viewStyle === 'grouped' && (
          <div className="space-y-8 pt-2">
            {groupedCoursesByLevel.map((group) => {
              if (group.coursesList.length === 0) return null;

              return (
                <div key={group.level} className="space-y-4">
                  {/* Level Group Header */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border ${group.info.badgeBg}`}>
                          {group.info.title}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                          ({group.coursesList.length} حقائب)
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 font-normal">
                        {group.info.subtitle}
                      </p>
                    </div>
                  </div>

                  {/* Group Courses Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {group.coursesList.map((course) => {
                      const unlocked = isCourseUnlocked(course.id, isTeacherMode, course);
                      return renderCourseCard(course, unlocked);
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* WhatsApp Support Section Card */}
      <WhatsAppSupport variant="card" />

      {/* Locked Course Modal */}
      {lockedCourseModal && selectedLockedCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fadeIn font-tajawal dir-rtl">
          <div className="bg-slate-900 text-slate-100 rounded-2xl max-w-lg w-full p-6 sm:p-7 border border-slate-800 shadow-xl space-y-5 text-right relative">
            <button
              onClick={() => setLockedCourseModal(null)}
              className="absolute top-4 left-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold font-quran text-slate-100">
                  {selectedLockedCourse.title}
                </h3>
                <p className="text-xs text-slate-400 font-tajawal">
                  {selectedLockedCourse.badge || 'حقيبة تدريبية تخصصية'}
                </p>
              </div>
            </div>

            <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800 text-xs sm:text-sm text-slate-300 space-y-2 leading-relaxed font-tajawal">
              <p className="font-bold text-amber-400 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>شروط ومتطلبات فتح الحقيبة:</span>
              </p>

              {selectedLockedCourse.pricing?.isPaid ? (
                <div className="space-y-2">
                  <p>
                    هذه الحقيبة <strong>محتوى مدفوع ({selectedLockedCourse.pricing.priceText || 'اشتراك خاص'})</strong> ومقفلة حالياً.
                  </p>
                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-xs text-slate-300 space-y-1">
                    <p>✨ تُفتح الوحدات والاختبار فور موافقة المعلم واعتماد الوصول.</p>
                    <p className="text-slate-400">يمكنك معاينة تفاصيل محاور الحقيبة، والتواصل مع المعلم للاشتراك.</p>
                  </div>
                </div>
              ) : selectedLockedCourse.id === 'idgham' ? (
                <div className="space-y-2">
                  <p>
                    طبقاً للمنهاج التعليمي، تُفتح هذه الحقيبة تلقائياً بعد <strong>إتمام ودراسة الحقائب التأسيسية الأولى</strong> واجتياز الاختبار النهائي بنسبة <strong>90% فأكثر</strong> أو بإذن المعلم المباشر.
                  </p>
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                    <span>حالة دراسة الحقائب التأسيسية:</span>
                    <span className={(isCoursePassed('foundational_rules') || isSakinanDone) ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                      {(isCoursePassed('foundational_rules') || isSakinanDone) ? 'تم الاجتياز بنجاح ✓' : 'لم يتم اجتياز الاختبار بعد'}
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

            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
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
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-2.5 px-4 rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer border border-slate-700"
              >
                <span>معاينة محاور الحقيبة</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setLockedCourseModal(null)}
                className="bg-slate-950 hover:bg-slate-800 text-slate-400 py-2.5 px-4 rounded-xl text-xs transition-colors cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Switch Active Bag Modal for Student */}
      {showBagSwitchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fadeIn font-tajawal dir-rtl">
          <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-slate-100 text-sm">
                  تحديد حقيبتك النشطة المقررة حالياً
                </h3>
              </div>
              <button
                onClick={() => setShowBagSwitchModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              اختر الحقيبة التجويدية التي تود التركيز عليها حالياً لتثبيتها في صدارة واجهتك مع متابعة تقدمك:
            </p>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {courses.map((c) => {
                const isSelected = c.id === currentActiveCourse.id;
                const lvlInfo = LEVEL_LABELS[c.level || 'beginner'];
                return (
                  <button
                    key={c.id}
                    onClick={() => handleSwitchActiveCourse(c.id)}
                    className={`w-full text-right p-3 rounded-xl border transition-colors cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-emerald-950/40 border-emerald-600/50 text-emerald-300 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold font-quran">{c.title}</div>
                      <div className="text-[11px] text-slate-400">{lvlInfo.title}</div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                  </button>
                );
              })}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowBagSwitchModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs transition-colors"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Teacher Home Customizer Modal */}
      {isTeacherMode && (
        <HomeCustomizerModal
          isOpen={isCustomizerOpen}
          onClose={() => setIsCustomizerOpen(false)}
          config={homeConfig}
          courses={courses}
          onSave={async (updated) => {
            await saveHomeConfig(updated, studentProfile?.name || 'المعلم');
          }}
          onReset={async () => {
            await resetHomeConfig();
          }}
          currentAuthorName={studentProfile?.name}
        />
      )}

      {/* Favorite Lessons Modal */}
      <FavoriteLessonsModal
        isOpen={isFavoritesModalOpen}
        onClose={() => setIsFavoritesModalOpen(false)}
        onSelectLesson={(courseId, unitNumber, lessonNumber) => {
          if (onNavigateToLesson) {
            onNavigateToLesson(courseId, unitNumber, lessonNumber);
          } else {
            onSelectCourse(courseId);
          }
        }}
      />

    </div>
  );
};
