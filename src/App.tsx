import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { CoverView } from './components/CoverView';
import { UnitView } from './components/UnitView';
import { ExceptionWordsView } from './components/ExceptionWordsView';
import { ExamplesView } from './components/ExamplesView';
import { ErrorCorrectionView } from './components/ErrorCorrectionView';
import { SummaryTableView } from './components/SummaryTableView';
import { ComprehensiveExamView } from './components/ComprehensiveExamView';
import { RulesCheatSheet } from './components/RulesCheatSheet';
import { BooksView } from './components/BooksView';
import { StudentBar } from './components/StudentBar';
import { PlatformHome } from './components/PlatformHome';
import { TeacherDashboardModal } from './components/TeacherDashboardModal';
import { TeacherAuthModal } from './components/TeacherAuthModal';
import { StudentProgressModal } from './components/StudentProgressModal';
import { StudentRegistrationModal } from './components/StudentRegistrationModal';
import { LockedCoursePreview } from './components/LockedCoursePreview';
import { BagManagementPanel } from './components/BagManagementPanel';
import { BadgeEarnedToast } from './components/BadgeEarnedToast';
import { QuranFontModal } from './components/QuranFontModal';
import { getStudentProgress, subscribeStudentProgress, calculateProgressPercentage, markSectionRead, isCourseUnlocked, isCoursePassed } from './utils/studentProgressStorage';
import { getStudentProfile, subscribeStudentProfile } from './utils/studentStorage';
import { getCurrentAuthTrainer, setCurrentAuthTrainer, SUPER_ADMIN_ACCOUNT, subscribeTrainers, getAllTrainersAsync, clearStaleAuthSessions } from './utils/trainerStorage';
import { getAllCourses, SAKINAN_COURSE, getCourseById } from './data/courses';
import { subscribeCourses } from './utils/courseCustomStorage';
import { Course, StudentProfile, TrainerAccount } from './types';
import { SUMMARY_TABLE_DATA } from './data/summaryData';
import { WhatsAppSupport, FloatingWhatsAppSupport } from './components/WhatsAppSupport';
import { SakinanSearchBar } from './components/SakinanSearchBar';
import { SakinanSearchResult } from './utils/sakinanSearchEngine';
import { ShareAchievementModal } from './components/ShareAchievementModal';
import { logoutStudent } from './utils/studentStorage';
import { 
  BookOpen, GraduationCap, Table, Bookmark, Book, 
  Layers, ChevronRight, ChevronLeft, ShieldCheck, Lock, CheckCircle2, X, AlertTriangle, ArrowLeft, Briefcase, Award,
  Search, Share2, LogOut
} from 'lucide-react';

