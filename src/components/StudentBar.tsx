import React, { useState, useEffect } from 'react';
import { 
  User, Edit3, Check, Award, BookOpen, Trophy, School, 
  ShieldCheck, Sparkles, Star, Share2, Calendar, FileText, Flame, LogOut, AlertCircle, Search 
} from 'lucide-react';
import { getStudentProfile, saveStudentProfile, subscribeStudentProfile, logoutStudent } from '../utils/studentStorage';
import { getStudentProgress, subscribeStudentProgress, calculateProgressPercentage } from '../utils/studentProgressStorage';
import { getCourseBadges, StudentBadge } from '../utils/badgeSystem';
import { getDailyPlannerData, subscribeDailyPlanner, DailyPlannerData } from '../utils/dailyPlannerStorage';
import { getStudentNotes, subscribeStudentNotes } from '../utils/studentNotesStorage';
import { BadgesModal } from './BadgesModal';
import { ShareAchievementModal } from './ShareAchievementModal';
import { DailyStudyPlannerModal } from './DailyStudyPlannerModal';
import { StudentNotesDrawer } from './StudentNotesDrawer';
import { StudentProfile } from '../types';

interface StudentBarProps {
  onOpenProgressModal?: () => void;
  onOpenRegistrationModal?: () => void;
  onOpenSearch?: () => void;
  activeCourseId?: string;
  currentUnitNumber?: number;
  currentUnitTitle?: string;
}

