import React, { useState, useEffect } from 'react';
import { 
  User, Edit3, Check, Award, BookOpen, Trophy, School, 
  ShieldCheck, Sparkles, Star, Share2, Calendar, FileText, Flame, LogOut, AlertCircle, Search, Heart 
} from 'lucide-react';
import { getStudentProfile, saveStudentProfile, subscribeStudentProfile, logoutStudent } from '../utils/studentStorage';
import { getStudentProgress, subscribeStudentProgress, calculateProgressPercentage } from '../utils/studentProgressStorage';
import { getCourseBadges, StudentBadge } from '../utils/badgeSystem';
import { getDailyPlannerData, subscribeDailyPlanner, DailyPlannerData } from '../utils/dailyPlannerStorage';
import { getStudentNotes, subscribeStudentNotes } from '../utils/studentNotesStorage';
import { getFavoriteLessons, subscribeFavoriteLessons } from '../utils/favoriteLessonsStorage';
import { BadgesModal } from './BadgesModal';
import { ShareAchievementModal } from './ShareAchievementModal';
import { DailyStudyPlannerModal } from './DailyStudyPlannerModal';
import { StudentNotesDrawer } from './StudentNotesDrawer';
import { FavoriteLessonsModal } from './FavoriteLessonsModal';
import { StudentProfile } from '../types';

interface StudentBarProps {
  onOpenProgressModal?: () => void;
  onOpenRegistrationModal?: () => void;
  onOpenSearch?: () => void;
  onNavigateToLesson?: (courseId: string, unitNumber: number, lessonNumber: number) => void;
  activeCourseId?: string;
  currentUnitNumber?: number;
  currentUnitTitle?: string;
}