export default function App() {
  const [coursesList, setCoursesList] = useState<Course[]>(() => getAllCourses());
  const [activeCourseId, setActiveCourseId] = useState<string>('sakinan');
  const [activeTab, setActiveTab] = useState<string>('cover');
  const [selectedUnitIndex, setSelectedUnitIndex] = useState<number>(0);
  const [isExamActive, setIsExamActive] = useState<boolean>(false);
  const [showBagManagementModal, setShowBagManagementModal] = useState<boolean>(false);
  const [showFontModal, setShowFontModal] = useState<boolean>(false);
  const [showSearchModal, setShowSearchModal] = useState<boolean>(false);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [showLogoutConfirmModal, setShowLogoutConfirmModal] = useState<boolean>(false);

  // Keyboard shortcut (Ctrl+K or Cmd+K) to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowSearchModal((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSelectSearchResult = (result: SakinanSearchResult) => {
    setShowSearchModal(false);
    setActiveCourseId('sakinan');
    setActiveTab(result.targetTab);
    if (result.unitIndex !== undefined) {
      setSelectedUnitIndex(result.unitIndex);
    }
  };

  const handleLogout = () => {
    logoutStudent();
    setStudentProfile(null);
    setShowLogoutConfirmModal(false);
  };

  // Subscribe to dynamic courses changes
  useEffect(() => {
    const unsub = subscribeCourses((updated) => {
      setCoursesList(updated);
    });
    return () => unsub();
  }, []);

  const activeCourse: Course = getCourseById(activeCourseId) || SAKINAN_COURSE;
  const totalUnitsInCourse = activeCourse && activeCourse.units ? activeCourse.units.length : 5;

  // Night Reading Mode state
  const [isNightMode, setIsNightMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('tajweed_night_mode') === 'true';
    }
    return false;
  });

  // Student Progress Modal & percentage state
  const [showProgressModal, setShowProgressModal] = useState<boolean>(false);
  const [studentProgress, setStudentProgress] = useState(() => getStudentProgress(activeCourseId));
  const [progressPct, setProgressPct] = useState<number>(() => calculateProgressPercentage(studentProgress, totalUnitsInCourse));
  const [showExamLockedModal, setShowExamLockedModal] = useState<boolean>(false);
  const [showCourseLockedModal, setShowCourseLockedModal] = useState<boolean>(false);

  const completedUnitsCount = (studentProgress.completedUnitNumbers || []).length;

  // Default is Student Mode (false) so students see clean UI without teacher controls
  const [isTeacherMode, setIsTeacherMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('mode') === 'teacher') {
        return true;
      }
      return localStorage.getItem('tajweed_teacher_mode') === 'true';
    }
    return false;
  });

  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [showTeacherDashboard, setShowTeacherDashboard] = useState<boolean>(false);
  const [teacherDashboardTab, setTeacherDashboardTab] = useState<'submissions' | 'unit_questions' | 'exam_questions' | 'certificate' | 'trainers' | 'bag_management' | 'waitlist'>('submissions');
  const [authTrainer, setAuthTrainer] = useState<TrainerAccount | null>(() => getCurrentAuthTrainer());
  const [authRole, setAuthRole] = useState<'super_admin' | 'trainer'>(() => {
    const curr = getCurrentAuthTrainer();
    return curr?.role || (isTeacherMode ? 'super_admin' : 'trainer');
  });

  // Student Profile and Mandatory Registration Modal state
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(() => getStudentProfile());
  const [showRegistrationModal, setShowRegistrationModal] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const prof = getStudentProfile();
      const isTeacher = localStorage.getItem('tajweed_teacher_mode') === 'true';
      return !isTeacher && (!prof || !prof.name || !prof.name.trim());
    }
    return false;
  });

  // Real-time synchronization of trainers across all browsers and devices
  useEffect(() => {
    getAllTrainersAsync().catch((err) => console.error('Error fetching trainers on startup:', err));
    const unsubscribe = subscribeTrainers(() => {
      clearStaleAuthSessions();
      const curr = getCurrentAuthTrainer();
      if (curr) {
        setAuthTrainer(curr);
        setAuthRole(curr.role || 'trainer');
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    localStorage.setItem('tajweed_teacher_mode', isTeacherMode ? 'true' : 'false');
    if (isTeacherMode) {
      setShowRegistrationModal(false);
    } else {
      const prof = getStudentProfile();
      if (!prof || !prof.name || !prof.name.trim()) {
        setShowRegistrationModal(true);
      }
    }
  }, [isTeacherMode]);

  useEffect(() => {
    const handleProfileUpdate = (p: StudentProfile | null) => {
      setStudentProfile(p);
      if (!isTeacherMode && (!p || !p.name || !p.name.trim())) {
        setShowRegistrationModal(true);
      } else {
        setShowRegistrationModal(false);
      }
    };
    const unsubscribe = subscribeStudentProfile(handleProfileUpdate);
    return unsubscribe;
  }, [isTeacherMode]);

  useEffect(() => {
    localStorage.setItem('tajweed_night_mode', isNightMode ? 'true' : 'false');
    if (isNightMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isNightMode]);

  useEffect(() => {
    const updateProg = () => {
      const prog = getStudentProgress(activeCourseId);
      setStudentProgress(prog);
      setProgressPct(calculateProgressPercentage(prog, totalUnitsInCourse));
    };
    updateProg();

    const unsubscribe = subscribeStudentProgress(updateProg);
    return unsubscribe;
  }, [activeCourseId, totalUnitsInCourse]);

  useEffect(() => {
    if (['exceptions', 'examples', 'errors', 'summary', 'rules', 'books'].includes(activeTab)) {
      markSectionRead(activeTab, activeCourseId);
    }
  }, [activeTab, activeCourseId]);

  const handlePrint = () => {
    window.print();
  };

  const [, setUnlockUpdateCounter] = useState(0);

  useEffect(() => {
    const handleUnlockEvent = () => {
      setUnlockUpdateCounter((c) => c + 1);
    };
    const handleOpenShare = () => {
      setShowShareModal(true);
    };
    const handleOpenProg = () => {
      setShowProgressModal(true);
    };
    window.addEventListener('tajweed_unlocked_updated', handleUnlockEvent);
    window.addEventListener('tajweed_open_share_achievement', handleOpenShare);
    window.addEventListener('tajweed_open_progress_modal', handleOpenProg);
    return () => {
      window.removeEventListener('tajweed_unlocked_updated', handleUnlockEvent);
      window.removeEventListener('tajweed_open_share_achievement', handleOpenShare);
      window.removeEventListener('tajweed_open_progress_modal', handleOpenProg);
    };
  }, []);

  const currentUnit = activeCourse.units[selectedUnitIndex] || activeCourse.units[0];
  const isCourseActiveUnlocked = isCourseUnlocked(activeCourseId, isTeacherMode, activeCourse);
  const isComingSoon = activeCourse.status === 'coming_soon';
  const isLockedStatus = activeCourse.status === 'locked';
  const shouldShowLockedPreview = !isTeacherMode && (!isCourseActiveUnlocked || isComingSoon || isLockedStatus);

  return (
    <div className={`min-h-screen font-tajawal flex flex-col justify-between selection:bg-emerald-100 selection:text-emerald-900 transition-colors duration-300 ${
      isNightMode ? 'bg-slate-950 text-slate-100 dark' : 'bg-slate-50 text-slate-800'
    }`}>
      <div>
        {/* Header Navigation */}
        <Header
          activeCourse={activeCourse}
          onSelectCourse={(cId) => {
            setActiveCourseId(cId);
            setActiveTab('cover');
            setSelectedUnitIndex(0);
          }}
          onReturnToHome={() => setActiveTab('home')}
          onOpenBagManagement={() => setShowBagManagementModal(true)}
          activeTab={activeTab}
          setActiveTab={(tab) => {
            if (isExamActive && tab !== 'exam') return;
            if (!isTeacherMode && tab !== 'home' && (!studentProfile || !studentProfile.name || !studentProfile.name.trim())) {
              setShowRegistrationModal(true);
              return;
            }
            if (tab === 'exam' && !isTeacherMode && completedUnitsCount < totalUnitsInCourse) {
              setShowExamLockedModal(true);
            }
            setActiveTab(tab);
          }}
          isExamActive={isExamActive}
          isTeacherMode={isTeacherMode}
          setIsTeacherMode={setIsTeacherMode}
          onUnlockTeacherModal={() => setShowAuthModal(true)}
          onOpenTeacherDashboard={() => {
            setTeacherDashboardTab('submissions');
            setShowTeacherDashboard(true);
          }}
          onOpenCertificateEditor={() => {
            setTeacherDashboardTab('certificate');
            setShowTeacherDashboard(true);
          }}
          isNightMode={isNightMode}
          setIsNightMode={setIsNightMode}
          onOpenProgressModal={() => setShowProgressModal(true)}
          onOpenFontModal={() => setShowFontModal(true)}
          onOpenSearch={() => setShowSearchModal(true)}
          onOpenShareModal={() => setShowShareModal(true)}
          onLogoutStudent={() => setShowLogoutConfirmModal(true)}
          studentName={studentProfile?.name}
          progressPercentage={progressPct}
          completedUnitsCount={completedUnitsCount}
        />

        {/* Main Content Area */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          
          {/* Student Registration Bar (Only visible in Student Mode) */}
          {!isTeacherMode && activeTab !== 'home' && !shouldShowLockedPreview && (
            <div className="no-print">
              <StudentBar 
                activeCourseId={activeCourseId}
                onOpenProgressModal={() => setShowProgressModal(true)} 
                onOpenRegistrationModal={() => setShowRegistrationModal(true)}
                onOpenSearch={() => setShowSearchModal(true)}
                currentUnitNumber={currentUnit?.unitNumber}
                currentUnitTitle={currentUnit?.title}
              />
            </div>
          )}

          {/* Quick Sakinan Search Bar Trigger inside the course */}
          {activeCourseId === 'sakinan' && activeTab !== 'home' && !shouldShowLockedPreview && (
            <div className="no-print bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 rounded-2xl p-3 sm:p-4 border-2 border-amber-400/60 shadow-lg text-white flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <div className="w-9 h-9 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0">
                  <Search className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h4 className="text-sm font-bold font-quran text-amber-200">
                    البحث السريع في حقيبة «التقاء الساكنين»
                  </h4>
                  <p className="text-xs text-emerald-200/80">
                    ابحث فوراً في جميع الشواهد القرآنية، الدروس، الكلمات المستثناة، وقواعد التخلص
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowSearchModal(true)}
                className="w-full sm:w-auto bg-amber-400 hover:bg-amber-300 text-slate-950 px-5 py-2 rounded-xl font-bold font-quran text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                title="افتح شريط البحث الفوري"
              >
                <Search className="w-4 h-4 text-slate-950" />
                <span>افتح شريط البحث الفوري 🔍</span>
              </button>
            </div>
          )}

          {/* Unit Selector Bar when on 'units' tab */}
          {activeTab === 'units' && !shouldShowLockedPreview && activeCourse.units && activeCourse.units.length > 0 && (
            <div className="no-print bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-bold font-quran text-slate-800">
                <Layers className={`w-4 h-4 ${activeCourseId === 'idgham' ? 'text-purple-700' : 'text-emerald-800'}`} />
                <span>اختر الباب التدريبي:</span>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto text-xs">
                {activeCourse.units.map((unit, idx) => (
                  <button
                    key={unit.id}
                    onClick={() => setSelectedUnitIndex(idx)}
                    className={`px-3 py-2 rounded-xl transition-all font-bold font-quran whitespace-nowrap flex items-center gap-1.5 ${
                      selectedUnitIndex === idx
                        ? activeCourseId === 'idgham'
                          ? 'bg-indigo-950 text-amber-300 shadow-md ring-2 ring-purple-600'
                          : 'bg-emerald-900 text-amber-300 shadow-md ring-2 ring-emerald-800'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <span>الباب {unit.unitNumber}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Active View Render */}
          {activeTab === 'home' ? (
            <PlatformHome
              onSelectCourse={(cId) => {
                setActiveCourseId(cId);
                setActiveTab('cover');
                setSelectedUnitIndex(0);
              }}
              onOpenTeacherDashboard={() => setShowTeacherDashboard(true)}
              onOpenProgressModal={() => setShowProgressModal(true)}
              onOpenBagManagement={() => setShowBagManagementModal(true)}
              onOpenSearch={() => setShowSearchModal(true)}
              onOpenShareModal={() => setShowShareModal(true)}
              onLogout={() => setShowLogoutConfirmModal(true)}
              studentProfile={studentProfile}
              isTeacherMode={isTeacherMode}
            />
          ) : shouldShowLockedPreview ? (
            <LockedCoursePreview
              course={activeCourse}
              onReturnToActiveCourse={(cId) => {
                setActiveCourseId(cId || 'sakinan');
                setActiveTab('cover');
                setSelectedUnitIndex(0);
              }}
              onReturnToHome={() => {
                setActiveTab('home');
              }}
              isTeacherMode={isTeacherMode}
            />
          ) : (
            <>
              {activeTab === 'cover' && (
                <CoverView
                  course={activeCourse}
                  onStartStudy={() => {
                    if (!isTeacherMode && (!studentProfile || !studentProfile.name || !studentProfile.name.trim())) {
                      setShowRegistrationModal(true);
                      return;
                    }
                    setActiveTab('units');
                  }}
                  isTeacherMode={isTeacherMode}
                  setIsTeacherMode={setIsTeacherMode}
                  onPrint={handlePrint}
                />
              )}
              {activeTab === 'units' && (
                currentUnit ? (
                  <UnitView
                    key={`${activeCourseId}_${currentUnit.id}`}
                    unit={currentUnit}
                    course={activeCourse}
                    isTeacherMode={isTeacherMode}
                    onNavigateToExam={() => {
                      setIsExamActive(true);
                      setActiveTab('exam');
                    }}
                  />
                ) : (
                  <div className="bg-white rounded-3xl p-10 border-2 border-dashed border-emerald-300 text-center space-y-4 font-tajawal">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-800">
                      <BookOpen className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold font-quran text-slate-900">لا توجد أبواب تعليمية مضافة في هذه الحقيبة بعد</h3>
                    <p className="text-sm text-slate-600 max-w-md mx-auto">
                      يمكنك كمعلم أو مشرف إضافة الأبواب والدروس وتنظيم المحتوى بسهولة عبر لوحة إدارة الحقائب.
                    </p>
                    {isTeacherMode && (
                      <button
                        onClick={() => setShowBagManagementModal(true)}
                        className="bg-emerald-800 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl font-quran shadow-md cursor-pointer inline-flex items-center gap-2"
                      >
                        <Briefcase className="w-4 h-4" />
                        <span>فتح إدارة وتنظيم الأبواب والدروس</span>
                      </button>
                    )}
                  </div>
                )
              )}
              {activeTab === 'exceptions' && <ExceptionWordsView course={activeCourse} />}
              {activeTab === 'examples' && <ExamplesView course={activeCourse} />}
              {activeTab === 'errors' && <ErrorCorrectionView course={activeCourse} />}
              {activeTab === 'summary' && <SummaryTableView course={activeCourse} />}
              {activeTab === 'exam' && (
                <ComprehensiveExamView
                  course={activeCourse}
                  onReturnToStudy={() => {
                    setIsExamActive(false);
                    setActiveTab('units');
                  }}
                  onExamActiveChange={(isActive) => setIsExamActive(isActive)}
                  completedUnitsCount={completedUnitsCount}
                  completedUnitNumbers={studentProgress.completedUnitNumbers || []}
                  isTeacherMode={isTeacherMode}
                  examBestScore={studentProgress.examBestScore}
                />
              )}
              {activeTab === 'rules' && (
                <RulesCheatSheet
                  course={activeCourse}
                  onClose={() => setActiveTab('units')}
                  isTeacherMode={isTeacherMode}
                  authTrainer={authTrainer}
                />
              )}
              {activeTab === 'books' && <BooksView course={activeCourse} />}
            </>
          )}
        </main>

        {/* Teacher Authentication Unlock Modal */}
        <TeacherAuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={(trainer, role) => {
            setIsTeacherMode(true);
            setAuthRole(role);
            setAuthTrainer(trainer);
            setCurrentAuthTrainer(trainer);
            setShowAuthModal(false);
            setTeacherDashboardTab(role === 'super_admin' ? 'trainers' : 'submissions');
            setShowTeacherDashboard(true);
          }}
        />

        {/* Student Progress Modal */}
        <StudentProgressModal
          isOpen={showProgressModal}
          onClose={() => setShowProgressModal(false)}
          activeCourseId={activeCourseId}
          onSelectCourse={(cId) => setActiveCourseId(cId)}
          onNavigateTab={(tabId, unitIndex) => {
            setActiveTab(tabId);
            if (unitIndex !== undefined) {
              setSelectedUnitIndex(unitIndex);
            }
          }}
        />

        {/* Teacher Dashboard Modal for Student Registrations & Scores */}
        <TeacherDashboardModal
          isOpen={showTeacherDashboard}
          onClose={() => setShowTeacherDashboard(false)}
          activeCourseId={activeCourseId}
          initialTab={teacherDashboardTab}
          authTrainer={authTrainer}
          authRole={authRole}
          onLockTeacherMode={() => {
            setIsTeacherMode(false);
            setAuthTrainer(null);
            setCurrentAuthTrainer(null);
            setShowTeacherDashboard(false);
          }}
        />

        {/* Exam Locked Notification Modal */}
        {showExamLockedModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn dir-rtl no-print">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 border-2 border-amber-400 shadow-2xl space-y-6 text-center font-tajawal relative">
              <button
                onClick={() => setShowExamLockedModal(false)}
                className="absolute top-4 left-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-16 h-16 rounded-full bg-amber-100 border-2 border-amber-400 text-amber-700 flex items-center justify-center mx-auto shadow-inner">
                <Lock className="w-8 h-8 text-amber-700" />
              </div>

              <div className="space-y-2">
                <span className="bg-amber-100 text-amber-900 border border-amber-300 px-3 py-1 rounded-full text-xs font-bold font-quran">
                  تنبيه نظام الاعتماد المنهجي
                </span>
                <h3 className="text-xl font-bold font-quran text-slate-900 mt-1">
                  الاختبار النهائي الشامل مقفل
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-xs mx-auto">
                  وفقاً لنظام الحقيبة المعتمد، يُقفل الاختبار الشامل حتى يتم الطالب دراسة جميع الأبواب التدريبية للدورة ({activeCourse.title}) أولاً.
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs font-quran space-y-2">
                <div className="flex items-center justify-between text-slate-800 font-bold">
                  <span>الأبواب المكتملة حالياً:</span>
                  <span className="text-emerald-800 font-sans text-sm">{completedUnitsCount} / {totalUnitsInCourse} أبواب</span>
                </div>
                <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-amber-500 to-emerald-600 h-full rounded-full transition-all"
                    style={{ width: `${(completedUnitsCount / Math.max(1, totalUnitsInCourse)) * 100}%` }}
                  />
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  onClick={() => {
                    setShowExamLockedModal(false);
                    setActiveTab('units');
                  }}
                  className="w-full bg-emerald-900 hover:bg-emerald-950 text-amber-300 font-bold font-quran py-3 rounded-2xl text-xs sm:text-sm transition-all shadow-md cursor-pointer border border-amber-400/30"
                >
                  الذهاب إلى الأبواب التدريبية لإكمال الدراسة
                </button>
                <button
                  onClick={() => setShowExamLockedModal(false)}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold font-quran py-2.5 rounded-2xl text-xs transition-all border border-slate-200"
                >
                  إغلاق النافذة
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Course Locked Notification Modal */}
        {showCourseLockedModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn dir-rtl no-print">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 border-2 border-amber-400 shadow-2xl space-y-6 text-center font-tajawal relative">
              <button
                onClick={() => setShowCourseLockedModal(false)}
                className="absolute top-4 left-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-16 h-16 rounded-full bg-amber-100 border-2 border-amber-400 text-amber-700 flex items-center justify-center mx-auto shadow-inner">
                <Lock className="w-8 h-8 text-amber-700" />
              </div>

              <div className="space-y-2">
                <span className="bg-amber-100 text-amber-900 border border-amber-300 px-3 py-1 rounded-full text-xs font-bold font-quran">
                  قفل التتابع المنهجي
                </span>
                <h3 className="text-xl font-bold font-quran text-slate-900 mt-1">
                  الحقيبة الثانية مغلقة حالياً 🔒
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-xs mx-auto">
                  تفتح هذه الحقيبة (أحكام الإدغام: المتماثلين والمتجانسين والمتقاربين) تلقائياً بعد اجتياز الحقيبة الأولى (التقاء الساكنين) واجتياز اختبارها الشامل بنسبة 90% فأكثر.
                </p>
              </div>

              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 text-xs font-quran space-y-1 text-right text-slate-800">
                <div className="flex items-center justify-between font-bold">
                  <span>حالة التقاء الساكنين لديك:</span>
                  <span className={isCoursePassed('sakinan') ? 'text-emerald-700' : 'text-amber-800'}>
                    {isCoursePassed('sakinan') ? 'تم الاجتياز بنجاح ✓' : 'لم يتم اجتياز الاختبار بعد'}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  onClick={() => {
                    setShowCourseLockedModal(false);
                    setActiveCourseId('sakinan');
                    setActiveTab('cover');
                    setSelectedUnitIndex(0);
                  }}
                  className="w-full bg-emerald-900 hover:bg-emerald-950 text-amber-300 font-bold font-quran py-3 rounded-2xl text-xs sm:text-sm transition-all shadow-md cursor-pointer border border-amber-400/30 flex items-center justify-center gap-2"
                >
                  <span>الانتقال لدراسة حقيبة التقاء الساكنين</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowCourseLockedModal(false)}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold font-quran py-2.5 rounded-2xl text-xs transition-all border border-slate-200"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mandatory Student Name & Role Registration Modal */}
        <StudentRegistrationModal
          isOpen={!isTeacherMode && showRegistrationModal}
          onRegistered={(registeredName) => {
            setShowRegistrationModal(false);
            if (activeTab === 'cover') {
              setActiveTab('units');
            }
          }}
          onTeacherAuthSuccess={(trainer, role) => {
            setIsTeacherMode(true);
            setAuthRole(role);
            setAuthTrainer(trainer);
            setCurrentAuthTrainer(trainer);
            setShowRegistrationModal(false);
            setTeacherDashboardTab(role === 'super_admin' ? 'trainers' : 'submissions');
            setShowTeacherDashboard(true);
          }}
          onOpenTeacherAuth={() => setShowAuthModal(true)}
        />

        {/* Dedicated Bag & Course Management Modal */}
        {showBagManagementModal && (
          <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 animate-fadeIn dir-rtl no-print">
            <div className="max-w-5xl w-full max-h-[92vh] overflow-y-auto rounded-3xl shadow-2xl">
              <BagManagementPanel
                activeCourseId={activeCourseId}
                onClose={() => setShowBagManagementModal(false)}
                onSelectCourseToView={(cId) => {
                  setActiveCourseId(cId);
                  setActiveTab('cover');
                  setSelectedUnitIndex(0);
                  setShowBagManagementModal(false);
                }}
              />
            </div>
          </div>
        )}

        {/* Printable View Container for Curriculum (Only visible during window.print() when not on exam tab) */}
        {activeTab !== 'exam' && (
          <div className="hidden print-only p-8 text-black space-y-8 font-tajawal">
            <div className="text-center border-b-2 border-black pb-4 space-y-1">
              <h1 className="text-3xl font-black font-quran">{activeCourse.title}</h1>
              <p className="text-base font-bold text-gray-800">{activeCourse.subtitle}</p>
              <p className="text-sm font-black font-quran text-amber-900 pt-1">جمع وإعداد: {activeCourse.author}</p>
            </div>

            {/* All Units Summary for Print */}
            {activeCourse.units.map((unit, uIdx) => (
              <section key={uIdx} className="space-y-4 page-break">
                <h2 className="text-xl font-bold border-r-4 border-black pr-2">
                  {unit.title}
                </h2>
                <p className="text-xs italic">{unit.subtitle}</p>

                <div className="space-y-3">
                  {unit.lessons.map((lesson, lIdx) => (
                    <div key={lIdx} className="border border-gray-400 p-3 rounded text-xs space-y-1">
                      <div className="font-bold font-quran text-sm">{lesson.title}</div>
                      <div className="text-gray-700">{lesson.subtitle}</div>
                      <div className="pt-2"><strong>الواجب والتطبيق:</strong> {lesson.homeworkTask}</div>
                    </div>
                  ))}
                </div>
              </section>
            ))}

            {/* Summary Table for Print */}
            <section className="space-y-4 page-break">
              <h2 className="text-xl font-bold border-r-4 border-black pr-2">جدول الملخص الشامل لطرق التخلص</h2>
              <table className="w-full text-right text-xs border-collapse border border-black">
                <thead>
                  <tr className="bg-gray-200 font-bold border-b border-black">
                    <th className="border p-2">نوع الالتقاء</th>
                    <th className="border p-2">السبب والتأصيل</th>
                    <th className="border p-2">طريقة التخلص</th>
                    <th className="border p-2">مثال قرآني</th>
                  </tr>
                </thead>
                <tbody>
                  {SUMMARY_TABLE_DATA.map((row, i) => (
                    <tr key={i} className="border-b border-black">
                      <td className="border p-2 font-bold font-quran">{row.type}</td>
                      <td className="border p-2">{row.condition}</td>
                      <td className="border p-2 font-bold">{row.disposalMethod}</td>
                      <td className="border p-2 font-quran text-sm">{row.exampleText}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </div>
        )}
      </div>

      {/* Floating WhatsApp Support Button */}
      <FloatingWhatsAppSupport />

      {/* Global Badge Earned Notification Toast */}
      <BadgeEarnedToast
        onOpenShareModal={() => setShowShareModal(true)}
        onOpenProgressModal={() => setShowProgressModal(true)}
      />

      {/* Quran Font Picker Modal */}
      <QuranFontModal isOpen={showFontModal} onClose={() => setShowFontModal(false)} />

      {/* Fast Sakinan Search Bar Modal */}
      <SakinanSearchBar
        mode="modal"
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        onSelectResult={handleSelectSearchResult}
        onNavigateTo={(tab, unitIdx) => {
          setShowSearchModal(false);
          setActiveCourseId('sakinan');
          setActiveTab(tab as any);
          if (unitIdx !== undefined) setSelectedUnitIndex(unitIdx);
        }}
      />

      {/* Share Achievement Modal */}
      <ShareAchievementModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        activeCourseId={activeCourseId}
        studentProfile={studentProfile}
        progress={studentProgress}
        percentage={progressPct}
      />

      {/* Student Logout Confirmation Modal */}
      {showLogoutConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs font-tajawal animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border-2 border-red-200 shadow-2xl text-right space-y-5">
            <div className="flex items-center justify-between border-b border-red-100 pb-3">
              <div className="flex items-center gap-2 text-red-700 font-bold font-quran text-lg">
                <LogOut className="w-5 h-5 text-red-600" />
                <span>تأكيد تسجيل الخروج</span>
              </div>
              <button
                onClick={() => setShowLogoutConfirmModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-slate-700 leading-relaxed font-medium">
              هل أنت متأكد من رغبتك في تسجيل الخروج من حساب الطالب{' '}
              <strong className="text-slate-900 font-bold font-quran">
                {studentProfile?.name || ''}
              </strong>
              ؟ ستبقى نتائجك وبياناتك محفوظة في هذا المتصفح ويمكنك العودة وإعادة تسجيل الدخول في أي وقت.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleLogout}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-4 rounded-xl transition-all cursor-pointer text-sm shadow-md flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-4 h-4" />
                <span>نعم، تسجيل الخروج</span>
              </button>
              <button
                onClick={() => setShowLogoutConfirmModal(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl transition-all cursor-pointer text-sm"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className={`py-8 mt-12 no-print border-t transition-colors duration-300 ${
        activeCourseId === 'idgham'
          ? 'bg-indigo-950 text-purple-200 border-indigo-900'
          : 'bg-emerald-950 text-emerald-200 border-emerald-900'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-right">
          <div>
            <div className="font-bold font-quran text-lg text-amber-300">
              حقيبة: {activeCourse.title}
            </div>
            <p className={`text-xs mt-1 font-medium ${
              activeCourseId === 'idgham' ? 'text-purple-300/80' : 'text-emerald-300/80'
            }`}>
              {activeCourse.subtitle}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap justify-center">
            {/* WhatsApp Support Link */}
            <WhatsAppSupport variant="button" />

            <div className="flex items-center gap-2 text-xs text-slate-950 font-bold bg-amber-400 px-4 py-2 rounded-xl font-quran shadow-sm">
              <Award className="w-4 h-4 text-slate-950" />
              <span>جمع وإعداد: {activeCourse.author}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