export const StudentBar: React.FC<StudentBarProps> = ({ 
  onOpenProgressModal,
  onOpenRegistrationModal,
  onOpenSearch,
  activeCourseId = 'sakinan',
  currentUnitNumber,
  currentUnitTitle,
}) => {
  const [profile, setProfile] = useState<StudentProfile | null>(() => getStudentProfile());
  const [progressPct, setProgressPct] = useState<number>(0);
  const [badges, setBadges] = useState<StudentBadge[]>([]);
  const [plannerData, setPlannerData] = useState<DailyPlannerData>(() => getDailyPlannerData());
  const [notesCount, setNotesCount] = useState<number>(() => getStudentNotes(activeCourseId).length);
  
  // Modals state
  const [isBadgesModalOpen, setIsBadgesModalOpen] = useState<boolean>(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [isPlannerModalOpen, setIsPlannerModalOpen] = useState<boolean>(false);
  const [isNotesDrawerOpen, setIsNotesDrawerOpen] = useState<boolean>(false);
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
      window.removeEventListener('tajweed_progress_reset', handleProgressReset);
    };
  }, [activeCourseId]);

  const unlockedBadges = badges.filter((b) => b.isUnlocked);
  const rawProgress = getStudentProgress(activeCourseId);

  return (
    <>
      <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-emerald-950/80 border border-emerald-700/50 rounded-2xl p-4 mb-6 shadow-md font-tajawal no-print">
        <div className="flex flex-col xl:flex-row items-center justify-between gap-4">
          
          {/* Left: Student & Trainer Info */}
          <div className="flex items-center gap-3 w-full xl:w-auto">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 flex items-center justify-center font-bold font-quran text-lg shadow-md shrink-0 border border-amber-300">
              <User className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold text-amber-300 bg-amber-500/20 px-2.5 py-0.5 rounded-full border border-amber-500/30 font-quran">
                  حساب الدارس القرآني
                </span>
                
                {profile?.trainerName ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-200 bg-emerald-800/60 px-2.5 py-0.5 rounded-full border border-emerald-600/50 font-quran">
                    <School className="w-3 h-3 text-amber-400" />
                    <span>المعلم المشرف: {profile.trainerName}</span>
                    {profile.referralCode && (
                      <span className="text-amber-300 font-mono text-[10px]">({profile.referralCode})</span>
                    )}
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-700 font-quran">
                    دراسة عامة
                  </span>
                )}
              </div>
              
              {profile?.name ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-slate-300">أهلاً بك:</span>
                  <span className="text-sm sm:text-base font-bold font-quran text-amber-200">{profile.name}</span>
                  {onOpenRegistrationModal && (
                    <button
                      onClick={onOpenRegistrationModal}
                      className="text-amber-300 hover:text-amber-100 p-1 rounded-lg hover:bg-emerald-800/50 transition-all text-xs flex items-center gap-1 cursor-pointer"
                      title="تعديل بيانات الطالب أو ربط كود المعلم"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>تعديل الحساب / الكود</span>
                    </button>
                  )}
                  <button
                    onClick={() => setShowLogoutConfirm(true)}
                    className="text-red-300 hover:text-red-100 hover:bg-red-950/60 border border-red-500/40 rounded-lg px-2 py-0.5 text-xs font-quran flex items-center gap-1 transition-all cursor-pointer"
                    title="تسجيل الخروج من حساب الطالب"
                  >
                    <LogOut className="w-3.5 h-3.5 text-red-400" />
                    <span>تسجيل الخروج</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-amber-300 font-bold">لم يتم تسجيل اسم الطالب بعد</span>
                  {onOpenRegistrationModal && (
                    <button
                      onClick={onOpenRegistrationModal}
                      className="bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-lg text-xs font-bold font-quran hover:bg-amber-300 cursor-pointer"
                    >
                      تسجيل الآن
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Middle: Badges Showcase & Quick Student Utilities */}
          <div className="flex items-center justify-center gap-2 w-full xl:w-auto flex-wrap">
            
            {/* Badges Button */}
            <button
              onClick={() => setIsBadgesModalOpen(true)}
              className="bg-slate-950/80 hover:bg-slate-900 border border-amber-500/40 hover:border-amber-400 rounded-xl px-3 py-2 transition-all flex items-center gap-2.5 group cursor-pointer shadow-inner"
              title="عرض سجل الأوسمة والإنجازات المكتسبة"
            >
              <div className="w-7 h-7 rounded-lg bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-400 text-sm shrink-0 group-hover:scale-110 transition-transform">
                🏅
              </div>
              <div className="text-right">
                <div className="text-[10px] text-amber-300 font-bold font-quran">
                  أوسمة التميز:
                </div>
                <div className="text-xs font-black font-quran text-slate-100">
                  <span>{unlockedBadges.length} / {badges.length} وساماً</span>
                </div>
              </div>
            </button>

            {/* Daily Study Planner Button */}
            <button
              onClick={() => setIsPlannerModalOpen(true)}
              className="bg-slate-950/80 hover:bg-slate-900 border border-emerald-600/50 hover:border-emerald-400 rounded-xl px-3 py-2 transition-all flex items-center gap-2.5 cursor-pointer shadow-inner"
              title="مخطط الدراسة اليومي والتذكير الذكي"
            >
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <div className="text-right">
                <div className="text-[10px] text-emerald-300 font-bold font-quran flex items-center gap-1">
                  <span>مخطط اليوم:</span>
                  <Flame className="w-3 h-3 text-amber-400 fill-current" />
                  <span className="text-amber-400 font-sans">{plannerData.streakCount}d</span>
                </div>
                <div className="text-xs font-bold font-tajawal text-slate-200 line-clamp-1 max-w-[110px]">
                  {plannerData.dailyGoalLabel.split(' ')[0]}
                </div>
              </div>
            </button>

            {/* Student Notes Drawer Button */}
            <button
              onClick={() => setIsNotesDrawerOpen(true)}
              className="bg-slate-950/80 hover:bg-slate-900 border border-slate-700 hover:border-amber-400/60 rounded-xl px-3 py-2 transition-all flex items-center gap-2 cursor-pointer shadow-inner text-amber-200"
              title="مفكرة الطالب للتدوين والملاحظات"
            >
              <FileText className="w-4 h-4 text-amber-400" />
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block font-quran">المفكرة:</span>
                <span className="text-xs font-bold font-quran">{notesCount} ملاحظة</span>
              </div>
            </button>

            {/* Sakinan Search Button */}
            {onOpenSearch && activeCourseId === 'sakinan' && (
              <button
                onClick={onOpenSearch}
                className="bg-slate-950/80 hover:bg-slate-900 border border-amber-400/60 hover:border-amber-300 rounded-xl px-3 py-2 transition-all flex items-center gap-2 cursor-pointer shadow-inner text-amber-300"
                title="افتح شريط البحث الفوري"
              >
                <Search className="w-4 h-4 text-amber-400" />
                <div className="text-right">
                  <span className="text-[10px] text-amber-400/80 block font-quran">البحث الفوري:</span>
                  <span className="text-xs font-bold font-quran">بحث الحقيبة 🔍</span>
                </div>
              </button>
            )}

            {/* Share Achievement Button */}
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black rounded-xl px-3.5 py-2 transition-all flex items-center gap-1.5 cursor-pointer shadow-md text-xs font-quran"
              title="مشاركة بطاقة الإنجاز والدرجات عبر وسائل التواصل"
            >
              <Share2 className="w-4 h-4 text-slate-950 fill-current" />
              <span>مشاركة الإنجاز</span>
            </button>

          </div>

          {/* Right side: Progress gauge & Quick Modal trigger */}
          <div className="flex items-center gap-3 w-full xl:w-auto justify-end">
            {onOpenProgressModal && (
              <button
                onClick={onOpenProgressModal}
                className="w-full xl:w-auto bg-slate-950/80 hover:bg-slate-900 border border-emerald-700/60 rounded-xl px-4 py-2 text-right transition-all flex items-center justify-between xl:justify-start gap-3 group cursor-pointer shadow-inner"
                title="انقر لفتح شاشة تفاصيل الإنجاز والتقدم الدراسي"
              >
                <div>
                  <div className="flex items-center justify-between gap-3 text-[11px] font-bold font-quran">
                    <span className="text-emerald-200">نسبة التقدم بالحقيبة:</span>
                    <span className="text-amber-400 font-mono">{progressPct}%</span>
                  </div>
                  <div className="w-28 sm:w-32 bg-slate-800 rounded-full h-2 mt-1.5 overflow-hidden border border-slate-700">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-amber-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${progressPct}%` }}
                    ></div>
                  </div>
                </div>
                <Trophy className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform shrink-0" />
              </button>
            )}
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
    </>
  );
};