export const StudentBar: React.FC<StudentBarProps> = ({ 
  onOpenProgressModal,
  onOpenRegistrationModal,
  onOpenSearch,
  onNavigateToLesson,
  activeCourseId = 'sakinan',
  currentUnitNumber,
  currentUnitTitle,
}) => {
  const [profile, setProfile] = useState<StudentProfile | null>(() => getStudentProfile());
  const [progressPct, setProgressPct] = useState<number>(0);
  const [badges, setBadges] = useState<StudentBadge[]>([]);
  const [plannerData, setPlannerData] = useState<DailyPlannerData>(() => getDailyPlannerData());
  const [notesCount, setNotesCount] = useState<number>(() => getStudentNotes(activeCourseId).length);
  const [favoritesCount, setFavoritesCount] = useState<number>(() => getFavoriteLessons().length);
  
  // Modals state
  const [isBadgesModalOpen, setIsBadgesModalOpen] = useState<boolean>(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [isPlannerModalOpen, setIsPlannerModalOpen] = useState<boolean>(false);
  const [isNotesDrawerOpen, setIsNotesDrawerOpen] = useState<boolean>(false);
  const [isFavoritesModalOpen, setIsFavoritesModalOpen] = useState<boolean>(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState<boolean>(false);

  useEffect(() => {
    const handleProfile = (prof: StudentProfile | null) => {
      setProfile(prof);
    };

    handleProfile(getStudentProfile());
    const unsubProfile = subscribeStudentProfile(handleProfile);

    const updateProg = () => {
      const prog = getStudentProgress(activeCourseId);
      setProgressPct(calculateProgressPercentage(prog));
      setBadges(getCourseBadges(prog, activeCourseId));
    };
    updateProg();

    const unsubscribeProg = subscribeStudentProgress(updateProg);

    const updatePlanner = (data: DailyPlannerData) => setPlannerData(data);
    const unsubPlanner = subscribeDailyPlanner(updatePlanner);

    const updateNotes = () => setNotesCount(getStudentNotes(activeCourseId).length);
    const unsubNotes = subscribeStudentNotes(updateNotes);

    const updateFavorites = () => setFavoritesCount(getFavoriteLessons().length);
    const unsubFavorites = subscribeFavoriteLessons(updateFavorites);

    const handleProgressReset = () => {
      setProfile(null);
      setProgressPct(0);
      setBadges([]);
    };
    window.addEventListener('tajweed_progress_reset', handleProgressReset);

    return () => {
      unsubProfile();
      unsubscribeProg();
      unsubPlanner();
      unsubNotes();
      unsubFavorites();
      window.removeEventListener('tajweed_progress_reset', handleProgressReset);
    };
  }, [activeCourseId]);

  const unlockedBadges = badges.filter((b) => b.isUnlocked);
  const rawProgress = getStudentProgress(activeCourseId);

  return (
    <>
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 mb-4 shadow-xs font-tajawal no-print text-slate-200">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          
          {/* Left: Student & Trainer Info - Calm & Unboxed */}
          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              {profile?.name ? (
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span className="font-bold font-quran text-slate-100">{profile.name}</span>
                  {profile.trainerName && (
                    <>
                      <span className="text-slate-600">·</span>
                      <span className="text-slate-400">المشرف: {profile.trainerName}</span>
                    </>
                  )}
                  {onOpenRegistrationModal && (
                    <button
                      onClick={onOpenRegistrationModal}
                      className="text-slate-400 hover:text-slate-200 text-[11px] hover:underline cursor-pointer"
                    >
                      تعديل
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-400">حساب دارس عام</span>
                  {onOpenRegistrationModal && (
                    <button
                      onClick={onOpenRegistrationModal}
                      className="text-amber-300 hover:underline font-bold text-xs cursor-pointer"
                    >
                      تسجيل الاسم
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Middle: Badges Showcase & Quick Student Utilities */}
          <div className="flex items-center gap-1.5 w-full md:w-auto flex-wrap justify-start md:justify-end">
            
            {/* Badges Button */}
            <button
              onClick={() => setIsBadgesModalOpen(true)}
              className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-600 rounded-lg px-2.5 py-1.5 transition-colors flex items-center gap-1.5 cursor-pointer text-xs text-slate-300 hover:text-white"
              title="عرض سجل الأوسمة والإنجازات المكتسبة"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>{unlockedBadges.length} أوسمة</span>
            </button>

            {/* Daily Study Planner Button */}
            <button
              onClick={() => setIsPlannerModalOpen(true)}
              className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-600 rounded-lg px-2.5 py-1.5 transition-colors flex items-center gap-1.5 cursor-pointer text-xs text-slate-300 hover:text-white"
              title="مخطط الدراسة اليومي والتذكير الذكي"
            >
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <span>مخطط اليوم ({plannerData.streakCount}d)</span>
            </button>

            {/* Student Notes Drawer Button */}
            <button
              onClick={() => setIsNotesDrawerOpen(true)}
              className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-600 rounded-lg px-2.5 py-1.5 transition-colors flex items-center gap-1.5 cursor-pointer text-xs text-slate-300 hover:text-white"
              title="مفكرة الطالب للتدوين والملاحظات"
            >
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span>المفكرة ({notesCount})</span>
            </button>

            {/* Favorite Lessons Button */}
            <button
              onClick={() => setIsFavoritesModalOpen(true)}
              className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-600 rounded-lg px-2.5 py-1.5 transition-colors flex items-center gap-1.5 cursor-pointer text-xs text-slate-300 hover:text-white"
              title="عرض قائمة دروسي المفضلة"
            >
              <Heart className="w-3.5 h-3.5 text-rose-400" />
              <span>المفضلة ({favoritesCount})</span>
            </button>

          </div>
        </div>
      </div>

      {/* Badges Modal */}
      <BadgesModal
        isOpen={isBadgesModalOpen}
        onClose={() => setIsBadgesModalOpen(false)}
        activeCourseId={activeCourseId}
      />

      {/* Share Achievement Modal */}
      <ShareAchievementModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        activeCourseId={activeCourseId}
        studentProfile={profile}
        progress={rawProgress}
        badges={badges}
        percentage={progressPct}
      />

      {/* Daily Study Planner Modal */}
      <DailyStudyPlannerModal
        isOpen={isPlannerModalOpen}
        onClose={() => setIsPlannerModalOpen(false)}
      />

      {/* Student Notes Drawer */}
      <StudentNotesDrawer
        isOpen={isNotesDrawerOpen}
        onClose={() => setIsNotesDrawerOpen(false)}
        activeCourseId={activeCourseId}
        currentUnitNumber={currentUnitNumber}
        currentUnitTitle={currentUnitTitle}
      />

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 font-tajawal dir-rtl no-print animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-red-500/50 rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 mx-auto flex items-center justify-center border border-red-500/30">
              <LogOut className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base font-quran text-slate-100">تسجيل الخروج من الحساب</h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                هل ترغب بتسجيل الخروج؟ يمكنك تسجيل الدخول باسمك مجدداً في أي وقت مع الاحتفاظ بكافة تقدمك ودرجاتك السابقة.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => {
                  logoutStudent();
                  setProfile(null);
                  setShowLogoutConfirm(false);
                }}
                className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl cursor-pointer transition-all shadow-md"
              >
                نعم، خروج
              </button>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs px-5 py-2.5 rounded-xl cursor-pointer transition-all border border-slate-700"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Favorite Lessons Modal */}
      <FavoriteLessonsModal
        isOpen={isFavoritesModalOpen}
        onClose={() => setIsFavoritesModalOpen(false)}
        onSelectLesson={(cId, uNum, lNum) => {
          if (onNavigateToLesson) {
            onNavigateToLesson(cId, uNum, lNum);
          }
        }}
      />
    </>
  );
};


