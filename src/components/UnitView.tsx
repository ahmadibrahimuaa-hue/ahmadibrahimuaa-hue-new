import React, { useState, useEffect } from 'react';
import { Unit, Lesson, Course } from '../types';
import { MindMapView } from './MindMapView';
import { DiagramTreeRenderer } from './DiagramTreeRenderer';
import { 
  BookOpen, Sparkles, CheckCircle2, HelpCircle, FileText, Layers, 
  ArrowRight, ArrowLeft, RotateCcw, Award, UserCheck, GitBranch, 
  ChevronDown, ChevronUp, Target, Eye, EyeOff, Lightbulb, Edit3, FolderSync,
  Play, Video, ExternalLink, X, PlusCircle, Maximize2, AlertCircle
} from 'lucide-react';
import { saveSubmission } from '../utils/studentStorage';
import { getUnitQuizQuestions, subscribeQuestionBank, UnitQuizQuestion } from '../utils/questionStorage';
import { markUnitCompleted } from '../utils/studentProgressStorage';
import { addLessonToUnit } from '../utils/courseCustomStorage';
import { LessonClassifierModal } from './LessonClassifierModal';
import { MakharijInteractiveAtlas } from './MakharijInteractiveAtlas';
import { SifaatVocalSimulator } from './SifaatVocalSimulator';
import { ALL_COURSES } from '../data/courses';

interface UnitViewProps {
  unit: Unit;
  course?: Course;
  isTeacherMode?: boolean;
  onNavigateToExam?: () => void;
}

/** Helper to convert YouTube / Vimeo / MP4 URLs to embedded player source */
const getEmbedVideoData = (rawUrl?: string): { type: 'youtube' | 'vimeo' | 'video' | 'external'; embedUrl: string } => {
  if (!rawUrl || !rawUrl.trim()) return { type: 'external', embedUrl: '' };
  const trimmed = rawUrl.trim();

  // YouTube match: standard watch, short link, or embed
  const ytMatch = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  if (ytMatch && ytMatch[1]) {
    return {
      type: 'youtube',
      embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0`,
    };
  }

  // Vimeo match
  const vimeoMatch = trimmed.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)/);
  if (vimeoMatch && vimeoMatch[1]) {
    return {
      type: 'vimeo',
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`,
    };
  }

  // Direct MP4 / WebM / OGG video files
  if (trimmed.match(/\.(mp4|webm|ogg)($|\?)/i)) {
    return {
      type: 'video',
      embedUrl: trimmed,
    };
  }

  return {
    type: 'external',
    embedUrl: trimmed,
  };
};

/* Helper Component for Rendering Rich Structured Markdown Lesson Content */
const FormattedLessonContent: React.FC<{ markdown: string }> = ({ markdown }) => {
  const lines = markdown.split('\n');

  return (
    <div className="space-y-5 font-tajawal text-slate-800 text-sm sm:text-base leading-[2.1]">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return null;

        // Level 3 Heading (###)
        if (trimmed.startsWith('### ')) {
          return (
            <div key={idx} className="pt-4 pb-1 border-b-2 border-emerald-800/20 flex items-center gap-2.5">
              <span className="w-2.5 h-6 bg-emerald-800 rounded-full inline-block shrink-0" />
              <h3 className="text-base sm:text-lg font-bold font-quran text-emerald-950">
                {trimmed.replace('### ', '')}
              </h3>
            </div>
          );
        }

        // Level 4 Heading (####)
        if (trimmed.startsWith('#### ')) {
          return (
            <div key={idx} className="bg-amber-50/80 p-3.5 rounded-xl border-r-4 border-amber-500 my-2">
              <h4 className="text-sm sm:text-base font-bold font-quran text-amber-950 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-600 shrink-0" />
                {trimmed.replace('#### ', '')}
              </h4>
            </div>
          );
        }

        // Separator (---)
        if (trimmed === '---') {
          return <hr key={idx} className="my-4 border-slate-200" />;
        }

        // Bullet Point (* or -)
        if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
          const content = trimmed.substring(2);
          return (
            <div key={idx} className="flex items-start gap-2.5 my-1.5 pr-2 sm:pr-4">
              <span className="w-2 h-2 rounded-full bg-emerald-700 shrink-0 mt-2.5" />
              <p className="text-slate-800 leading-relaxed">{renderInlineFormatting(content)}</p>
            </div>
          );
        }

        // Numbered List Item (1. , 2. , etc.)
        if (/^\d+\.\s/.test(trimmed)) {
          const numberMatch = trimmed.match(/^(\d+)\.\s(.*)/);
          if (numberMatch) {
            return (
              <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 my-2 flex items-start gap-3">
                <span className="w-7 h-7 rounded-lg bg-emerald-900 text-amber-300 font-bold font-quran text-xs flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                  0{numberMatch[1]}
                </span>
                <p className="text-slate-800 leading-relaxed text-sm sm:text-base">{renderInlineFormatting(numberMatch[2])}</p>
              </div>
            );
          }
        }

        // Standard Paragraph
        return (
          <p key={idx} className="text-slate-800 leading-[2.2] my-1">
            {renderInlineFormatting(trimmed)}
          </p>
        );
      })}
    </div>
  );
};

