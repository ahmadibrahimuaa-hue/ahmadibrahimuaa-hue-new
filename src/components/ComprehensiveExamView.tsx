import React, { useState, useEffect } from 'react';
import { Course, ComprehensiveExamQuestion, ExamDifficultyLevel } from '../types';
import { getComprehensiveExamBank, subscribeQuestionBank } from '../utils/questionStorage';
import { 
  Award, ChevronRight, ChevronLeft, Send, Clock, 
  ShieldAlert, Play, ArrowRight, Lock, CheckCircle2, AlertTriangle,
  RotateCcw, BookOpen, XCircle, HelpCircle, Check, Eye, Search, X, Trophy, Zap, Flame
} from 'lucide-react';
import { saveSubmission, saveStudentProfile, getStudentProfile, subscribeStudentProfile } from '../utils/studentStorage';
import { recordExamScore } from '../utils/studentProgressStorage';
import { getCertificateConfig, subscribeCertificateConfig, CertificateConfig } from '../utils/certificateConfigStorage';
import { CertificateTemplateView } from './CertificateTemplateView';

interface ActiveQuestion extends ComprehensiveExamQuestion {
  shuffledOptions: string[];
}

interface ComprehensiveExamViewProps {
  course?: Course;
  onReturnToStudy: () => void;
  onExamActiveChange: (isActive: boolean) => void;
  completedUnitsCount?: number;
  completedUnitNumbers?: number[];
  isTeacherMode?: boolean;
  examBestScore?: number | null;
}

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export const ComprehensiveExamView: React.FC<ComprehensiveExamViewProps> = ({
  course,
  onReturnToStudy,
  onExamActiveChange,
  completedUnitsCount = 0,
  completedUnitNumbers = [],
  isTeacherMode = false,
  examBestScore = null,
}) => {
  const courseId = course ? course.id : 'sakinan';
  const courseTitle = course ? course.title : 'التقاء الساكنين في التجويد';
  const totalUnitsInCourse = course ? course.units.length : 5;
  const examStorageKey = `tajweed_exam_saved_result_v3_${courseId}`;

  const isMakharijCourse = courseId === 'makharij';
  const targetQuestionCount = isMakharijCourse ? 35 : 20;
  const challengeDuration = isMakharijCourse ? 350 : 150; // 5:50 for 35 questions, 2:30 for 20 questions
  const standardDuration = isMakharijCourse ? 900 : 300; // 15:00 for 35 questions, 5:00 for 20 questions
  const challengeTimeDisplay = isMakharijCourse ? '05:50 دقيقة' : '02:30 دقيقة';
  const standardTimeDisplay = isMakharijCourse ? '15:00 دقيقة' : '05:00 دقائق';

  const [examState, setExamState] = useState<'instructions' | 'taking' | 'submitted'>('instructions');
  const [isChallengeMode, setIsChallengeMode] = useState<boolean>(true);
  const [selectedDifficulty, setSelectedDifficulty] = useState<'all' | ExamDifficultyLevel>('all');
  const [timeLeft, setTimeLeft] = useState<number>(150); // 150s (2:30) for challenge, 300s (5:00) for standard
  const [activeQuestions, setActiveQuestions] = useState<ActiveQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [studentName, setStudentName] = useState<string>('');
  const [nameError, setNameError] = useState<string>('');
  const [savedScore, setSavedScore] = useState<number | null>(null);
  const [savedPercentage, setSavedPercentage] = useState<number | null>(null);
  const [savedTotalPoints, setSavedTotalPoints] = useState<number>(100);
  const [savedPassDate, setSavedPassDate] = useState<string>('');
  const [savedChallengeCompleted, setSavedChallengeCompleted] = useState<boolean>(false);
  const [showIncorrectModal, setShowIncorrectModal] = useState<boolean>(false);
  const [certConfig, setCertConfig] = useState<CertificateConfig>(getCertificateConfig());

  useEffect(() => {
    const unsub = subscribeCertificateConfig((cfg) => setCertConfig(cfg));
    return () => unsub();
  }, []);

  // Check for existing saved passing exam result from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const rawSaved = localStorage.getItem(examStorageKey);
      if (rawSaved) {
        try {
          const parsed = JSON.parse(rawSaved);
          if (parsed && typeof parsed.percentage === 'number' && parsed.percentage >= 90) {
            setStudentName(parsed.studentName || '');
            setSavedScore(parsed.score ?? null);
            setSavedPercentage(parsed.percentage ?? null);
            setSavedTotalPoints(parsed.totalPoints || 100);
            setSavedPassDate(parsed.submittedAt || '');
            setExamState('submitted');
            return;
          }
        } catch (e) {
          console.warn('Failed to parse saved exam result:', e);
        }
      }
    }

    const profile = getStudentProfile();
    if (profile?.name) {
      setStudentName(profile.name);
    }

    const unsubProfile = subscribeStudentProfile((p) => {
      if (p?.name) {
        setStudentName(p.name);
      }
    });

    const handleProgressReset = () => {
      setExamState('instructions');
      setSelectedAnswers({});
      setSavedScore(null);
      setSavedPercentage(null);
      setSavedTotalPoints(100);
      setSavedPassDate('');
      setCurrentIndex(0);
    };
    window.addEventListener('tajweed_progress_reset', handleProgressReset);

    return () => {
      unsubProfile();
      window.removeEventListener('tajweed_progress_reset', handleProgressReset);
    };
  }, [courseId]);

  // Lock header navigation tabs while on instructions or taking exam
  useEffect(() => {
    if (examState === 'instructions' || examState === 'taking') {
      onExamActiveChange(true);
    } else {
      onExamActiveChange(false);
    }
  }, [examState, onExamActiveChange]);

  // Generate randomized questions with shuffled options
  const initializeExam = (difficulty: 'all' | ExamDifficultyLevel = selectedDifficulty) => {
    const examBank: ComprehensiveExamQuestion[] = getComprehensiveExamBank(courseId);
    const filteredBank = difficulty === 'all' 
      ? examBank 
      : examBank.filter((q) => q.level === difficulty);
    const pool = filteredBank.length >= 5 ? filteredBank : examBank;
    const shuffledBank = shuffleArray(pool);
    const selected = shuffledBank.slice(0, Math.min(targetQuestionCount, shuffledBank.length));
    const preparedQuestions: ActiveQuestion[] = selected.map((q) => ({
      ...q,
      shuffledOptions: q.options ? shuffleArray(q.options) : [],
    }));

    setActiveQuestions(preparedQuestions);
    setCurrentIndex(0);
    setSelectedAnswers({});

    const profile = getStudentProfile();
    if (profile?.name) {
      setStudentName(profile.name);
    }
  };

  useEffect(() => {
    initializeExam(selectedDifficulty);
    const unsubscribe = subscribeQuestionBank(() => {
      if (examState === 'instructions') {
        initializeExam(selectedDifficulty);
      }
    });
    return () => unsubscribe();
  }, [courseId, selectedDifficulty]);

  // Countdown timer effect
  useEffect(() => {
    if (examState !== 'taking') return;

    if (timeLeft <= 0) {
      handleSubmitExam();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [examState, timeLeft]);

  const handleStartExam = () => {
    if (!studentName.trim()) {
      setNameError('⚠️ يرجى كتابة اسمك الكامل أولاً قبل بدء الاختبار لنتمكن من توثيق شهادتك الرسمية.');
      return;
    }
    setNameError('');
    saveStudentProfile(studentName.trim());
    setSavedScore(null);
    setSavedPercentage(null);
    initializeExam();
    const duration = isChallengeMode ? challengeDuration : standardDuration;
    setTimeLeft(duration);
    setExamState('taking');
  };

  const handleRetakeExam = () => {
    if (window.confirm('هل ترغب في إعادة خوض الاختبار؟ يمكنك تجربة مجموعة أسئلة جديدة وحفظ النتيجة الجديدة.')) {
      setSavedScore(null);
      setSavedPercentage(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem(examStorageKey);
      }
      setExamState('instructions');
    }
  };

  const handleReturnToCurriculum = () => {
    onExamActiveChange(false);
    onReturnToStudy();
  };

  const totalPoints = savedScore !== null ? savedTotalPoints : (activeQuestions.length > 0 ? activeQuestions.reduce((acc, q) => acc + q.points, 0) : 100);

  const calculateScore = () => {
    let score = 0;
    activeQuestions.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctAnswer) {
        score += q.points;
      }
    });
    return score;
  };

  const handleSelectOption = (questionId: number, option: string) => {
    if (examState === 'submitted') return;
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const handleSubmitExam = async () => {
    setExamState('submitted');
    onExamActiveChange(false);

    const finalScore = calculateScore();
    const finalPercentage = Math.round((finalScore / Math.max(1, totalPoints)) * 100);

    setSavedScore(finalScore);
    setSavedPercentage(finalPercentage);
    setSavedTotalPoints(totalPoints);

    const dateStr = new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
    setSavedPassDate(dateStr);

    await recordExamScore(finalPercentage, courseId);

    const nameToSave = studentName.trim() || 'طالب جديد';
    await saveStudentProfile(nameToSave);

    if (finalPercentage >= 90 && typeof window !== 'undefined') {
      const resultObj = {
        studentName: nameToSave,
        score: finalScore,
        totalPoints,
        percentage: finalPercentage,
        submittedAt: dateStr,
        courseId,
      };
      localStorage.setItem(examStorageKey, JSON.stringify(resultObj));
    }

    const calculatedLevel: ExamDifficultyLevel = selectedDifficulty !== 'all' 
      ? selectedDifficulty 
      : 'intermediate';
    const levelAr = calculatedLevel === 'beginner' ? 'مبتدئ' : calculatedLevel === 'intermediate' ? 'متوسط' : 'متقدم';

    await saveSubmission(
      `الاختبار الشامل (${levelAr}) - ${courseTitle}`,
      'اختبار تقييمي عشوائي من بنك الأسئلة',
      finalScore,
      totalPoints,
      false,
      `اجتاز ${finalScore} من ${totalPoints} بنسبة ${finalPercentage}% - المستوى: ${levelAr} - التقدير: ${getGradeTitle(finalPercentage)}`,
      calculatedLevel
    );
  };

  const getGradeTitle = (pct: number) => {
    if (pct >= 95) return 'ممتاز';
    if (pct >= 90) return 'جيد جداً';
    if (pct >= 70) return 'جيد';
    if (pct >= 60) return 'مقبول';
    if (pct >= 51) return 'ضعيف';
    return 'ضعيف جداً';
  };

  const formatTime = (secondsTotal: number) => {
    const mins = Math.floor(secondsTotal / 60);
    const secs = secondsTotal % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const score = savedScore !== null ? savedScore : calculateScore();
  const percentage = savedPercentage !== null ? savedPercentage : Math.round((score / Math.max(1, totalPoints)) * 100);

  // Dynamic Certificate Configuration Override for Course Title
  const activeCertConfig: CertificateConfig = {
    ...certConfig,
    courseTitle: courseTitle,
  };

  // 0. LOCKED VIEW: When units are not completed yet
  // For Makharij: student can take the 35 random question exam after finishing at least one unit (الباب)
  const isLocked = !isTeacherMode && (
    isMakharijCourse ? completedUnitsCount < 1 : completedUnitsCount < totalUnitsInCourse
  );

  if (isLocked) {
    return (
      <div className="bg-white rounded-3xl p-8 sm:p-12 border-2 border-amber-300 shadow-xl text-center space-y-6 dir-rtl max-w-3xl mx-auto my-6 no-print font-tajawal">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-100 border-4 border-amber-300 text-amber-800 shadow-inner">
          <Lock className="w-10 h-10 text-amber-700" />
        </div>

        <div className="space-y-2">
          <span className="bg-amber-100 text-amber-900 border border-amber-300 px-3 py-1 rounded-full text-xs font-bold font-quran">
            تنبيه نظام الاعتماد المنهجي
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-quran text-slate-900 mt-2">
            {isMakharijCourse
              ? `اختبار حقيبة (${courseTitle}) يتاح بعد إتمام دراسة الباب`
              : `الاختبار الشامل مقفل حتى إتمام دراسة جميع أبواب دورة (${courseTitle})`}
          </h2>
          <p className="text-xs sm:text-sm font-tajawal text-slate-600 max-w-xl mx-auto leading-relaxed">
            {isMakharijCourse
              ? 'وفقاً للنظام التعليمي المعتمد، يتاح اختبار حقيبة مخارج الحروف وصفاتها (35 سؤالاً عشوائياً من أصل 50 سؤالاً) بعد إنهاء دراسة الباب وتثبيت مسائله.'
              : 'وفقاً للنظام التعليمي المعتمد، لا يمكن خوض الاختبار النهائي الشامل إلا بعد الاستيعاب الكامل لدراسة الأبواب التدريبية أولاً.'}
          </p>
        </div>

        {/* Progress Box */}
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4 max-w-md mx-auto">
          <div className="flex items-center justify-between text-xs font-bold font-quran text-slate-800">
            <span>إنجاز دراسة الأبواب المنهاجية:</span>
            <span className="text-emerald-800 font-sans">{completedUnitsCount} / {totalUnitsInCourse} أبواب</span>
          </div>

          <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden p-0.5 border border-slate-300">
            <div
              className="bg-gradient-to-r from-amber-500 to-emerald-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${(completedUnitsCount / Math.max(1, totalUnitsInCourse)) * 100}%` }}
            />
          </div>

          <div className={`grid gap-1.5 pt-2 ${totalUnitsInCourse <= 3 ? 'grid-cols-2' : 'grid-cols-5'}`}>
            {Array.from({ length: totalUnitsInCourse }).map((_, uIdx) => {
              const uNum = uIdx + 1;
              const isComp = completedUnitNumbers.includes(uNum);
              return (
                <div
                  key={uNum}
                  className={`p-2 rounded-xl text-center text-xs font-bold font-quran border ${
                    isComp
                      ? 'bg-emerald-100 border-emerald-400 text-emerald-950'
                      : 'bg-slate-100 border-slate-200 text-slate-400'
                  }`}
                >
                  {isComp ? '✓' : '🔒'} الباب {uNum}
                </div>
              );
            })}
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={handleReturnToCurriculum}
            className="bg-emerald-900 hover:bg-emerald-950 text-amber-300 font-bold font-quran px-8 py-3.5 rounded-2xl transition-all shadow-lg text-sm cursor-pointer border border-amber-400/30"
          >
            الذهاب إلى الأبواب التدريبية الآن
          </button>
        </div>
      </div>
    );
  }

  // 1. INSTRUCTIONS SCREEN (Before starting the exam)
  if (examState === 'instructions') {
    // If student already passed with >= 90%, no retake is necessary
    if ((examBestScore !== null && examBestScore >= 90) || (savedPercentage !== null && savedPercentage >= 90)) {
      const activeScore = savedPercentage !== null ? savedPercentage : (examBestScore || 90);
      return (
        <div className="max-w-4xl mx-auto space-y-6 dir-rtl font-tajawal">
          <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-900 text-white rounded-3xl p-6 sm:p-10 shadow-xl border border-emerald-800 space-y-5 text-center no-print">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-400/20 border-2 border-amber-400 text-amber-300 mx-auto shadow-inner">
              <Trophy className="w-10 h-10 text-amber-300" />
            </div>
            <div className="space-y-2">
              <span className="bg-amber-400 text-emerald-950 font-bold px-4 py-1 rounded-full text-xs font-quran inline-block shadow-sm">
                نتيجة متميزة وشهادة فورية
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold font-quran text-amber-200">
                تهانينا! لقد اجتزت الاختبار النهائي الشامل بنجاح باهر 🎓
              </h1>
            </div>
            <p className="text-sm sm:text-base text-emerald-100 font-tajawal max-w-xl mx-auto leading-relaxed">
              حققت درجة تفوق مرتفعة بنسبة <strong className="text-amber-300 font-bold text-lg font-sans">{activeScore}%</strong> وتم إصدار شهادتك الرسمية فوراً باسم ({studentName || 'الدارس'}).
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => setExamState('submitted')}
                className="w-full sm:w-auto bg-amber-400 hover:bg-amber-300 text-emerald-950 font-extrabold px-8 py-3.5 rounded-2xl text-sm transition-all shadow-lg font-quran cursor-pointer flex items-center justify-center gap-2 border border-amber-300"
              >
                <Award className="w-5 h-5 text-emerald-950" />
                <span>عرض تفاصيل النتيجة الإجمالية</span>
              </button>

              <button
                onClick={handleReturnToCurriculum}
                className="w-full sm:w-auto bg-emerald-900/80 hover:bg-emerald-800 text-emerald-100 font-bold px-6 py-3.5 rounded-2xl text-sm transition-all font-quran cursor-pointer border border-emerald-700 flex items-center justify-center gap-2"
              >
                <BookOpen className="w-4 h-4 text-amber-300" />
                <span>الرجوع إلى المادة العلمية</span>
              </button>
            </div>
          </div>

          {/* Render Official Certificate Directly */}
          <div className="bg-white rounded-3xl p-4 sm:p-8 border-2 border-amber-300 shadow-xl space-y-4">
            <div className="text-center no-print border-b border-amber-100 pb-3">
              <span className="bg-amber-100 text-amber-900 text-xs font-extrabold font-quran px-3 py-1 rounded-full inline-block mb-1">
                الشهادة الرسمية المعتمدة
              </span>
              <h2 className="text-xl font-bold font-quran text-slate-900">شهادة اجتياز دورة ({courseTitle})</h2>
            </div>
            <CertificateTemplateView
              studentName={studentName}
              percentage={activeScore}
              config={activeCertConfig}
              courseId={courseId}
              onPrint={() => window.print()}
            />
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-4xl mx-auto space-y-6 dir-rtl no-print">
        {/* Banner */}
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-lg border border-emerald-800 space-y-3">
          <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase tracking-wider">
            <Award className="w-5 h-5 text-amber-400" />
            <span>الاختبار النهائي الشامل - ضوابط وتنبيهات هامة</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-quran text-amber-100">
            تعليمات ودواعي أداء الاختبار الشامل
          </h1>
          <p className="text-xs sm:text-sm text-emerald-200/90 font-tajawal leading-relaxed">
            يرجى قراءة التعليمات التالية بتركيز قبل البدء. هذا الاختبار يقيس مستوى إتقانك الشامل لجميع أبواب {courseTitle}.
          </p>
        </div>

        {/* Warning Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-amber-300 shadow-md space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-3 bg-amber-100 rounded-2xl text-amber-800 shrink-0">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-quran text-slate-900">
                ضوابط الجلسة الاختبارية
              </h2>
              <p className="text-xs text-slate-500 font-tajawal">
                بمجرد الضغط على زر التأكيد، تُطبق القواعد التالية تلقائياً:
              </p>
            </div>
          </div>

          {/* Exam Mode Selector */}
          <div className="space-y-2.5">
            <label className="block text-xs font-bold text-slate-800 font-quran">
              اختر وضع أداء الاختبار الشامل:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Challenge Mode Option */}
              <button
                type="button"
                onClick={() => setIsChallengeMode(true)}
                className={`p-4 rounded-2xl border-2 text-right transition-all cursor-pointer flex items-start gap-3 relative ${
                  isChallengeMode
                    ? 'bg-amber-500/10 border-amber-500 text-slate-950 shadow-md ring-2 ring-amber-300'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <div className={`p-2.5 rounded-xl shrink-0 ${isChallengeMode ? 'bg-amber-400 text-slate-950 shadow' : 'bg-slate-200 text-slate-600'}`}>
                  <Zap className="w-5 h-5 fill-current" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold font-quran text-sm text-amber-950">وضع التحدي الذكي ⚡</span>
                    <span className="bg-amber-400 text-slate-950 text-[10px] font-bold px-2 py-0.5 rounded-full font-sans">
                      {challengeTimeDisplay}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-tajawal leading-relaxed">
                    مؤقت عد تنازلي سريع وتوزيع عشوائي كامل للأسئلة والخيارات لزيادة التركيز والتحفيز مع وسام التحدي.
                  </p>
                </div>
              </button>

              {/* Standard Mode Option */}
              <button
                type="button"
                onClick={() => setIsChallengeMode(false)}
                className={`p-4 rounded-2xl border-2 text-right transition-all cursor-pointer flex items-start gap-3 relative ${
                  !isChallengeMode
                    ? 'bg-emerald-500/10 border-emerald-600 text-slate-950 shadow-md ring-2 ring-emerald-300'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <div className={`p-2.5 rounded-xl shrink-0 ${!isChallengeMode ? 'bg-emerald-700 text-white shadow' : 'bg-slate-200 text-slate-600'}`}>
                  <Clock className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold font-quran text-sm text-emerald-950">الوضع المعياري التدريبي ⏱️</span>
                    <span className="bg-emerald-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-full font-sans">
                      {standardTimeDisplay}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-tajawal leading-relaxed">
                    وقت مرن ومريح للمراجعة المتأنية مع تغطية كاملة لجميع أبواب المنهج وإصدار الشهادة.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Exam Difficulty Level Selector */}
          <div className="space-y-2.5">
            <label className="block text-xs font-bold text-slate-800 font-quran">
              اختر المستوى التجويدي المطلوب للاختبار:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setSelectedDifficulty('all');
                  initializeExam('all');
                }}
                className={`p-3 rounded-2xl border-2 text-center transition-all cursor-pointer ${
                  selectedDifficulty === 'all'
                    ? 'bg-amber-500/10 border-amber-500 text-slate-950 font-bold shadow ring-2 ring-amber-300'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <div className="text-xs font-quran font-bold">🌐 شامل</div>
                <div className="text-[10px] text-slate-500">كافة المستويات</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedDifficulty('beginner');
                  initializeExam('beginner');
                }}
                className={`p-3 rounded-2xl border-2 text-center transition-all cursor-pointer ${
                  selectedDifficulty === 'beginner'
                    ? 'bg-emerald-500/10 border-emerald-600 text-slate-950 font-bold shadow ring-2 ring-emerald-300'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <div className="text-xs font-quran font-bold text-emerald-800">🌿 مبتدئ</div>
                <div className="text-[10px] text-slate-500">التأسيسي المباشر</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedDifficulty('intermediate');
                  initializeExam('intermediate');
                }}
                className={`p-3 rounded-2xl border-2 text-center transition-all cursor-pointer ${
                  selectedDifficulty === 'intermediate'
                    ? 'bg-amber-500/10 border-amber-500 text-slate-950 font-bold shadow ring-2 ring-amber-300'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <div className="text-xs font-quran font-bold text-amber-900">⚡ متوسط</div>
                <div className="text-[10px] text-slate-500">المنهجي والتطبيقي</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedDifficulty('advanced');
                  initializeExam('advanced');
                }}
                className={`p-3 rounded-2xl border-2 text-center transition-all cursor-pointer ${
                  selectedDifficulty === 'advanced'
                    ? 'bg-purple-500/10 border-purple-600 text-slate-950 font-bold shadow ring-2 ring-purple-300'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <div className="text-xs font-quran font-bold text-purple-900">👑 متقدم</div>
                <div className="text-[10px] text-slate-500">الإتقان والتحريرات</div>
              </button>
            </div>
          </div>

          <div className="space-y-4 font-tajawal text-xs sm:text-sm text-slate-700 leading-relaxed">
            <div className="flex items-start gap-3 bg-amber-50/80 p-4 rounded-2xl border border-amber-200">
              <Clock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <strong className="text-amber-950 block text-sm font-bold mb-0.5">
                  1. عداد زمني محدد ({isChallengeMode ? challengeTimeDisplay : standardTimeDisplay}):
                </strong>
                ستبدأ ساعة تنازلية دقيقة فور التأكيد. يُرجى التركيز والإجابة على الـ {targetQuestionCount} سؤالاً {isMakharijCourse ? '(المختارة عشوائياً من بنك الـ 50 سؤالاً)' : ''} قبل نهاية الوقت.
              </div>
            </div>

            <div className="flex items-start gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <Lock className="w-5 h-5 text-emerald-800 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 block text-sm font-bold mb-0.5">2. إغلاق كامل لأيقونات المادة العلمية:</strong>
                تُقفل جميع تبويبات الشرح والأبواب التدريبية والكلمات المستثناة والملخصات تلقائياً لمنع الاستعانة بالمحتوى أثناء أداء الاختبار.
              </div>
            </div>

            <div className="flex items-start gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <RotateCcw className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 block text-sm font-bold mb-0.5">3. توزيع أسئلة واختيارات عشوائي لكل محاولة:</strong>
                يتم اختيار وترتيب الأسئلة والخيارات آلياً وبشكل عشوائي عند كل بدء اختبار لضمان أصالة القياس وقوة التقييم.
              </div>
            </div>

            <div className="flex items-start gap-3 bg-emerald-50 p-4 rounded-2xl border border-emerald-200 text-emerald-950">
              <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-sm font-bold mb-0.5">4. تقييم الأداء والسجل السحابي:</strong>
                عند إتمام الاختبار بنجاح، يتم حفظ نتيجتك وتقييم مستوى إتقانك في السجل السحابي وتوثيق وسام الإنجاز.
              </div>
            </div>
          </div>

          {/* Student Name Input Box Before Exam Start */}
          {savedPercentage !== null && savedPercentage >= 90 ? (
            <div className="bg-amber-50/90 border-2 border-amber-300 p-6 rounded-2xl text-center space-y-4 font-quran shadow-xs">
              <div className="flex items-center justify-center gap-2 text-amber-950 font-black text-lg sm:text-xl">
                <Award className="w-7 h-7 text-amber-600 shrink-0" />
                <span>تهانينا! لقد اجتزت الاختبار الشامل بنجاح ({savedPercentage}%)</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 font-tajawal max-w-xl mx-auto leading-relaxed">
                نتيجتك الرسمية محفوظة ومسجلة باسم ({studentName || 'الدارس'}).
              </p>
              <button
                type="button"
                onClick={() => setExamState('submitted')}
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black px-8 py-3.5 rounded-2xl text-sm transition-all shadow-md hover:shadow-lg border border-amber-300 cursor-pointer font-quran"
              >
                <Award className="w-5 h-5 text-slate-950" />
                <span>عرض تفاصيل النتيجة</span>
              </button>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white p-5 sm:p-6 rounded-2xl border-2 border-amber-400/80 space-y-3.5 font-quran shadow-inner">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-sm sm:text-base">
                  <Award className="w-5 h-5 text-amber-400 shrink-0" />
                  <span>اسم الدارس / الطالب المعتمد لإصدار الشهادة:</span>
                </div>
                <span className="text-[11px] bg-amber-400/20 text-amber-200 border border-amber-400/40 px-2.5 py-0.5 rounded-full font-tajawal">
                  يُطبع نصياً في الشهادة
                </span>
              </div>
              <input
                type="text"
                value={studentName}
                onChange={(e) => {
                  setStudentName(e.target.value);
                  if (nameError) setNameError('');
                }}
                placeholder="مثال: د. أحمد محمد إبراهيم..."
                className="w-full bg-slate-950 text-amber-200 font-extrabold font-quran text-base sm:text-lg px-4 py-3.5 rounded-xl border-2 border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-300 text-right shadow-inner placeholder:text-slate-500 placeholder:font-normal placeholder:text-sm"
              />
              <div className="flex items-start gap-2 text-[11px] sm:text-xs text-amber-200/90 font-tajawal bg-amber-500/10 p-2.5 rounded-xl border border-amber-400/20">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong>تأكيد الاعتماد:</strong> هذا هو الاسم المسجل منذ بدء الدراسة؛ سيتم توثيق نتيجتك وإصدار شهادة الاجتياز الرسمية الصادرة بهذا الاسم كما هو مدوّن أعلاه.
                </span>
              </div>
              {nameError && (
                <div className="text-xs text-rose-300 font-bold font-tajawal bg-rose-950/80 p-2.5 rounded-xl border border-rose-500/50">
                  {nameError}
                </div>
              )}
            </div>
          )}

          {/* Action Choice Buttons */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
              onClick={handleReturnToCurriculum}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-6 py-3.5 rounded-2xl text-xs sm:text-sm transition-all cursor-pointer border border-slate-300 font-quran"
            >
              <ArrowRight className="w-4 h-4 text-slate-600" />
              <span>الرجوع إلى المادة العلمية (فتح الأيقونات)</span>
            </button>

            {!(savedPercentage !== null && savedPercentage >= 90) && (
              <button
                onClick={handleStartExam}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-900 hover:bg-emerald-950 text-amber-300 font-extrabold px-8 py-3.5 rounded-2xl text-sm sm:text-base transition-all shadow-xl hover:shadow-2xl cursor-pointer border border-amber-400/40 animate-pulse font-quran"
              >
                <Play className="w-5 h-5 fill-amber-300 text-amber-300" />
                <span>تأكيد وابدأ الاختبار الان</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 2. TAKING EXAM & SUBMITTED VIEWS
  if (activeQuestions.length === 0) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-600">
        <div className="w-6 h-6 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin ml-2" />
        <span className="font-tajawal text-sm font-bold">جاري تجهيز بنك الأسئلة الشامل...</span>
      </div>
    );
  }

  const currentQ = activeQuestions[currentIndex];
  const answeredCount = Object.keys(selectedAnswers).length;
  const progressPercentage = Math.round(((currentIndex + 1) / activeQuestions.length) * 100);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-md border border-emerald-800 space-y-3 no-print">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase tracking-wider">
            <Award className="w-5 h-5 text-amber-400" />
            <span>بنك الأسئلة التفاعلي - الاختبار النهائي الشامل</span>
          </div>
          <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-bold px-3 py-1 rounded-full">
            {targetQuestionCount} سؤالاً تقييمياً شاملاً {isMakharijCourse ? '(اختيار عشوائي من 50 سؤالاً)' : ''}
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold font-quran text-amber-100">
          الاختبار التقييمي الكلي لجميع أبواب {courseTitle}
        </h1>
      </div>

      {/* Student Name & Countdown Timer Control Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold font-quran text-slate-800 whitespace-nowrap">اسم الطالب:</span>
          <input
            type="text"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            disabled={examState === 'submitted'}
            placeholder="أدخل اسمك الكريم للشهادة والسجل..."
            className="px-3 py-2 border border-slate-200 rounded-xl text-xs w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-100"
          />
        </div>

        {/* Timer Bar during active exam */}
        {examState === 'taking' && (
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end flex-wrap">
            {isChallengeMode ? (
              <span className="bg-amber-500/20 text-amber-900 border border-amber-400 text-xs font-black px-3 py-1.5 rounded-xl font-quran flex items-center gap-1.5 shadow-xs">
                <Zap className="w-4 h-4 text-amber-600 fill-current animate-pulse" />
                <span>وضع التحدي مفعّل ⚡ (أسئلة عشوائية)</span>
              </span>
            ) : (
              <span className="bg-emerald-50 text-emerald-900 border border-emerald-300 text-xs font-bold px-3 py-1.5 rounded-xl font-quran flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-700" />
                <span>الوضع المعياري ⏱️</span>
              </span>
            )}

            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
              timeLeft <= 30
                ? 'bg-rose-100 text-rose-900 border-rose-400 animate-bounce shadow-md'
                : isChallengeMode
                ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 border-amber-600 shadow-sm font-extrabold'
                : 'bg-emerald-50 text-emerald-950 border-emerald-300'
            }`}>
              <Clock className={`w-4 h-4 ${timeLeft <= 30 ? 'text-rose-600' : isChallengeMode ? 'text-slate-950' : 'text-emerald-700'}`} />
              <span>المتبقي:</span>
              <span className="font-sans text-sm font-extrabold tracking-wider dir-ltr">{formatTime(timeLeft)}</span>
            </div>
          </div>
        )}


      </div>

      {/* BEFORE SUBMISSION: Interactive Slide Interface */}
      {examState === 'taking' ? (
        <div className="space-y-6 no-print">
          {/* Question Index Palette & Progress Indicator */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 font-tajawal">
              <span className="flex items-center gap-1.5 text-emerald-900 font-quran text-sm">
                <span>السؤال</span>
                <strong className="text-amber-600">{currentIndex + 1}</strong>
                <span>من</span>
                <strong>{activeQuestions.length}</strong>
              </span>
              <span className="bg-emerald-50 text-emerald-900 px-3 py-1 rounded-full border border-emerald-200">
                المجاب عنه: {answeredCount} من {activeQuestions.length}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-600 to-amber-500 h-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>

            {/* Jump Buttons 1 to {targetQuestionCount} */}
            <div className="flex items-center justify-start gap-1.5 flex-wrap pt-2 pb-1 max-h-36 overflow-y-auto">
              {activeQuestions.map((q, idx) => {
                const isSelected = selectedAnswers[q.id] !== undefined;
                const isActive = idx === currentIndex;

                let pillClass = 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200';
                if (isActive) {
                  pillClass = 'bg-emerald-900 text-amber-300 border-emerald-800 ring-2 ring-amber-400 font-bold scale-105';
                } else if (isSelected) {
                  pillClass = 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold';
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`w-8 h-8 rounded-xl border text-xs flex items-center justify-center shrink-0 transition-all cursor-pointer ${pillClass}`}
                    title={`انتقل إلى السؤال ${idx + 1}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Question Slide Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-md transition-all space-y-6 relative overflow-hidden">
            {/* Top Badge */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-amber-100 text-amber-950 border border-amber-300 text-xs font-bold px-3 py-1 rounded-full font-quran">
                  الباب {currentQ.unitNumber}
                </span>
                <span className="bg-slate-100 text-slate-700 text-xs font-bold px-2.5 py-1 rounded-full">
                  {currentQ.points} درجات
                </span>
                {currentQ.level === 'beginner' && (
                  <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold px-2.5 py-0.5 rounded-full font-quran">
                    🌿 مبتدئ
                  </span>
                )}
                {(!currentQ.level || currentQ.level === 'intermediate') && (
                  <span className="bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold px-2.5 py-0.5 rounded-full font-quran">
                    ⚡ متوسط
                  </span>
                )}
                {currentQ.level === 'advanced' && (
                  <span className="bg-purple-100 text-purple-900 border border-purple-300 text-xs font-bold px-2.5 py-0.5 rounded-full font-quran">
                    👑 متقدم
                  </span>
                )}
              </div>
              <span className="text-xs text-slate-600 font-tajawal">
                نوع السؤال: {currentQ.type === 'mcq' ? 'اختيار من متعدد' : currentQ.type === 'analysis' ? 'تحليل وشواهد' : 'تصويب أخطاء ولحن'}
              </span>
            </div>

            {/* Question Text */}
            <div className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold font-quran text-slate-900 leading-relaxed">
                {currentIndex + 1}. {currentQ.question}
              </h2>

              {currentQ.contextText && (
                <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 font-quran text-base sm:text-lg text-slate-900 text-center shadow-inner">
                  {currentQ.contextText}
                </div>
              )}
            </div>

            {/* Shuffled Options List */}
            <div className="space-y-3 pt-2">
              {currentQ.shuffledOptions.map((opt, optIdx) => {
                const isOptSelected = selectedAnswers[currentQ.id] === opt;

                return (
                  <button
                    key={optIdx}
                    onClick={() => handleSelectOption(currentQ.id, opt)}
                    className={`w-full text-right p-4 rounded-2xl border text-xs sm:text-sm font-tajawal transition-all leading-relaxed flex items-center justify-between cursor-pointer ${
                      isOptSelected
                        ? 'bg-emerald-950 text-amber-300 border-emerald-800 shadow-md ring-2 ring-emerald-600 font-bold'
                        : 'bg-slate-50 hover:bg-emerald-50/50 border-slate-200 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full border text-xs flex items-center justify-center font-bold shrink-0 ${
                        isOptSelected ? 'bg-amber-400 text-emerald-950 border-amber-300' : 'bg-white text-slate-600 border-slate-300'
                      }`}>
                        {String.fromCharCode(65 + optIdx)}
                      </span>
                      <span>{opt}</span>
                    </div>
                    <span className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                      isOptSelected ? 'border-amber-400 bg-amber-400/20' : 'border-slate-300'
                    }`}>
                      {isOptSelected && <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Navigation Buttons (Previous / Next / Submit) */}
            <div className="flex items-center justify-between pt-6 border-t border-slate-100 gap-3">
              <button
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 font-bold px-5 py-3 rounded-2xl text-xs transition-all cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
                <span>السؤال السابق</span>
              </button>

              {currentIndex < activeQuestions.length - 1 ? (
                <button
                  onClick={() => setCurrentIndex((prev) => Math.min(activeQuestions.length - 1, prev + 1))}
                  className="flex items-center gap-2 bg-emerald-900 hover:bg-emerald-950 text-amber-300 font-bold px-6 py-3 rounded-2xl text-xs transition-all shadow-md cursor-pointer"
                >
                  <span>السؤال التالي</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleSubmitExam}
                  className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-emerald-950 font-bold px-7 py-3 rounded-2xl text-sm transition-all shadow-lg cursor-pointer animate-pulse"
                >
                  <Send className="w-4 h-4" />
                  <span>تأكيد وإرسال الاختبار الشامل</span>
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* AFTER SUBMISSION: Exam Results View with Automatic Certificate when Passed */
        <div className="space-y-6 dir-rtl max-w-4xl mx-auto font-tajawal">
          <div className="bg-white rounded-3xl p-6 sm:p-10 border-2 border-amber-300 shadow-xl text-center space-y-6 no-print">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-100 border-4 border-amber-300 text-amber-800 shadow-inner mb-2">
              <Trophy className="w-10 h-10 text-amber-600" />
            </div>

            <div className="space-y-2">
              <span className={`inline-block px-4 py-1 rounded-full text-xs font-black font-quran border ${
                percentage >= 90
                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                  : 'bg-rose-100 text-rose-950 border-rose-300'
              }`}>
                {percentage >= 90 ? '🎉 مبارك اجتياز الاختبار الشامل بنجاح وإصدار الشهادة!' : '⚠️ نتيجة الاختبار - لم يتم اجتياز الاختبار'}
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold font-quran text-slate-900">
                {studentName.trim() ? `النتيجة الخاصة بالمتعلّم: ${studentName.trim()}` : 'نتيجة خوض الاختبار'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
                {percentage >= 90 
                  ? `أحسنت صنعاً وتألقت في الإجابة على أسئلة الاختبار الشامل لمادة ${courseTitle}. صدَرت شهادتك المعتمدة بالأسفل فوراً!`
                  : `حصلت على نسبة ${percentage}% (تقدير: ${getGradeTitle(percentage)}). تعتبر لم تجتز الاختبار لأن نسبة الاجتياز المعتمدة هي 90% فما فوق. يتوجب عليك إعادة خوض الاختبار، وتم إخفاء فحص الإجابات والشهادة بالكامل حتى تحقيق شرط الاجتياز.`}
              </p>
            </div>

            {/* Score Summary Grid */}
            <div className="bg-gradient-to-r from-amber-50 via-slate-50 to-emerald-50 p-6 rounded-2xl border border-amber-200 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
                <span className="text-xs text-slate-500 font-bold block mb-1">الدرجة والتقدير</span>
                <span className="text-xl font-black font-quran text-slate-800">{score} / {totalPoints}</span>
                <span className="text-xs font-bold text-amber-800 block mt-1 font-quran">التقدير: {getGradeTitle(percentage)}</span>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
                <span className="text-xs text-slate-500 font-bold block mb-1">النسبة المئوية</span>
                <span className="text-2xl font-black font-quran text-amber-700">{percentage}%</span>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
                <span className="text-xs text-slate-500 font-bold block mb-1">نتيجة المحاولة</span>
                {percentage >= 90 ? (
                  <span className="text-xs sm:text-sm font-extrabold font-quran text-emerald-700 mt-1 block">ناجح ومجتاز بنجاح 🎉</span>
                ) : (
                  <span className="text-xs sm:text-sm font-extrabold font-quran text-rose-700 mt-1 block">لم يجتز (يتطلب 90% للاجتياز)</span>
                )}
              </div>
            </div>

            {/* Teaching Qualification Badge for 98%+ */}
            {percentage >= 98 && (
              <div className="bg-emerald-950 text-amber-300 p-4 rounded-2xl border-2 border-amber-400 font-quran text-center space-y-1 shadow-md">
                <div className="text-base sm:text-lg font-black tracking-wide text-amber-300">
                  «مؤهل لتدريس المحتوى ({courseTitle} في التجويد)»
                </div>
                <p className="text-xs text-emerald-200 font-tajawal">
                  تقدير {getGradeTitle(percentage)} استثنائي يؤهلك رسمياً لتدريس وتعليم أحكام المادة العلمية.
                </p>
              </div>
            )}

            {/* Action Choice Buttons */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              {percentage < 90 && (
                <button
                  onClick={handleStartExam}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-900 hover:bg-emerald-950 text-amber-300 font-bold px-6 py-3.5 rounded-2xl text-xs sm:text-sm transition-all shadow-md cursor-pointer border border-amber-400/30 font-quran"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>إعادة خوض الاختبار الشامل</span>
                </button>
              )}

              <button
                onClick={handleReturnToCurriculum}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-5 py-3.5 rounded-2xl text-xs sm:text-sm transition-all cursor-pointer border border-slate-300 font-quran"
              >
                <BookOpen className="w-4 h-4 text-slate-600" />
                <span>الرجوع إلى المادة العلمية</span>
              </button>
            </div>
          </div>

          {/* Automatic Certificate Display when Passed */}
          {percentage >= 90 && (
            <div className="bg-white rounded-3xl p-4 sm:p-8 border-2 border-amber-300 shadow-xl space-y-4">
              <div className="text-center no-print border-b border-amber-100 pb-3">
                <span className="bg-amber-100 text-amber-900 text-xs font-extrabold font-quran px-3 py-1 rounded-full inline-block mb-1">
                  الشهادة المعتمدة المطبوعة
                </span>
                <h2 className="text-xl font-bold font-quran text-slate-900">شهادة الاجتياز والتقدير العام</h2>
              </div>
              <CertificateTemplateView
                studentName={studentName}
                percentage={percentage}
                config={activeCertConfig}
                courseId={courseId}
                onPrint={() => window.print()}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
