import React, { useState, useEffect } from 'react';
import { X, Award, CheckCircle2, Circle, RefreshCw, Sparkles, BookOpen, Layers, Trophy, Check, BookMarked, ExternalLink, Share2 } from 'lucide-react';
import { 
  getStudentProgress, 
  loadMultiProgress,
  subscribeStudentProgress, 
  markUnitCompleted, 
  markSectionRead, 
  calculateProgressPercentage, 
  getBadges, 
  resetProgress,
  SingleCourseProgress
} from '../utils/studentProgressStorage';
import { getStudentProfile } from '../utils/studentStorage';
import { getCourseBadges } from '../utils/badgeSystem';
import { ShareAchievementModal } from './ShareAchievementModal';
import { ALL_COURSES, getCourseById } from '../data/courses';

interface StudentProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tabId: string, unitIndex?: number) => void;
  activeCourseId?: string;
  onSelectCourse?: (courseId: string) => void;
}

export const StudentProgressModal: React.FC<StudentProgressModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  activeCourseId = 'sakinan',
  onSelectCourse
}) => {
  const [selectedCourseId, setSelectedCourseId] = useState<string>(activeCourseId);
  const [multiData, setMultiData] = useState(() => loadMultiProgress());
  const [isResetting, setIsResetting] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  useEffect(() => {
    setSelectedCourseId(activeCourseId);
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

  const currentCourseObj = getCourseById(selectedCourseId) || ALL_COURSES[0];
  const currentProg: SingleCourseProgress = multiData.courses[selectedCourseId] || getStudentProgress(selectedCourseId);
  const totalUnits = currentCourseObj.units ? currentCourseObj.units.length : 5;
  const percentage = calculateProgressPercentage(currentProg, totalUnits);
  const badges = getBadges(currentProg);

  const handleToggleUnit = async (unitNum: number, currentCompleted: boolean) => {
    await markUnitCompleted(unitNum, !currentCompleted, selectedCourseId);
  };

  const handleToggleSection = async (secId: string, currentRead: boolean) => {
    if (!currentRead) {
      await markSectionRead(secId, selectedCourseId);
    }
  };

  const handleReset = async () => {
    if (window.confirm(`هل أنت تأكد من رغبتك في إعادة ضبط التقدم والتصحيح لدورة (${currentCourseObj.title})؟`)) {
      setIsResetting(true);
      await resetProgress(selectedCourseId);
      setIsResetting(false);
    }
  };

  const sectionsList = [
    { id: 'exceptions', title: 'الكلمات المستثناة والقراءات', count: 'حالات خاصة' },
    { id: 'examples', title: 'المختبر القرآني للأمثلة والتطبيقات', count: `${currentCourseObj.quranExamples.length}+ مثالاً` },
    { id: 'errors', title: 'أخطاء القراء والترشيد الميداني', count: 'توجيهات' },
    { id: 'summary', title: 'جدول المقارنة الشامل', count: 'تأصيل وتوجيه' },
    { id: 'rules', title: 'منظومات وقواعد الحفظ التجويدية', count: 'الأراجيز' },
    { id: 'books', title: 'المراجع والمصادر العلمية الأصلية', count: 'أمهات الكتب' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto no-print">
      <div className="bg-slate-900 border border-emerald-700/60 rounded-3xl max-w-3xl w-full text-slate-100 shadow-2xl overflow-hidden font-tajawal animate-in fade-in zoom-in duration-200 my-8">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 p-6 border-b border-emerald-800/80 relative">
          <button
            onClick={onClose}
            className="absolute left-4 top-4 p-2 text-slate-400 hover:text-white hover:bg-emerald-900/60 rounded-full transition-all cursor-pointer"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-400/10 border border-amber-400/30 rounded-2xl text-amber-400">
              <Trophy className="w-7 h-7" />
            </div>
            <div>
              <span className="text-xs text-amber-300 font-bold font-quran bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                سجل إنجاز الطالب الشامل
              </span>
              <h2 className="text-xl font-bold font-quran text-amber-100 mt-0.5">
                متابعة التقدم والشهادات في دورات المنصة
              </h2>
            </div>
          </div>

          {/* Independent Multi-Course Status Cards */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
            {ALL_COURSES.map((crs) => {
              const crsProg = multiData.courses[crs.id] || getStudentProgress(crs.id);
              const crsTotalUnits = crs.units ? crs.units.length : 5;
              const crsPct = calculateProgressPercentage(crsProg, crsTotalUnits);
              const isExamPass = crsProg.examCompleted && (crsProg.examBestScore || 0) >= 90;
              const isSelected = crs.id === selectedCourseId;
              
              let statusLabel = 'لم يبدأ';
              let statusBg = 'bg-slate-800/80 text-slate-300';
              if (isExamPass || crsPct === 100) {
                statusLabel = 'مكتمل';
                statusBg = 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
              } else if (crsPct > 0 || crsProg.completedUnitNumbers.length > 0) {
                statusLabel = 'قيد الدراسة';
                statusBg = 'bg-amber-500/20 text-amber-300 border border-amber-500/30';
              }

              return (
                <div
                  key={crs.id}
                  onClick={() => {
                    setSelectedCourseId(crs.id);
                    if (onSelectCourse) onSelectCourse(crs.id);
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer text-right relative overflow-hidden ${
                    isSelected
                      ? 'bg-emerald-950/90 border-amber-400 shadow-lg ring-2 ring-amber-400/40'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="text-xs font-bold font-quran text-amber-200 flex items-center gap-1.5">
                        <BookMarked className="w-4 h-4 text-amber-400 shrink-0" />
                        <span className="line-clamp-1">{crs.title}</span>
                      </div>
                      <span className="text-[11px] text-slate-400 line-clamp-1">{crs.subtitle}</span>
                    </div>
                    <span className={`text-[10px] font-bold font-quran px-2 py-0.5 rounded-full shrink-0 ${statusBg}`}>
                      {statusLabel}
                    </span>
                  </div>

                  {/* Gauge */}
                  <div className="space-y-1.5 mt-3">
                    <div className="flex items-center justify-between text-[11px] font-bold font-quran">
                      <span className="text-slate-300">النسبة: <strong className="text-amber-400 font-sans">{crsPct}%</strong></span>
                      <span className="text-slate-300">
                        الشهادة: {isExamPass ? <strong className="text-emerald-400">متاحة ✓</strong> : <span className="text-slate-500">غير متاحة</span>}
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
                      <div
                        className="bg-gradient-to-r from-emerald-500 via-amber-400 to-amber-300 h-full rounded-full transition-all duration-500"
                        style={{ width: `${crsPct}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Body for Selected Course */}
        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">

          {/* Active Course Banner */}
          <div className="bg-emerald-950/40 border border-emerald-800/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold font-quran text-amber-300">تفاصيل الدورة المحددة:</span>
              <h3 className="text-base font-bold font-quran text-amber-100">{currentCourseObj.title}</h3>
              <p className="text-xs text-slate-400 mt-0.5">{currentCourseObj.subtitle}</p>
            </div>
            <button
              onClick={() => {
                if (onSelectCourse) onSelectCourse(selectedCourseId);
                onClose();
                onNavigateTab('cover');
              }}
              className="bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold font-quran px-4 py-2 rounded-xl transition-all cursor-pointer shrink-0 flex items-center gap-1.5"
            >
              <ExternalLink className="w-4 h-4" />
              <span>الانتقال للدورة</span>
            </button>
          </div>

          {/* Badges Section */}
          <div>
            <h3 className="text-xs font-bold font-quran text-amber-300 mb-3 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>الأوسمة والشهادات المكتسبة للدورة:</span>
            </h3>

            {badges.length === 0 ? (
              <div className="bg-slate-950/50 border border-dashed border-slate-800 rounded-xl p-4 text-center text-xs text-slate-400">
                أكمل الأبواب والاختبارات لفتح أوسمة التميز الرسمية!
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {badges.map((b, idx) => (
                  <div key={idx} className={`p-3 rounded-xl border text-xs flex flex-col gap-1 ${b.bg}`}>
                    <div className="flex items-center gap-1.5 font-bold font-quran">
                      <span className="text-base">{b.icon}</span>
                      <span>{b.title}</span>
                    </div>
                    <span className="text-[10px] opacity-80">{b.desc}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Curriculum Units Checklist */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold font-quran text-emerald-200 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-400" />
                <span>إنجاز أبواب المنهج ({currentCourseObj.units.length} أبواب):</span>
              </h3>
              <span className="text-[11px] text-slate-400">اضغط لتعليم الباب كمكتمل</span>
            </div>

            <div className="space-y-2">
              {currentCourseObj.units.map((unit, idx) => {
                const isCompleted = (currentProg.completedUnitNumbers || []).includes(unit.unitNumber);
                return (
                  <div
                    key={unit.id}
                    className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                      isCompleted
                        ? 'bg-emerald-950/60 border-emerald-600/80 text-emerald-100'
                        : 'bg-slate-950/40 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleToggleUnit(unit.unitNumber, isCompleted)}
                        className={`p-1 rounded-lg transition-all cursor-pointer ${
                          isCompleted ? 'text-amber-400 hover:text-amber-300' : 'text-slate-500 hover:text-slate-300'
                        }`}
                        title={isCompleted ? 'تغيير كغير مكتمل' : 'تعليم كمكتمل'}
                      >
                        {isCompleted ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <Circle className="w-5 h-5" />}
                      </button>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold font-quran text-amber-200">
                            الباب {unit.unitNumber}: {unit.title}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 line-clamp-1">{unit.subtitle}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        if (onSelectCourse) onSelectCourse(selectedCourseId);
                        onClose();
                        onNavigateTab('units', idx);
                      }}
                      className="text-xs bg-slate-800 hover:bg-slate-700 text-amber-300 px-3 py-1.5 rounded-lg font-quran transition-all cursor-pointer border border-slate-700 shrink-0"
                    >
                      دراسة الباب
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reference Sections Checklist */}
          <div>
            <h3 className="text-xs font-bold font-quran text-emerald-200 mb-3 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-emerald-400" />
              <span>أقسام الحقيبة والمختبر التفاعلي:</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {sectionsList.map((sec) => {
                const isRead = (currentProg.readSections || []).includes(sec.id);
                return (
                  <div
                    key={sec.id}
                    onClick={() => {
                      handleToggleSection(sec.id, isRead);
                      if (onSelectCourse) onSelectCourse(selectedCourseId);
                      onClose();
                      onNavigateTab(sec.id);
                    }}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-2 ${
                      isRead
                        ? 'bg-emerald-950/40 border-emerald-700/60 text-emerald-100'
                        : 'bg-slate-950/40 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {isRead ? (
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-600 shrink-0" />
                      )}
                      <div>
                        <div className="text-xs font-bold font-tajawal">{sec.title}</div>
                        <div className="text-[10px] text-slate-400">{sec.count}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Exam Status */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500/20 text-amber-300 rounded-xl border border-amber-500/30">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-bold font-quran text-amber-100">
                  الاختبار النهائي الشامل ({currentCourseObj.title})
                </div>
                <div className="text-[11px] text-slate-400">
                  {currentProg.examCompleted
                    ? `أعلى درجة محققة: ${currentProg.examBestScore}%`
                    : 'اختبار شمولية الحقيبة وقياس مستوى الإتقان'}
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                if (onSelectCourse) onSelectCourse(selectedCourseId);
                onClose();
                onNavigateTab('exam');
              }}
              className="bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold px-4 py-2 rounded-xl font-quran transition-all cursor-pointer shrink-0 shadow-sm"
            >
              {currentProg.examCompleted && (currentProg.examBestScore || 0) >= 90
                ? 'استعراض النتيجة والشهادة'
                : currentProg.examCompleted
                ? 'إعادة خوض الاختبار'
                : 'بدء الاختبار الآن'}
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-950 p-4 border-t border-slate-800 flex items-center justify-between text-xs flex-wrap gap-2">
          <button
            onClick={handleReset}
            disabled={isResetting}
            className="text-red-400 hover:text-red-300 flex items-center gap-1.5 transition-all cursor-pointer font-tajawal"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
            <span>إعادة ضبط تقدم الدورة الحالية</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold font-quran px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <Share2 className="w-4 h-4 text-slate-950" />
              <span>مشاركة الإنجاز</span>
            </button>

            <button
              onClick={onClose}
              className="bg-emerald-800 hover:bg-emerald-700 text-white font-bold font-quran px-5 py-2 rounded-xl transition-all cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        </div>

      </div>

      {/* Share Achievement Modal */}
      <ShareAchievementModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        activeCourseId={selectedCourseId}
        studentProfile={getStudentProfile()}
        progress={currentProg}
        badges={getCourseBadges(currentProg, selectedCourseId)}
        percentage={percentage}
      />
    </div>
  );
};