/* Helper to highlight Quranic verses ﴿...﴾ and bold text **...** */
function renderInlineFormatting(text: string) {
  // Replace Quranic brackets ﴿...﴾ with golden badge styling
  const parts = text.split(/(﴿[^﴾]+﴾|\*\*[^*]+\*\*)/g);

  return parts.map((part, i) => {
    if (part.startsWith('﴿') && part.endsWith('﴾')) {
      return (
        <span key={i} className="font-quran text-amber-900 font-bold bg-amber-100/90 border border-amber-300 px-2 py-0.5 rounded-lg mx-1 inline-block text-base sm:text-lg shadow-sm">
          {part}
        </span>
      );
    }
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-bold text-emerald-950 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/80">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

export const UnitView: React.FC<UnitViewProps> = ({ unit, course, isTeacherMode = true, onNavigateToExam }) => {
  const [activeLessonIndex, setActiveLessonIndex] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'lesson' | 'quiz' | 'atlas' | 'sifaat'>('lesson');
  const [showDiagramTree, setShowDiagramTree] = useState<boolean>(true);
  const [showClassifierModal, setShowClassifierModal] = useState<boolean>(false);
  const [showTeacherGuide, setShowTeacherGuide] = useState<boolean>(false);

  const isTeacherGuideActive = isTeacherMode || showTeacherGuide;

  // Store quiz answers and submission states per course and unit number to keep them strictly isolated
  const courseId = course?.id || 'sakinan';
  const unitKey = `${courseId}_u${unit.unitNumber}`;

  const [allUnitsAnswers, setAllUnitsAnswers] = useState<Record<string, Record<number, number>>>(() => {
    try {
      const raw = localStorage.getItem('tajweed_unit_quiz_answers_v3');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (typeof parsed === 'object' && parsed !== null) {
          return parsed;
        }
      }
      return {};
    } catch {
      return {};
    }
  });

  const [allUnitsSubmitted, setAllUnitsSubmitted] = useState<Record<string, boolean>>(() => {
    try {
      const raw = localStorage.getItem('tajweed_unit_quiz_submitted_v3');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  const getQuestionsForUnit = (): UnitQuizQuestion[] => {
    return getUnitQuizQuestions(unit.unitNumber, courseId);
  };

  const [quizQuestions, setQuizQuestions] = useState<UnitQuizQuestion[]>(getQuestionsForUnit);

  useEffect(() => {
    try {
      localStorage.setItem('tajweed_unit_quiz_answers_v3', JSON.stringify(allUnitsAnswers));
    } catch (e) {
      console.warn(e);
    }
  }, [allUnitsAnswers]);

  useEffect(() => {
    try {
      localStorage.setItem('tajweed_unit_quiz_submitted_v3', JSON.stringify(allUnitsSubmitted));
    } catch (e) {
      console.warn(e);
    }
  }, [allUnitsSubmitted]);

  useEffect(() => {
    setActiveLessonIndex(0);
    setViewMode('lesson');
    setQuizQuestions(getQuestionsForUnit());
    const unsubscribe = subscribeQuestionBank(() => {
      setQuizQuestions(getQuestionsForUnit());
    });

    const handleProgressReset = () => {
      setAllUnitsAnswers({});
      setAllUnitsSubmitted({});
    };
    window.addEventListener('tajweed_progress_reset', handleProgressReset);

    return () => {
      unsubscribe();
      window.removeEventListener('tajweed_progress_reset', handleProgressReset);
    };
  }, [unit, courseId]);

  const rawUnitAnswers = allUnitsAnswers[unitKey];
  const quizAnswers = (typeof rawUnitAnswers === 'object' && rawUnitAnswers !== null) ? rawUnitAnswers : {};
  const quizSubmitted = !!allUnitsSubmitted[unitKey];

  const currentLesson: Lesson = unit.lessons[activeLessonIndex] || unit.lessons[0];

  const defaultCourseObj = ALL_COURSES.find((c) => c.id === courseId);
  const defaultUnitObj = defaultCourseObj?.units?.find((u) => u.unitNumber === unit.unitNumber);
  const defaultLessonObj = defaultUnitObj?.lessons?.find((l) => l.lessonNumber === currentLesson.lessonNumber);

  // Explanatory Video states & handlers
  const effectiveVideoUrl = currentLesson.videoUrl || defaultLessonObj?.videoUrl;
  const [showVideoModal, setShowVideoModal] = useState<boolean>(false);
  const [isEditingVideoUrl, setIsEditingVideoUrl] = useState<boolean>(false);
  const [videoUrlInput, setVideoUrlInput] = useState<string>('');

  const handleSaveVideoUrl = (newUrl: string) => {
    const updatedLesson: Lesson = {
      ...currentLesson,
      videoUrl: newUrl.trim() || undefined,
    };
    addLessonToUnit(courseId, unit.id, updatedLesson);
    currentLesson.videoUrl = newUrl.trim() || undefined;
    setIsEditingVideoUrl(false);
  };

  const activeDiscussionAnswers: string[] = (currentLesson.discussionAnswers && currentLesson.discussionAnswers.length > 0)
    ? currentLesson.discussionAnswers
    : (defaultLessonObj?.discussionAnswers || []);

  const activeHomeworkSolution: string = currentLesson.homeworkSolution || defaultLessonObj?.homeworkSolution || '';
  const activeRecitationGuide: string = currentLesson.recitationGuide || defaultLessonObj?.recitationGuide || '';

  const handleQuizSelect = (questionId: number, optionIndex: number) => {
    if (quizSubmitted) return;
    setAllUnitsAnswers(prev => ({
      ...prev,
      [unitKey]: {
        ...(prev[unitKey] || {}),
        [questionId]: optionIndex
      }
    }));
  };

  const handleQuizSubmit = async () => {
    setAllUnitsSubmitted(prev => ({
      ...prev,
      [unitKey]: true
    }));

    let score = 0;
    quizQuestions.forEach((q) => {
      if (quizAnswers[q.id] === q.correctIndex) {
        score += 1;
      }
    });
    // Record unit completion in progress tracker with current courseId
    await markUnitCompleted(unit.unitNumber, true, courseId);

    // Only save student submissions when NOT in teacher mode
    if (!isTeacherMode) {
      await saveSubmission(`[${course?.shortTitle || courseId}] ${unit.title}`, unit.quiz.title, score, quizQuestions.length, isTeacherMode);
    }
  };

  const handleQuizReset = () => {
    setAllUnitsAnswers(prev => ({
      ...prev,
      [unitKey]: {}
    }));
    setAllUnitsSubmitted(prev => ({
      ...prev,
      [unitKey]: false
    }));
  };

  const isIdgham = courseId === 'idgham' || course?.id === 'idgham';
  const isMakharij = courseId === 'makharij' || course?.id === 'makharij' || unit.id.startsWith('makharij');

  const handleFinishUnitAndStartExam = async () => {
    await markUnitCompleted(unit.unitNumber, true, courseId);
    if (onNavigateToExam) {
      onNavigateToExam();
    } else {
      setViewMode('quiz');
    }
  };

  return (
    <div className="space-y-8">
      {/* Teacher Mode Notice Banner */}
      {isTeacherMode && (
        <div className="bg-amber-400/20 border-2 border-amber-400 text-slate-900 rounded-2xl p-4 text-xs sm:text-sm flex items-center justify-between gap-3 shadow-sm font-tajawal">
          <div className="flex items-center gap-2.5">
            <UserCheck className="w-5 h-5 text-amber-700 shrink-0" />
            <span>
              <strong>دليل المعلم والمدرب مفعّل:</strong> يتم الآن عرض الخرائط المفاهيمية التشجيرية، والحلول النموذجية للواجبات والتطبيقات الشفهية، وإجابات أسئلة المناقشة في كل درس.
            </span>
          </div>
          <span className="bg-amber-400 text-slate-950 px-3 py-1 rounded-full text-xs font-bold font-quran shrink-0 shadow">
            نسخة المعلم
          </span>
        </div>
      )}

      {/* Unit Header Banner */}
      <div className={`rounded-2xl p-6 sm:p-8 shadow-md border space-y-3 ${
        isIdgham
          ? 'bg-gradient-to-r from-indigo-950 via-purple-950 to-slate-950 text-white border-purple-800'
          : 'bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-950 text-white border-emerald-800'
      }`}>
        <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase tracking-wider">
          <BookOpen className="w-4 h-4 text-amber-400" />
          <span>الوحدة التدريبية المقررة</span>
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] ${
            isIdgham ? 'bg-purple-900 text-amber-200' : 'bg-emerald-800 text-amber-200'
          }`}>
            {unit.estimatedLectures}
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold font-quran text-amber-100 leading-snug">
          {unit.title}
        </h1>
        <p className={`text-xs sm:text-sm font-tajawal max-w-3xl leading-relaxed ${
          isIdgham ? 'text-purple-100/90' : 'text-emerald-200/90'
        }`}>
          {unit.subtitle}
        </p>

        {/* Lesson Tabs Navigation */}
        <div className={`flex flex-wrap items-center gap-2 pt-4 border-t ${
          isIdgham ? 'border-purple-800/80' : 'border-emerald-800/80'
        }`}>
          {unit.lessons.map((lesson, idx) => (
            <button
              key={lesson.id}
              onClick={() => {
                setActiveLessonIndex(idx);
                setViewMode('lesson');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold font-quran transition-all flex items-center gap-2 cursor-pointer ${
                viewMode === 'lesson' && activeLessonIndex === idx
                  ? 'bg-amber-400 text-slate-950 shadow-md scale-105'
                  : isIdgham
                  ? 'bg-purple-950/70 text-purple-200 hover:bg-purple-900'
                  : 'bg-emerald-900/60 text-emerald-200 hover:bg-emerald-800'
              }`}
            >
              <span>الدرس 0{lesson.lessonNumber}: {lesson.title.split(':')[1] || lesson.title}</span>
            </button>
          ))}

          {/* Interactive Visual Atlas & Vocal Simulator Tabs - Exclusively for Makharij Course */}
          {isMakharij && (
            <>
              <button
                onClick={() => setViewMode('atlas')}
                className={`px-4 py-2 rounded-xl text-xs font-bold font-quran transition-all flex items-center gap-2 cursor-pointer shadow-sm ${
                  viewMode === 'atlas'
                    ? 'bg-amber-400 text-slate-950 shadow-md scale-105 font-black'
                    : 'bg-emerald-900/90 hover:bg-emerald-800 text-amber-300 border border-amber-400/40'
                }`}
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>أطلس المخارج المصور (الـ 17 مخرجاً)</span>
              </button>

              <button
                onClick={() => setViewMode('sifaat')}
                className={`px-4 py-2 rounded-xl text-xs font-bold font-quran transition-all flex items-center gap-2 cursor-pointer shadow-sm ${
                  viewMode === 'sifaat'
                    ? 'bg-amber-400 text-slate-950 shadow-md scale-105 font-black'
                    : 'bg-indigo-950 hover:bg-indigo-900 text-indigo-200 border border-indigo-500/40'
                }`}
              >
                <Layers className="w-4 h-4 text-indigo-300" />
                <span>محاكي حركة الأوتار واللسان مع الصفات</span>
              </button>
            </>
          )}

          <button
            onClick={() => setViewMode('quiz')}
            className={`px-4 py-2 rounded-xl text-xs font-bold font-quran transition-all flex items-center gap-2 cursor-pointer ${
              viewMode === 'quiz'
                ? 'bg-amber-400 text-slate-950 shadow-md scale-105'
                : isIdgham
                ? 'bg-indigo-900/90 text-amber-300 hover:bg-indigo-800 border border-purple-500/40'
                : 'bg-purple-900/80 text-purple-200 hover:bg-purple-800'
            }`}
          >
            <Award className="w-4 h-4 text-amber-300" />
            <span>الاختبار القصير والمراجعة</span>
          </button>
        </div>
      </div>

      {viewMode === 'atlas' && (
        <div className="space-y-6">
          <MakharijInteractiveAtlas />
        </div>
      )}

      {viewMode === 'sifaat' && (
        <div className="space-y-6">
          <SifaatVocalSimulator />
        </div>
      )}

      {viewMode === 'lesson' && (
        /* Lesson Detailed Content Structure */
        <div className="space-y-8">
          
          {/* STEP 1: Educational Objectives */}
          <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 font-bold text-sm flex items-center justify-center shrink-0 font-quran shadow-sm">
                  0{currentLesson.lessonNumber}
                </div>
                <div>
                  <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full font-tajawal border border-amber-200">
                    أولاً: الأهداف التربوية والتعليمية للدرس
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold font-quran text-slate-900 mt-1">
                    {currentLesson.title}
                  </h2>
                  <p className="text-xs text-slate-500 font-tajawal">{currentLesson.subtitle}</p>
                </div>
              </div>

              {isTeacherMode && (
                <button
                  onClick={() => setShowClassifierModal(true)}
                  className="bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 px-3.5 py-2 rounded-xl text-xs font-bold font-quran flex items-center gap-1.5 transition-all shadow-sm cursor-pointer shrink-0"
                  title="تصنيف ونقل هذا الدرس إلى حقيبة أو مستوى دراسي آخر أو إنشاء حقيبة جديدة له"
                >
                  <FolderSync className="w-4 h-4 text-amber-800" />
                  <span>تصنيف / نقل هذا الدرس</span>
                </button>
              )}
            </div>

            <div className={`p-5 rounded-2xl border space-y-3 ${
              isIdgham
                ? 'bg-purple-50/80 border-purple-200'
                : 'bg-emerald-50/80 border-emerald-200'
            }`}>
              <span className={`font-bold font-quran text-sm flex items-center gap-2 ${
                isIdgham ? 'text-purple-950' : 'text-emerald-950'
              }`}>
                <Target className={`w-5 h-5 ${isIdgham ? 'text-purple-700' : 'text-emerald-700'}`} />
                المخرجات والنتائج التعليمية المتوقعة بنهاية الدرس:
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs sm:text-sm text-slate-800 font-tajawal">
                {currentLesson.objectives.map((obj, i) => (
                  <div key={i} className={`bg-white p-3 rounded-xl border flex items-start gap-2 shadow-sm ${
                    isIdgham ? 'border-purple-200/80' : 'border-emerald-200/80'
                  }`}>
                    <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${
                      isIdgham ? 'text-purple-700' : 'text-emerald-600'
                    }`} />
                    <span className="leading-relaxed">{obj}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Explanatory Video Card & Play Button */}
          {effectiveVideoUrl ? (
            <div className="bg-gradient-to-r from-red-950/90 via-slate-900 to-amber-950/80 rounded-2xl p-5 text-white border-2 border-red-500/50 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 text-white flex items-center justify-center shrink-0 shadow-lg shadow-red-600/30 animate-pulse">
                  <Play className="w-6 h-6 fill-white ml-0.5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold bg-red-600 text-white px-2.5 py-0.5 rounded-full font-tajawal shadow-sm">
                      🎬 فيديو شرحي تفاعلي
                    </span>
                    <span className="text-xs text-amber-300 font-bold font-tajawal">
                      شرح مرئي وتطبيقي للدرس
                    </span>
                  </div>
                  <h4 className="text-sm sm:text-base font-bold font-quran text-slate-100 mt-1">
                    الشرح المرئي المصاحب: {currentLesson.title}
                  </h4>
                  <p className="text-xs text-slate-300 font-tajawal">
                    شاهد التوجيه الصوتي الدقيق ومخارج الحروف مع الشرح الشفهي المعتمد.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0">
                <button
                  type="button"
                  onClick={() => setShowVideoModal(true)}
                  className="flex-1 sm:flex-none bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold font-quran px-5 py-3 rounded-xl text-xs sm:text-sm transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer hover:scale-105 active:scale-95"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>تشغيل فيديو الشرح 🎬</span>
                </button>

                {isTeacherMode && (
                  <button
                    type="button"
                    onClick={() => {
                      setVideoUrlInput(effectiveVideoUrl || '');
                      setIsEditingVideoUrl(true);
                    }}
                    className="bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 px-3 py-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
                    title="تعديل رابط الفيديو كمعلم"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">تعديل الرابط</span>
                  </button>
                )}
              </div>
            </div>
          ) : isTeacherMode ? (
            <div className="bg-slate-900/70 border border-dashed border-slate-700 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-300">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center shrink-0">
                  <Video className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <span className="font-bold text-amber-300 block font-quran">
                    فيديو الشرح المرئي (خاص بإدارة المعلم):
                  </span>
                  <span className="text-slate-400">
                    لم يتم تعيين رابط فيديو شرحي لهذا الدرس بعد. يمكنك إرفاق رابط يوتيوب أو ملف MP4 هنا.
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setVideoUrlInput('');
                  setIsEditingVideoUrl(true);
                }}
                className="bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 border border-amber-400/40 px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>إضافة رابط فيديو للدرس</span>
              </button>
            </div>
          ) : null}

          {/* STEP 2: Explanation & Scientific Content */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <BookOpen className="w-5 h-5 text-emerald-800" />
              <h3 className="text-lg font-bold font-quran text-slate-900">
                ثانياً: الشرح والتأصيل العلمي والمعرفي
              </h3>
            </div>

            {/* Rendered Structured Markdown */}
            <FormattedLessonContent markdown={currentLesson.contentMarkdown} />
          </div>

          {/* STEP 3: Interactive Diagram Tree & Concept Map (Toggleable Icon Button) */}
          {currentLesson.diagramTree && (
            <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 rounded-2xl p-6 text-white border-2 border-amber-400/50 shadow-lg space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-400 text-emerald-950 flex items-center justify-center shrink-0 shadow-md">
                    <GitBranch className="w-6 h-6 text-emerald-950 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold font-quran text-amber-200">
                      ثالثاً: الخريطة المفاهيمية والتشجير التفاعلي للدرس
                    </h3>
                    <p className="text-xs text-emerald-200/90 font-tajawal">
                      اضغط على زر الأيقونة أدناه لإظهار أو إخفاء الشجرة التوضيحية والتشجير السريع لشرح الدرس.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowDiagramTree(!showDiagramTree)}
                  className="bg-amber-400 hover:bg-amber-300 text-emerald-950 font-bold font-quran px-5 py-2.5 rounded-xl text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-2 shrink-0 border border-amber-300"
                >
                  <GitBranch className="w-4 h-4" />
                  <span>{showDiagramTree ? 'إخفاء التشجير' : 'إظهار التشجير التفاعلي'}</span>
                  {showDiagramTree ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>

              {showDiagramTree && (
                <div className="pt-2 animate-fadeIn">
                  <DiagramTreeRenderer tree={currentLesson.diagramTree} lessonTitle={currentLesson.title} />
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Quranic Evidence Analysis Laboratory */}
          {currentLesson.examples && currentLesson.examples.length > 0 && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <FileText className="w-5 h-5 text-emerald-800" />
                <h3 className="text-lg font-bold font-quran text-slate-900">
                  رابعاً: تحليل الشواهد والأمثلة القرآنية التطبيقية
                </h3>
              </div>

              <div className="space-y-4">
                {currentLesson.examples.map((ex, i) => (
                  <div key={i} className="bg-emerald-50/40 rounded-2xl p-5 border border-emerald-200 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200/60 pb-3">
                      <div className="font-quran text-lg font-bold text-slate-900 bg-amber-50 px-4 py-2 rounded-xl border border-amber-200">
                        ﴿{ex.targetPhrase}﴾ — سورة {ex.surahName}: {ex.ayahNumber}
                      </div>
                      <span className="text-xs font-bold bg-emerald-900 text-amber-300 px-3 py-1 rounded-full shrink-0">
                        طريقة التخلص: {ex.method}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <span className="font-bold text-slate-500 block">الساكن الأول:</span>
                        <span className="font-bold text-slate-900">{ex.firstSukoon}</span>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <span className="font-bold text-slate-500 block">الساكن الثاني:</span>
                        <span className="font-bold text-slate-900">{ex.secondSukoon}</span>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <span className="font-bold text-slate-500 block">سبب الالتقاء:</span>
                        <span className="text-slate-800">{ex.reason}</span>
                      </div>
                    </div>

                    <div className="bg-emerald-900 text-amber-200 p-3.5 rounded-xl text-xs font-quran leading-relaxed">
                      <strong>الدليل والأداء الصوتي الصحيح:</strong> {ex.pronunciationGuide}
                    </div>

                    {ex.qiraatNote && (
                      <div className="bg-amber-100/90 border border-amber-300 text-slate-900 p-3.5 rounded-xl text-xs font-tajawal leading-relaxed space-y-1">
                        <span className="font-bold text-amber-950 font-quran flex items-center gap-1.5">
                          <BookOpen className="w-4 h-4 text-amber-800" />
                          توجيه القراءات القرائية وتنوع الروايات:
                        </span>
                        <p>{ex.qiraatNote}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 5: Exercises, Discussion, Homework & Recitation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Exercises Box */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="font-bold text-slate-900 font-quran text-base border-b border-slate-100 pb-2 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-amber-600" />
                <span>خامساً: تدريبات وتطبيقات الدرس المتدرجة:</span>
              </div>

              <div className="space-y-3">
                {currentLesson.exercises.map((ex, i) => (
                  <div key={`ex_${unit.id}_${activeLessonIndex}_${i}`} className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
                    <div className="font-bold text-emerald-950 font-quran text-sm">{ex.title}</div>
                    <p className="text-slate-700 leading-relaxed">{ex.question}</p>
                    
                    {isTeacherMode ? (
                      <div className="bg-emerald-50 p-2.5 rounded-lg border border-emerald-200 text-emerald-900 font-bold flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                        <span>الإجابة النموذجية (دليل المعلم): {ex.correctAnswer}</span>
                      </div>
                    ) : (
                      <div className="pt-1 space-y-2">
                        <input
                          type="text"
                          placeholder="اكتب إجابتك للتطبيق هنا..."
                          className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-amber-500 font-tajawal text-right"
                        />
                        <details className="text-slate-600 bg-white border border-slate-200 rounded-lg p-2 cursor-pointer">
                          <summary className="font-bold text-amber-800 text-[11px] font-quran select-none">
                            انقر هنا لعرض نموذج الإجابة للتحقق بعد المحاولة
                          </summary>
                          <p className="mt-2 text-xs font-bold text-emerald-900 bg-emerald-50 p-2 rounded border border-emerald-200">
                            الإجابة الصحيحة: {ex.correctAnswer}
                          </p>
                        </details>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Homework & Discussion Box */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="font-bold text-slate-900 font-quran text-base border-b border-slate-100 pb-2 flex items-center gap-2 justify-between flex-wrap">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-700" />
                  <span>أسئلة المناقشة والواجب المنزلي والتلاوة:</span>
                </div>
                {isTeacherGuideActive ? (
                  <span className="text-[11px] font-bold bg-amber-400 text-slate-950 px-2.5 py-1 rounded-full font-quran flex items-center gap-1 shadow-sm">
                    <UserCheck className="w-3.5 h-3.5 text-slate-950" />
                    نسخة المعلم (الإجابات ظاهرة)
                  </span>
                ) : (
                  <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-quran">
                    نسخة الطالب (الأسئلة فقط)
                  </span>
                )}
              </div>

              {/* Teacher Mode Notice Banner */}
              {isTeacherGuideActive && (
                <div className="bg-gradient-to-r from-amber-500/15 via-amber-400/10 to-emerald-500/10 border-2 border-amber-400/80 rounded-xl p-3 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-bold shrink-0">
                      <UserCheck className="w-4 h-4 text-slate-950" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-950 font-quran text-xs sm:text-sm flex items-center gap-1.5">
                        <span>دليل المعلم والمدرب: الإجابات النموذجية ومحاور النقاش مفعلة</span>
                        <span className="bg-emerald-700 text-white text-[9px] px-2 py-0.5 rounded-full font-sans font-bold">خاص بالمعلم</span>
                      </div>
                      <p className="text-[11px] text-slate-700 font-tajawal">
                        هذه الإجابات ظاهرة أمامك الآن بصفتك معلماً، ومحجوبة تماماً وتلقائياً عن حسابات وشاشات الطلاب.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4 text-xs font-tajawal">
                {/* Discussion Questions */}
                <div className="bg-amber-50/80 p-4 rounded-xl border border-amber-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-950 font-quran text-sm flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-600" />
                      أسئلة المناقشة التفاعلية:
                    </span>
                    {!isTeacherGuideActive && (
                      <span className="text-[10px] text-amber-800 bg-amber-200/60 px-2 py-0.5 rounded-md font-quran">
                        موجهة لمشاركة الطلاب
                      </span>
                    )}
                  </div>

                  <ul className="list-disc pr-4 space-y-3 text-slate-800">
                    {currentLesson.discussionQuestions.map((q, i) => (
                      <li key={i} className="leading-relaxed">
                        <span className="font-bold text-slate-900 text-xs sm:text-sm">{q}</span>

                        {/* Teacher In-Line Answer when teacher mode is active */}
                        {isTeacherGuideActive && (
                          <div className="mt-2 p-3 bg-amber-100/90 rounded-xl border-r-4 border-amber-600 text-slate-900 text-xs font-tajawal shadow-2xs">
                            <span className="font-bold text-amber-950 font-quran flex items-center gap-1.5 text-xs mb-1">
                              <UserCheck className="w-3.5 h-3.5 text-amber-800" />
                              إجابة الشرح وتوجيه المعلم لسؤال {i + 1}:
                            </span>
                            <p className="text-slate-800 leading-relaxed font-tajawal text-xs sm:text-[13px] whitespace-pre-line">
                              {activeDiscussionAnswers[i] || 'يوجّه المعلم المتدربين إلى استخراج الحكم وتطبيقه صوتاً وربطه بالقواعد التجويدية المقررة في الباب.'}
                            </p>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>

                  {/* Supplemental Discussion Answers if any */}
                  {isTeacherGuideActive && activeDiscussionAnswers.length > currentLesson.discussionQuestions.length && (
                    <div className="mt-2 pt-2 border-t border-amber-300 space-y-1.5 bg-amber-100/90 p-3 rounded-lg">
                      <span className="font-bold text-amber-950 font-quran text-xs flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-amber-800" />
                        توجيهات وإجابات إضافية للمعلم:
                      </span>
                      <ul className="space-y-1.5 text-slate-800 text-xs font-tajawal list-disc pr-4">
                        {activeDiscussionAnswers.slice(currentLesson.discussionQuestions.length).map((ans, aIdx) => (
                          <li key={aIdx} className="leading-relaxed">{ans}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Homework Task */}
                <div className="bg-purple-50/80 p-4 rounded-xl border border-purple-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-purple-950 font-quran text-sm flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-purple-600" />
                      الواجب المنزلي المطلوب:
                    </span>
                    {!isTeacherGuideActive && (
                      <span className="text-[10px] text-purple-800 bg-purple-200/60 px-2 py-0.5 rounded-md font-quran">
                        مطلوب إنجازه من الطالب
                      </span>
                    )}
                  </div>
                  <p className="text-purple-950 leading-relaxed bg-white/80 p-3 rounded-xl border border-purple-100">
                    {currentLesson.homeworkTask}
                  </p>

                  {/* Teacher Solution for Homework */}
                  {isTeacherGuideActive && (
                    <div className="mt-2 pt-2 border-t border-purple-300 space-y-1.5 bg-purple-100/90 p-3.5 rounded-xl text-xs border-r-4 border-purple-600">
                      <span className="font-bold text-purple-950 font-quran flex items-center gap-1.5 text-xs">
                        <UserCheck className="w-3.5 h-3.5 text-purple-800" />
                        نموذج الإجابة والتصحيح المعتمد لنسخة المعلم:
                      </span>
                      <p className="text-purple-950 whitespace-pre-line leading-relaxed font-tajawal text-xs sm:text-[13px]">
                        {activeHomeworkSolution || 'يصحح المعلم التطبيق بمطابقة الأمثلة المستخرجة مع الشروط والقواعد المحددة في الدرس.'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Recitation Task */}
                <div className="bg-emerald-50/80 p-4 rounded-xl border border-emerald-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-950 font-quran text-sm flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-emerald-700" />
                      التكليف التطبيقي في التلاوة:
                    </span>
                    {!isTeacherGuideActive && (
                      <span className="text-[10px] text-emerald-800 bg-emerald-200/60 px-2 py-0.5 rounded-md font-quran">
                        تطبيق صوتي مباشر
                      </span>
                    )}
                  </div>
                  <p className="text-emerald-950 leading-relaxed bg-white/80 p-3 rounded-xl border border-emerald-100">
                    {currentLesson.recitationTask}
                  </p>

                  {/* Teacher Recitation Guide */}
                  {isTeacherGuideActive && (
                    <div className="mt-2 pt-2 border-t border-emerald-300 space-y-1.5 bg-emerald-100/90 p-3.5 rounded-xl text-xs border-r-4 border-emerald-600">
                      <span className="font-bold text-emerald-950 font-quran flex items-center gap-1.5 text-xs">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-800" />
                        توجيه المعلم والمدرب للطلاب عند الاستماع للتلاوة:
                      </span>
                      <p className="text-emerald-950 leading-relaxed font-tajawal text-xs sm:text-[13px]">
                        {activeRecitationGuide || 'التركيز على ضبط الانتقال الصوتي وتطبيق الحكم بسلاسة دون تكلف، وتنبيه الطالب عند الخلط بين الحركات.'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Lesson Navigation Controls */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 font-tajawal">
            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
              <button
                type="button"
                disabled={activeLessonIndex === 0}
                onClick={() => {
                  if (activeLessonIndex > 0) setActiveLessonIndex(activeLessonIndex - 1);
                }}
                className={`px-4 py-2.5 rounded-xl font-bold font-quran text-xs flex items-center gap-2 transition-all cursor-pointer ${
                  activeLessonIndex === 0
                    ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 shadow-sm'
                }`}
              >
                <ArrowRight className="w-4 h-4" />
                <span>الدرس السابق</span>
              </button>

              <span className="text-xs font-bold text-slate-600 font-sans">
                {activeLessonIndex + 1} / {unit.lessons.length}
              </span>

              {activeLessonIndex < unit.lessons.length - 1 && (
                <button
                  type="button"
                  onClick={() => setActiveLessonIndex(activeLessonIndex + 1)}
                  className="px-4 py-2.5 rounded-xl font-bold font-quran text-xs flex items-center gap-2 transition-all cursor-pointer bg-emerald-900 hover:bg-emerald-950 text-amber-300 shadow-sm"
                >
                  <span>الدرس التالي</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* If on the last lesson: Prominent Card to start 35-questions exam */}
            {activeLessonIndex === unit.lessons.length - 1 && (
              <button
                type="button"
                onClick={handleFinishUnitAndStartExam}
                className="w-full sm:w-auto bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-extrabold font-quran px-5 py-2.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer text-xs sm:text-sm"
              >
                <Award className="w-4 h-4 text-slate-950" />
                <span>
                  {isMakharij
                    ? '🎉 أتممت دروس الباب! خوض اختبار الـ 35 سؤالاً الآن ❯'
                    : '🎉 أتممت دروس الباب! الانتقال للاختبار التقييمي ❯'}
                </span>
              </button>
            )}
          </div>

          {/* Special Banner for Makharij at last lesson */}
          {activeLessonIndex === unit.lessons.length - 1 && isMakharij && (
            <div className="bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 rounded-2xl p-6 sm:p-7 border-2 border-amber-400 text-white shadow-xl space-y-3 font-tajawal">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="bg-amber-400 text-slate-950 px-3 py-0.5 rounded-full text-[11px] font-bold font-quran shadow">
                      بنك الـ 50 سؤالاً المعتمد
                    </span>
                    <span className="bg-emerald-800 text-amber-300 px-3 py-0.5 rounded-full text-[11px] font-bold font-quran border border-emerald-700">
                      35 سؤالاً عشوائياً للدارس
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold font-quran text-amber-200">
                    الاختبار التقييمي لحقيبة مخارج الحروف وصفاتها
                  </h3>
                  <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                    بمجرد إتمامك لدروس الباب، يمكنك الآن خوض الاختبار الفوري المكون من 35 سؤالاً عشوائياً تم اختيارها بدقة من أصل 50 سؤالاً في بنك الأسئلة الشامل.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleFinishUnitAndStartExam}
                  className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold font-quran px-6 py-3 rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer text-xs sm:text-sm shrink-0 whitespace-nowrap"
                >
                  <Award className="w-4 h-4 text-slate-950" />
                  <span>بدء الاختبار (35 سؤالاً) الآن ❯</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {viewMode === 'quiz' && (
        /* Unit Review & Short Quiz Section */
        <div className="space-y-8">
          {/* Makharij 35 from 50 Bank Special Exam Banner */}
          {isMakharij && (
            <div className="bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 rounded-2xl p-6 sm:p-7 border-2 border-amber-400 text-white shadow-xl space-y-4 font-tajawal">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="bg-amber-400 text-slate-950 text-xs font-bold px-3 py-1 rounded-full font-quran shadow">
                      بنك الأسئلة الشامل (50 سؤالاً)
                    </span>
                    <span className="bg-emerald-800 text-amber-300 text-xs font-bold px-3 py-1 rounded-full border border-emerald-700">
                      35 سؤالاً عشوائياً لكل محاولة
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold font-quran text-amber-100">
                    الاختبار التقييمي لحقيبة مخارج الحروف وصفاتها
                  </h3>
                  <p className="text-xs sm:text-sm text-emerald-100 max-w-2xl leading-relaxed">
                    وفقاً للحقيبة المنهجية، تم إعداد بنك متكامل مكون من 50 سؤالاً متخصصاً في المخارج والصفات وتخليص المتجاورات، يتم اختيار 35 سؤالاً عشوائياً منها آلياً لتظهر للدارس بعد إتمام دراسة الباب.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleFinishUnitAndStartExam}
                  className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold font-quran px-6 py-3.5 rounded-xl shadow-lg transition-all transform hover:scale-105 flex items-center gap-2 cursor-pointer text-xs sm:text-sm shrink-0 whitespace-nowrap"
                >
                  <Award className="w-5 h-5 text-slate-950" />
                  <span>بدء اختبار الـ 35 سؤالاً الآن ❯</span>
                </button>
              </div>
            </div>
          )}
          {/* Unit Review Box */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-xl font-bold font-quran text-slate-900 border-b border-slate-100 pb-2">
              مراجعة شاملة لمحتوى {unit.title}
            </h2>
            <div className="prose prose-emerald text-xs sm:text-sm text-slate-700 whitespace-pre-line leading-relaxed font-tajawal">
              {unit.unitReviewMarkdown}
            </div>
          </div>

          {/* Interactive Mind Map for Unit */}
          <MindMapView data={unit.mindMap} unitTitle={unit.title} />

          {/* Unit Quiz Box */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-600" />
                <h3 className="text-lg font-bold font-quran text-slate-900">{unit.quiz.title}</h3>
              </div>

              {quizSubmitted && (
                <button
                  onClick={handleQuizReset}
                  className="flex items-center gap-1 text-xs bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl hover:bg-slate-200 transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  إعادة الاختبار
                </button>
              )}
            </div>

            <div className="space-y-6">
              {quizQuestions.map((q, idx) => {
                const selectedOpt = quizAnswers[q.id];
                const isCorrect = selectedOpt === q.correctIndex;

                return (
                  <div key={q.id} className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                    <div className="font-bold font-quran text-base text-slate-900">
                      0{idx + 1}. {q.question}
                    </div>

                    <div className="space-y-2">
                      {q.options.map((opt, optIdx) => {
                        const isSelected = selectedOpt === optIdx;
                        let btnStyle = 'bg-white border-slate-200 text-slate-800 hover:bg-slate-100';

                        if (quizSubmitted) {
                          if (optIdx === q.correctIndex) {
                            btnStyle = 'bg-emerald-100 border-emerald-400 text-emerald-950 font-bold';
                          } else if (isSelected) {
                            btnStyle = 'bg-rose-100 border-rose-400 text-rose-950';
                          }
                        } else if (isSelected) {
                          btnStyle = 'bg-emerald-900 text-amber-300 font-bold';
                        }

                        return (
                          <button
                            key={optIdx}
                            onClick={() => handleQuizSelect(q.id, optIdx)}
                            disabled={quizSubmitted}
                            className={`w-full text-right p-3 rounded-xl border text-xs font-tajawal transition-all flex items-center justify-between ${btnStyle}`}
                          >
                            <span>{opt}</span>
                            <span className="w-4 h-4 rounded-full border border-slate-300 shrink-0 flex items-center justify-center">
                              {isSelected && <span className="w-2 h-2 rounded-full bg-amber-400" />}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {quizSubmitted && (
                      <div className="bg-emerald-950 text-emerald-200 p-3 rounded-xl text-xs space-y-1">
                        <span className="font-bold text-amber-300 font-quran">نموذج الإجابة والتعليل:</span>
                        <p>{q.explanation}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {!quizSubmitted && (
              <div className="text-center pt-2">
                <button
                  onClick={handleQuizSubmit}
                  className="bg-emerald-900 text-amber-300 font-bold px-6 py-2.5 rounded-xl font-quran text-sm hover:bg-emerald-950 transition-all shadow-md"
                >
                  اعتماد الإجابات ونموذج التصحيح
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Lesson Classifier Modal for Teacher */}
      {showClassifierModal && (
        <LessonClassifierModal
          initialCourseId={courseId}
          initialUnitId={unit.id}
          initialLessonId={currentLesson.id}
          onClose={() => setShowClassifierModal(false)}
          onSuccess={() => {
            setShowClassifierModal(false);
          }}
        />
      )}

      {/* Explanatory Video Player Modal for Student & Teacher */}
      {showVideoModal && effectiveVideoUrl && (() => {
        const videoData = getEmbedVideoData(effectiveVideoUrl);

        return (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
            <div className="bg-slate-950 border border-slate-700 w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
              {/* Modal Header */}
              <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900 border-b border-slate-800 text-white">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center shrink-0">
                    <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                  </div>
                  <div className="truncate">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-red-600/90 text-white px-2 py-0.5 rounded-full font-bold">
                        فيديو الشرح المرئي
                      </span>
                      <span className="text-xs text-amber-400 font-bold truncate">
                        {unit.title}
                      </span>
                    </div>
                    <h3 className="text-sm sm:text-base font-bold font-quran text-slate-100 truncate">
                      {currentLesson.title}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={effectiveVideoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    title="فتح الفيديو في نافذة جديدة"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button
                    type="button"
                    onClick={() => setShowVideoModal(false)}
                    className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                    title="إغلاق المشغل"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Video Player Body (Responsive 16:9) */}
              <div className="relative w-full bg-black aspect-video flex items-center justify-center">
                {videoData.type === 'youtube' || videoData.type === 'vimeo' ? (
                  <iframe
                    src={videoData.embedUrl}
                    title={currentLesson.title}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                ) : videoData.type === 'video' ? (
                  <video
                    src={videoData.embedUrl}
                    controls
                    autoPlay
                    className="w-full h-full object-contain"
                  >
                    متصفحك لا يدعم تشغيل الفيديو مباشرة.
                  </video>
                ) : (
                  <div className="p-8 text-center space-y-4 max-w-md">
                    <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center mx-auto text-amber-400">
                      <ExternalLink className="w-8 h-8" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-white font-quran">
                        رابط وسائط خارجي
                      </h4>
                      <p className="text-xs text-slate-400 mt-1">
                        تم تزويد هذا الدرس برابط وسائط خارجي. يمكنك فتحه مباشرة في نافذة منفصلة.
                      </p>
                    </div>
                    <a
                      href={videoData.embedUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition-all shadow-lg"
                    >
                      <Play className="w-4 h-4 fill-white" />
                      <span>فتح مشغل الفيديو الخارجي</span>
                    </a>
                  </div>
                )}
              </div>

              {/* Footer with pedagogical guidance */}
              <div className="px-5 py-3 bg-slate-900/90 border-t border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-slate-300">
                    نصيحة تعليمية: تابع الشرح وركز على مخارج الحروف وضوابط الأداء الصوتي.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowVideoModal(false)}
                  className="text-amber-400 hover:text-amber-300 font-bold self-end sm:self-auto cursor-pointer"
                >
                  العودة لنص الدرس ↩
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Teacher Edit Video URL Modal */}
      {isEditingVideoUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border-2 border-amber-400/50 rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold font-quran text-amber-300 flex items-center gap-2">
                <Video className="w-5 h-5 text-amber-400" />
                <span>إدارة وتعديل رابط فيديو الشرح للدرس</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsEditingVideoUrl(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              ضع رابط فيديو يوتيوب أو Vimeo أو رابط ملف MP4 مباشر. سيظهر للطالب زر «تشغيل فيديو الشرح» في رأس الدرس فور الحفظ.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-amber-300">رابط الفيديو (URL):</label>
              <input
                type="url"
                value={videoUrlInput}
                onChange={(e) => setVideoUrlInput(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=... أو رابط مباشر"
                className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl p-3 text-slate-100 text-xs dir-ltr font-mono outline-none"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => handleSaveVideoUrl('')}
                className="text-xs text-rose-400 hover:text-rose-300 underline"
              >
                حذف رابط الفيديو
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingVideoUrl(false)}
                  className="px-4 py-2 rounded-xl text-xs bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveVideoUrl(videoUrlInput)}
                  className="px-5 py-2 rounded-xl text-xs bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold font-quran shadow-md"
                >
                  حفظ الرابط
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
